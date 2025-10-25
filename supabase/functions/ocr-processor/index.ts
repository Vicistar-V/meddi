import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_path } = await req.json();
    
    if (!image_path || typeof image_path !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing OCR for image:', image_path);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase
      .storage
      .from('prescription_uploads')
      .download(image_path);

    if (downloadError || !imageData) {
      console.error('Error downloading image:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert image to base64 data URL
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = arrayBufferToBase64(arrayBuffer);
    const mimeType = image_path.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Call Lovable AI (Gemini 2.5 Flash) for intelligent OCR
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Lovable AI API key not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI (Gemini 2.5 Flash) for intelligent medication extraction...');

    const structuredPrompt = `You are an expert at reading pharmacy prescription labels and pill bottle labels.

This is a SINGLE pill bottle label. Extract ONE medication from it.

Extract the following information:
- medicationName: The drug name (e.g., "Lisinopril", "Betaloc", "Metformin")
- dosage: The strength with unit (e.g., "100mg", "20 mcg", "500mg")
- quantityInstruction: How much to take (e.g., "Take one tablet", "2 tabs", "1 capsule")
- frequencyInstruction: How often (e.g., "twice daily", "once daily", "three times daily")

Common medical abbreviations to interpret:
- BID = twice daily
- TID = three times daily  
- QID = four times daily
- QD or once daily = once daily
- PRN = as needed
- PO = by mouth

Return ONLY a JSON object with this exact structure (no markdown, no code blocks, no explanations):
{
  "medicationName": "string",
  "dosage": "string",
  "quantityInstruction": "string",
  "frequencyInstruction": "string"
}

If no medication is found or the label is unreadable, return: { "medicationName": null, "dosage": null, "quantityInstruction": null, "frequencyInstruction": null }

Be precise and extract only the information that is clearly visible on the label.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: structuredPrompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      // Handle specific error codes with user-friendly messages
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            medication: null,
            error: 'Rate limit exceeded. Please try again in a moment.',
            error_code: 'RATE_LIMIT'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            medication: null,
            error: 'AI quota exceeded. Please add credits or use manual entry.',
            error_code: 'PAYMENT_REQUIRED'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          medication: null,
          error: 'OCR processing failed. Please try manual entry.',
          error_code: 'AI_ERROR'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI response received');

    const aiContent = aiData.choices?.[0]?.message?.content || '{}';
    console.log('AI extracted content:', aiContent);

    // Parse the AI response to extract single medication
    let medication: { name: string; dosage: string; instructions: string } | null = null;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = aiContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedData = JSON.parse(cleanedContent);
      
      // Validate and transform the data structure
      if (parsedData.medicationName) {
        medication = {
          name: parsedData.medicationName,
          dosage: parsedData.dosage || '',
          instructions: `${parsedData.quantityInstruction || ''} ${parsedData.frequencyInstruction || ''}`.trim() || 'As directed'
        };
        
        console.log('Successfully extracted medication:', medication.name);
      } else {
        console.log('No medication found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', aiContent);
    }

    return new Response(
      JSON.stringify({ 
        medication,
        raw_text: aiContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ocr-processor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // Process 32KB at a time to avoid stack overflow
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}