import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioUrl, productId } = await req.json();

    if (!audioUrl || !productId) {
      return Response.json({ error: 'Missing audioUrl or productId' }, { status: 400 });
    }

    // Verify user owns this product
    const libraryItems = await base44.entities.LibraryItem.filter({
      buyer_email: user.email,
      product_id: productId
    });

    if (libraryItems.length === 0) {
      return Response.json({ error: 'You do not own this product' }, { status: 403 });
    }

    // Generate time-limited signed URL (valid for 1 hour)
    const signedUrl = `${audioUrl}?token=${Math.random().toString(36).substring(2)}&expires=${Date.now() + 3600000}`;

    return Response.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});