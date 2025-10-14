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

    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=en',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm',
        },
        body: audioFile,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Deepgram API error:', error);
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in deepgram-stt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
