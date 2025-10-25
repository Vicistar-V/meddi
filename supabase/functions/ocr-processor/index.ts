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

    // Convert image to base64 using chunked approach to avoid stack overflow
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = arrayBufferToBase64(arrayBuffer);

    // Call Google Cloud Vision API
    const visionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!visionApiKey) {
      console.error('Google Cloud Vision API key not configured');
      return new Response(
        JSON.stringify({ error: 'OCR service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'OCR processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionData = await visionResponse.json();
    const detectedText = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';

    console.log('Detected text length:', detectedText.length);

    // Parse the text to extract medication information
    const parsed = parseMedicationInfo(detectedText);

    return new Response(
      JSON.stringify(parsed),
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

function parseMedicationInfo(text: string): {
  name: string;
  dosage: string;
  instructions: string;
  raw_text: string;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let name = '';
  let dosage = '';
  let instructions = '';

  // Common dosage patterns
  const dosagePatterns = [
    /(\d+\.?\d*\s*(mg|mcg|g|ml|tablets?|capsules?))/gi,
    /(\d+\.?\d*\s*milligrams?)/gi,
  ];

  // Common instruction keywords
  const instructionKeywords = [
    'take', 'tablets?', 'capsules?', 'daily', 'twice', 'times',
    'morning', 'evening', 'bedtime', 'meal', 'food', 'water',
    'as needed', 'directed', 'mouth', 'oral'
  ];

  // Try to find medication name (usually appears early and is in CAPS or Title Case)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip common non-medication words
    if (line.match(/^(rx|prescription|patient|doctor|pharmacy|date|refill)/i)) continue;
    
    // Check if line looks like a medication name (contains letters, possibly numbers)
    if (line.match(/^[A-Z][a-zA-Z\s]{2,30}$/)) {
      name = line;
      break;
    }
  }

  // Find dosage
  for (const line of lines) {
    for (const pattern of dosagePatterns) {
      const match = line.match(pattern);
      if (match) {
        dosage = match[0];
        break;
      }
    }
    if (dosage) break;
  }

  // Find instructions
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const hasKeyword = instructionKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(lowerLine)
    );
    
    if (hasKeyword && line.length > 10 && line.length < 200) {
      instructions = line;
      break;
    }
  }

  // Fallback: if no name found, use first substantial line
  if (!name && lines.length > 0) {
    name = lines.find(l => l.length > 3 && l.length < 50) || lines[0];
  }

  // Fallback: if no dosage found, look for any numbers with units
  if (!dosage) {
    const foundDosage = text.match(/\d+\.?\d*\s*(mg|mcg|g|ml)/i);
    if (foundDosage) dosage = foundDosage[0];
  }

  // Fallback: if no instructions found, look for sentence with "take"
  if (!instructions) {
    const foundInstruction = lines.find(l => 
      l.toLowerCase().includes('take') && l.length > 10
    );
    if (foundInstruction) instructions = foundInstruction;
  }

  return {
    name: name || 'Unknown Medication',
    dosage: dosage || 'Not detected',
    instructions: instructions || 'Please consult your prescription',
    raw_text: text
  };
}