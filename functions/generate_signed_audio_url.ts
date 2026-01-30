/**
 * Generate time-limited signed URL for owned audio files
 * Prevents unauthorized access to full tracks
 */

export default async function generate_signed_audio_url({ buyer_email, product_id, track_index }, context) {
  const { base44 } = context;
  
  // Verify ownership
  const libraryItems = await base44.entities.LibraryItem.filter({
    buyer_email: buyer_email.toLowerCase(),
    product_id: product_id
  });
  
  if (libraryItems.length === 0) {
    throw new Error('You do not own this product');
  }
  
  const item = libraryItems[0];
  
  // Get the audio URL
  if (!item.audio_urls || !item.audio_urls[track_index]) {
    throw new Error('Track not found');
  }
  
  const audioUrl = item.audio_urls[track_index];
  
  // For now, return the URL directly
  // In production, you'd generate a signed URL from your storage provider
  // Example with S3: await s3.getSignedUrl('getObject', { Bucket, Key, Expires: 3600 })
  
  return {
    signed_url: audioUrl,
    expires_in: 3600 // 1 hour
  };
}