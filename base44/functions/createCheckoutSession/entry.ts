import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { product_ids, buyer_email, is_bundle } = await req.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return Response.json({ error: 'product_ids required' }, { status: 400 });
    }

    if (!buyer_email) {
      return Response.json({ error: 'buyer_email required' }, { status: 400 });
    }

    // Fetch all products
    const lineItems = [];
    let totalAmount = 0;

    for (const productId of product_ids) {
      const products = await base44.asServiceRole.entities.Product.filter({ id: productId });
      const product = products[0];

      if (!product) {
        return Response.json({ error: `Product ${productId} not found` }, { status: 404 });
      }

      // Check stock for limited editions
      if (product.edition_type === 'limited' && product.total_sales >= product.edition_limit) {
        return Response.json({ error: `${product.title} is sold out` }, { status: 400 });
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
            images: [product.cover_url],
          },
          unit_amount: price,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/Library?email=${encodeURIComponent(buyer_email)}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/ProductPage?id=${product_ids[0]}`,
      customer_email: buyer_email,
      metadata: {
        product_id: product_ids[0],
        buyer_email: buyer_email,
        is_bundle: is_bundle ? 'true' : 'false',
        bundle_product_ids: is_bundle ? JSON.stringify(product_ids.slice(1)) : null
      }
    });

    return Response.json({ 
      session_id: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});