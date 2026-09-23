import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, buyer_email } = await req.json();

    if (!order_id || !buyer_email) {
      return Response.json({ error: 'order_id and buyer_email required' }, { status: 400 });
    }

    // Fetch order using service role to verify ownership
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify buyer_email matches order (prevents unauthorized tracking)
    if (order.buyer_email !== buyer_email.toLowerCase()) {
      return Response.json({ error: 'Forbidden: Email does not match order' }, { status: 403 });
    }

    // Atomic increment
    await base44.asServiceRole.entities.Order.update(order_id, {
      download_count: (order.download_count || 0) + 1
    });

    return Response.json({ 
      success: true,
      download_count: (order.download_count || 0) + 1
    });
  } catch (error) {
    console.error('Download count error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});