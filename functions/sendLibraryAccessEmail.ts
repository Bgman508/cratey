import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user has any purchases
    const items = await base44.asServiceRole.entities.LibraryItem.filter({ 
      buyer_email: email.toLowerCase() 
    });

    if (items.length === 0) {
      return Response.json({ error: 'No purchases found' }, { status: 404 });
    }

    // Generate access token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await base44.asServiceRole.entities.LibraryAccessToken.create({
      buyer_email: email.toLowerCase(),
      token,
      expires_at: expiresAt.toISOString(),
      used: false
    });

    const accessUrl = `${Deno.env.get('BASE44_APP_URL')}/Library?email=${encodeURIComponent(email)}&token=${token}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '🎵 Access Your CRATEY Library',
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      <h1 style="margin: 0; font-size: 24px;">CRATEY</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Your Music Library</h2>
      <p>You have <strong>${items.length} item${items.length !== 1 ? 's' : ''}</strong> in your crate.</p>
      <p>Click below to access all your CRATEY purchases. Download anytime, anywhere.</p>
      <p style="color: #999; font-size: 14px; margin-top: 20px;">This link expires in 24 hours.</p>
    </div>
    <div class="cta">
      <a href="${accessUrl}" class="button">Open My Library</a>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} CRATEY • Own your music</p>
    </div>
  </div>
</body>
</html>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Library access email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});