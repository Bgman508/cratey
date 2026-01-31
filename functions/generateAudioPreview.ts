import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioUrl, durationSeconds = 30 } = await req.json();

    if (!audioUrl) {
      return Response.json({ error: 'audioUrl required' }, { status: 400 });
    }

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return Response.json({ error: 'Failed to fetch audio file' }, { status: 400 });
    }

    const audioBlob = await audioResponse.blob();
    
    // For now, use FFmpeg to generate preview (requires FFmpeg in Deno environment)
    // Alternative: Return original file with metadata for client-side trimming
    // This is a production-grade placeholder that returns the original
    // In production, you'd use FFmpeg or similar server-side tool
    
    const { file_url } = await base44.integrations.Core.UploadFile({ 
      file: audioBlob 
    });

    return Response.json({ 
      preview_url: file_url,
      note: 'Server-side preview generation - using full file as fallback. Add FFmpeg for trimming.'
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});