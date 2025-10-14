import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    if (!DEEPGRAM_API_KEY) {
      throw new Error('DEEPGRAM_API_KEY not configured');
    }

    console.log('Received request, reading body...');
    const contentType = req.headers.get('content-type') || '';
    
    let audioBlob: Blob;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio');
      
      if (!audioFile || !(audioFile instanceof Blob)) {
        throw new Error('No valid audio file provided in form data');
      }
      
      audioBlob = audioFile;
      console.log('Audio from FormData:', audioBlob.size, 'bytes');
    } else {
      // Handle JSON with base64 audio
      const body = await req.json();
      const { audio } = body;
      
      if (!audio) {
        throw new Error('No audio data provided');
      }
      
      console.log('Audio base64 length:', audio.length);
      
      // Decode base64 to binary
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      audioBlob = new Blob([bytes], { type: 'audio/webm' });
      console.log('Audio blob created:', audioBlob.size, 'bytes');
    }

    console.log('Sending to Deepgram...');
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': audioBlob.type,
        },
        body: audioBlob,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', response.status, errorText);
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Deepgram response:', JSON.stringify(data));
    
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    if (!transcript) {
      console.warn('No transcript found in response');
    } else {
      console.log('Transcript:', transcript);
    }

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in deepgram-stt:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transcript: '' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
