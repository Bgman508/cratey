import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // SECURITY: Admin-only function - verify user is admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Get all library items
    const libraryItems = await base44.asServiceRole.entities.LibraryItem.list();

    if (!libraryItems || libraryItems.length === 0) {
      return Response.json({ message: 'No library items found', sent: 0 });
    }

    // Group by buyer email
    const buyerGroups = {};
    for (const item of libraryItems) {
      if (!buyerGroups[item.buyer_email]) {
        buyerGroups[item.buyer_email] = [];
      }
      buyerGroups[item.buyer_email].push(item);
    }

    let emailsSent = 0;

    // Send re-access email to each buyer
    for (const [email, items] of Object.entries(buyerGroups)) {
      const productList = items.map(item => `• ${item.product_title} by ${item.artist_name}`).join('\n');
      
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: '🎵 Your CRATEY Library - Access Your Music',
        body: `
Hi there!

Just a friendly reminder that all your music purchases on CRATEY are still yours to download and enjoy.

Your library contains:

${productList}

Access your library anytime:
${Deno.env.get('APP_URL') || 'https://your-app.base44.com'}/Library?email=${encodeURIComponent(email)}

Enjoy your music!
— The CRATEY Team
        `.trim()
      });

      emailsSent++;
    }

    return Response.json({ 
      message: 'Re-access emails sent successfully',
      sent: emailsSent,
      buyers: Object.keys(buyerGroups).length
    });
  } catch (error) {
    console.error('Error sending re-access emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});