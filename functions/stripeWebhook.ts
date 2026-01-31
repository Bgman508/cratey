import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get metadata from session
      const { product_id, buyer_email, is_bundle, bundle_product_ids } = session.metadata;
      
      if (!product_id || !buyer_email) {
        console.error('Missing metadata in session');
        return Response.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Fetch product(s)
      const productIds = is_bundle === 'true' 
        ? [product_id, ...JSON.parse(bundle_product_ids || '[]')]
        : [product_id];

      // Create orders and library items for each product
      for (const pid of productIds) {
        const products = await base44.asServiceRole.entities.Product.filter({ id: pid });
        const product = products[0];
        
        if (!product) continue;

        const editionNumber = product.edition_type === 'limited' 
          ? (product.total_sales || 0) + 1 
          : null;

        const productPrice = Math.round(session.amount_total / productIds.length);
        const platformFee = Math.round(productPrice * 0.08);
        const artistPayout = productPrice - platformFee;

        // Create order
        const order = await base44.asServiceRole.entities.Order.create({
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
        const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await base44.asServiceRole.entities.LibraryItem.create({
          buyer_email: buyer_email.toLowerCase(),
          product_id: product.id,
          order_id: order.id,
          product_title: product.title,
          artist_name: product.artist_name,
          artist_slug: product.artist_slug,
          cover_url: product.cover_url,
          audio_urls: product.audio_urls || [],
          track_names: product.track_names || [],
          access_token: accessToken,
          edition_name: product.edition_name,
          edition_number: editionNumber,
          purchase_date: new Date().toISOString()
        });

        // Update product stats
        await base44.asServiceRole.entities.Product.update(product.id, {
          total_sales: (product.total_sales || 0) + 1,
          total_revenue_cents: (product.total_revenue_cents || 0) + productPrice
        });
      }

      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});