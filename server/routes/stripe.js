import express from 'express';
import Stripe from 'stripe';
import { AppError } from '../middleware/errorHandler.js';
import { products } from './products.js';
import { artists } from './auth.js';
import { createOrder } from './orders.js';
import { createLibraryItem } from './library.js';
import { sendPurchaseEmail } from '../services/email.js';

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe functionality will be disabled.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

// Create checkout session
router.post('/create-checkout-session', async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Stripe not configured', 500);
    }

    const { product_ids, buyer_email, is_bundle } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      throw new AppError('product_ids required', 400);
    }

    if (!buyer_email) {
      throw new AppError('buyer_email required', 400);
    }

    // Fetch all products
    const lineItems = [];
    let totalAmount = 0;

    for (const productId of product_ids) {
      const product = products.get(productId);

      if (!product) {
        throw new AppError(`Product ${productId} not found`, 404);
      }

      // Check stock for limited editions
      if (product.edition_type === 'limited' && product.total_sales >= product.edition_limit) {
        throw new AppError(`${product.title} is sold out`, 400);
      }

      // Calculate price based on drop window
      let price = product.price_cents;
      if (product.drop_window_enabled && product.drop_window_end) {
        const dropEnded = new Date(product.drop_window_end) < new Date();
        if (dropEnded && product.archive_price_cents) {
          price = product.archive_price_cents;
        }
      }

      // Apply bundle discount
      if (is_bundle && product_ids.length > 1 && product.bundle_discount_percent) {
        price = Math.round(price * (1 - product.bundle_discount_percent / 100));
      }

      totalAmount += price;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.title} by ${product.artist_name}`,
            images: product.cover_url ? [product.cover_url] : [],
          },
          unit_amount: price,
        },
        quantity: 1,
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${clientUrl}/Library?email=${encodeURIComponent(buyer_email)}`,
      cancel_url: `${clientUrl}/ProductPage?id=${product_ids[0]}`,
      customer_email: buyer_email,
      metadata: {
        product_id: product_ids[0],
        buyer_email: buyer_email,
        is_bundle: is_bundle ? 'true' : 'false',
        bundle_product_ids: is_bundle ? JSON.stringify(product_ids.slice(1)) : '[]'
      }
    });

    res.json({
      session_id: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    if (!stripe || !webhookSecret) {
      throw new AppError('Stripe webhook not configured', 500);
    }

    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const { product_id, buyer_email, is_bundle, bundle_product_ids } = session.metadata;
      
      if (!product_id || !buyer_email) {
        console.error('Missing metadata in session');
        return res.status(400).json({ error: 'Missing metadata' });
      }

      // Parse bundle product IDs
      const productIds = is_bundle === 'true' 
        ? [product_id, ...JSON.parse(bundle_product_ids || '[]')]
        : [product_id];

      const productsList = [];

      // Create orders and library items for each product
      for (const pid of productIds) {
        const product = products.get(pid);
        
        if (!product) continue;

        const editionNumber = product.edition_type === 'limited' 
          ? (product.total_sales || 0) + 1 
          : null;

        const productPrice = Math.round(session.amount_total / productIds.length);
        const platformFee = Math.round(productPrice * 0.08);
        const artistPayout = productPrice - platformFee;

        // Create order
        const order = await createOrder({
          artist_id: product.artist_id,
          product_id: product.id,
          product_title: product.title,
          artist_name: product.artist_name,
          buyer_email: buyer_email.toLowerCase(),
          amount_cents: productPrice,
          platform_fee_cents: platformFee,
          artist_payout_cents: artistPayout,
          currency: session.currency?.toUpperCase() || 'USD',
          status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          edition_name: product.edition_name,
          edition_number: editionNumber
        });

        // Create library item
        await createLibraryItem({
          buyer_email: buyer_email.toLowerCase(),
          product_id: product.id,
          order_id: order.id,
          product_title: product.title,
          artist_name: product.artist_name,
          artist_slug: product.artist_slug,
          cover_url: product.cover_url,
          audio_urls: product.audio_urls || [],
          track_names: product.track_names || [],
          edition_name: product.edition_name,
          edition_number: editionNumber,
          purchase_date: new Date().toISOString()
        });

        // Update product stats
        product.total_sales = (product.total_sales || 0) + 1;
        product.total_revenue_cents = (product.total_revenue_cents || 0) + productPrice;
        products.set(pid, product);

        // Update artist stats
        const artist = artists.get(product.artist_id);
        if (artist) {
          artist.totalSales = (artist.totalSales || 0) + 1;
          artist.totalRevenue = (artist.totalRevenue || 0) + artistPayout;
          artists.set(artist.id, artist);
        }

        productsList.push({
          title: product.title,
          artist_name: product.artist_name
        });
      }

      // Send purchase confirmation email
      try {
        const firstProduct = products.get(productIds[0]);
        const artist = firstProduct ? artists.get(firstProduct.artist_id) : null;

        await sendPurchaseEmail({
          buyer_email,
          products: productsList,
          is_bundle: is_bundle === 'true',
          thank_you_note: artist?.thankYouNote || null
        });
      } catch (emailError) {
        console.warn('Purchase email failed:', emailError);
        // Don't fail webhook if email fails
      }

      return res.json({ received: true });
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Get Stripe connect URL (for artists)
router.post('/connect', async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Stripe not configured', 500);
    }

    // This would create a Stripe Connect account for the artist
    // For now, return a placeholder
    res.json({
      message: 'Stripe Connect integration placeholder',
      note: 'Implement Stripe Connect onboarding for artists to receive payouts'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
