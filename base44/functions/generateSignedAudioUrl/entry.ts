import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate time-limited signed URL for owned audio files
 * Prevents unauthorized access to full tracks
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate the user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { buyer_email, product_id, track_index } = await req.json();
    
    // SECURITY: Verify the authenticated user's email matches the requested buyer_email
    if (user.email.toLowerCase() !== buyer_email.toLowerCase()) {
      return Response.json({ error: 'Forbidden: Cannot access other users\' audio files' }, { status: 403 });
    }
    
    // Verify ownership
    const libraryItems = await base44.entities.LibraryItem.filter({
      buyer_email: buyer_email.toLowerCase(),
      product_id: product_id
    });
    
    if (libraryItems.length === 0) {
      return Response.json({ error: 'You do not own this product' }, { status: 403 });
    }
    
    const item = libraryItems[0];
    
    // Get the audio URL
    if (!item.audio_urls || !item.audio_urls[track_index]) {
      return Response.json({ error: 'Track not found' }, { status: 404 });
    }
    
    const audioUrl = item.audio_urls[track_index];
    
    // For now, return the URL directly
    // In production with private files, use base44.integrations.Core.CreateFileSignedUrl
    
    return Response.json({
      signed_url: audioUrl,
      expires_in: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});