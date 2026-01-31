import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { buyer_email, order_id, products, is_bundle, thank_you_note } = await req.json();

    if (!buyer_email || !order_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify order exists and matches buyer email
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];
    
    if (!order || order.buyer_email !== buyer_email.toLowerCase()) {
      return Response.json({ error: 'Order not found or email mismatch' }, { status: 404 });
    }

    // Build email content
    const productListHtml = products.map(p => 
      `<li style="margin-bottom: 8px;"><strong>${p.title}</strong> by ${p.artist_name}</li>`
    ).join('');
    
    const bundleNote = is_bundle 
      ? `<div style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 8px; margin-top: 16px;">
           <p style="margin: 0; color: #166534; font-weight: 600;">🎁 Bundle Discount Applied!</p>
         </div>` 
      : '';
    
    const thankYouSection = thank_you_note 
      ? `<div style="border-top: 2px solid #e5e5e5; margin-top: 24px; padding-top: 24px;">
           <p style="font-style: italic; color: #666; margin-bottom: 8px;">A personal message from the artist:</p>
           <p style="color: #333;">${thank_you_note}</p>
         </div>` 
      : '';

    const libraryUrl = `${Deno.env.get('BASE44_APP_URL') || 'https://yourapp.base44.app'}/Library?email=${encodeURIComponent(buyer_email)}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #000000; color: #ffffff; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 20px; color: #333333; line-height: 1.6; }
    .cta { text-align: center; padding: 30px 20px; }
    .button { display: inline-block; padding: 14px 32px; background: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🎵 Thanks for your purchase!</h1>
    </div>
    <div class="content">
      <p>You now own:</p>
      <ul style="margin: 16px 0; padding-left: 20px;">
        ${productListHtml}
      </ul>
      ${bundleNote}
      <p>Your music is ready to download. No expiration, no limits. It's yours forever.</p>
      ${thankYouSection}
      <p style="font-size: 14px; color: #999; margin-top: 24px;">Order ID: ${order_id}</p>
    </div>
    <div class="cta">
      <a href="${libraryUrl}" class="button">Download Your Music</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} CRATEY • Artists keep 92% of every sale</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: buyer_email,
        subject: is_bundle ? `🎵 You own ${products.length} releases!` : `🎵 You own "${products[0].title}"`,
        body: emailBody
      });

      return Response.json({ 
        success: true,
        delivered: true,
        recipient: buyer_email
      });
    } catch (emailError) {
      console.error('Email delivery failed:', emailError);
      return Response.json({ 
        success: false,
        delivered: false,
        error: emailError.message,
        recipient: buyer_email
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Purchase email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});