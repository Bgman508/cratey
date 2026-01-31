import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const emailTemplate = (title, bodyContent, ctaText, ctaUrl) => `
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
    .divider { border-top: 1px solid #e5e5e5; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">CRATEY</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${title}</h2>
      ${bodyContent}
    </div>
    ${ctaText && ctaUrl ? `
    <div class="cta">
      <a href="${ctaUrl}" class="button">${ctaText}</a>
    </div>
    ` : ''}
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} CRATEY. Own your music.</p>
    </div>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // SECURITY: Only allow admin users or service role (backend function) calls
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { to, title, bodyContent, ctaText, ctaUrl, subject } = await req.json();

    if (!to || !subject || !bodyContent) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const htmlBody = emailTemplate(title || subject, bodyContent, ctaText, ctaUrl);

    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body: htmlBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending styled email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});