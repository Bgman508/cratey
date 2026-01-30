/**
 * Scheduled function: Send yearly reminder emails about owned music
 * Run this once per year (January 1st)
 * 
 * To schedule: Enable backend functions, then set up a scheduled task
 */

export default async function send_yearly_reaccess_emails(params, context) {
  const { base44 } = context;
  
  // Get all unique buyer emails
  const allLibraryItems = await base44.entities.LibraryItem.list();
  const buyerEmails = [...new Set(allLibraryItems.map(item => item.buyer_email))];
  
  let sentCount = 0;
  
  for (const email of buyerEmails) {
    // Get their library items
    const items = await base44.entities.LibraryItem.filter({ 
      buyer_email: email 
    });
    
    if (items.length === 0) continue;
    
    // Build email content
    const itemsList = items.map((item, i) => 
      `${i + 1}. "${item.product_title}" by ${item.artist_name}`
    ).join('\n');
    
    const libraryUrl = `${process.env.APP_URL || 'https://your-app.base44.app'}/Library?email=${encodeURIComponent(email)}`;
    
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: '🎵 Your Music Library – Never Lose Access',
      body: `
Hi there!

This is your yearly reminder that you own ${items.length} release${items.length !== 1 ? 's' : ''} on CRATEY:

${itemsList}

Access your library anytime:
${libraryUrl}

Your music is permanently yours. No subscriptions, no expiration.

Enjoy!
— The CRATEY Team
      `.trim()
    });
    
    sentCount++;
  }
  
  return {
    success: true,
    emails_sent: sentCount,
    message: `Sent ${sentCount} re-access reminder emails`
  };
}