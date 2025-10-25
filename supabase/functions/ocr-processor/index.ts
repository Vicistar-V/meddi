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

    // Call Google Cloud Vision API
    const visionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!visionApiKey) {
      console.error('Google Cloud Vision API key not configured');
      return new Response(
        JSON.stringify({ error: 'OCR service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Google Cloud Vision API for OCR...');
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
      console.error('Google Cloud Vision error:', visionResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'OCR processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionData = await visionResponse.json();
    console.log('Google Cloud Vision response received');

    const detectedText = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';
    console.log('Detected text length:', detectedText.length);

    if (!detectedText) {
      return new Response(
        JSON.stringify({ 
          medications: [],
          raw_text: '',
          error: 'No text detected in image'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the text to extract multiple medications
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

interface ParsedMedication {
  name: string;
  dosage: string;
  instructions: string;
}

function parseMedicationInfo(text: string): {
  medications: ParsedMedication[];
  raw_text: string;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const medications: ParsedMedication[] = [];

  // Common medication line patterns:
  // "Betaloc 100mg - 1 tab BID"
  // "Cimetidine 50 mg - 2 tabs TID"
  // "Aspirin 81mg daily"
  const medicationLinePattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|%))\s*[-–—:]?\s*(.+)$/i;
  
  // Alternative pattern: medication name on one line, dosage/instructions on next
  const namePattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s*$/;
  const dosagePattern = /(\d+\.?\d*\s*(?:mg|mcg|g|ml|%))/i;

  // Skip non-medication header lines
  const skipPatterns = [
    /^(rx|prescription|patient|doctor|dr\.|pharmacy|date|refill|sig|disp|quantity)/i,
    /^(name|dob|address|phone|instructions)/i,
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // dates
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header/non-medication lines
    if (skipPatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    // Try to match full medication line with dosage and instructions
    const fullMatch = line.match(medicationLinePattern);
    if (fullMatch) {
      medications.push({
        name: fullMatch[1].trim(),
        dosage: fullMatch[2].trim(),
        instructions: fullMatch[3].trim() || 'As directed'
      });
      continue;
    }

    // Try to match medication name, then look ahead for dosage/instructions
    const nameMatch = line.match(namePattern);
    if (nameMatch && line.length >= 3 && line.length <= 50) {
      const name = nameMatch[1].trim();
      let dosage = '';
      let instructions = '';

      // Look at next 2 lines for dosage and instructions
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j];
        
        // Found dosage
        const dosageMatch = nextLine.match(dosagePattern);
        if (dosageMatch && !dosage) {
          dosage = dosageMatch[1].trim();
          // Rest of line might be instructions
          const instructionPart = nextLine.replace(dosagePattern, '').replace(/^[-–—:]\s*/, '').trim();
          if (instructionPart.length > 5) {
            instructions = instructionPart;
          }
        } else if (!instructions && nextLine.length > 5 && nextLine.length < 200) {
          // Might be instructions line
          const lowerNext = nextLine.toLowerCase();
          if (lowerNext.includes('take') || lowerNext.includes('tab') || 
              lowerNext.includes('daily') || lowerNext.includes('times')) {
            instructions = nextLine;
          }
        }
      }

      // Only add if we found at least a dosage
      if (dosage) {
        medications.push({
          name,
          dosage,
          instructions: instructions || 'As directed'
        });
        i += 2; // Skip the lines we just processed
      }
    }
  }

  // If no structured medications found, try a more lenient approach
  if (medications.length === 0) {
    for (const line of lines) {
      if (skipPatterns.some(pattern => pattern.test(line))) continue;
      
      // Find any line with a dosage
      const dosageMatch = line.match(dosagePattern);
      if (dosageMatch) {
        // Extract name (words before dosage)
        const beforeDosage = line.substring(0, line.indexOf(dosageMatch[0])).trim();
        const afterDosage = line.substring(line.indexOf(dosageMatch[0]) + dosageMatch[0].length).trim();
        
        if (beforeDosage.length >= 3 && beforeDosage.length <= 50) {
          medications.push({
            name: beforeDosage,
            dosage: dosageMatch[0].trim(),
            instructions: afterDosage.replace(/^[-–—:]\s*/, '').trim() || 'As directed'
          });
        }
      }
    }
  }

  // Remove duplicates based on name
  const uniqueMedications = medications.reduce((acc, med) => {
    if (!acc.find(m => m.name.toLowerCase() === med.name.toLowerCase())) {
      acc.push(med);
    }
    return acc;
  }, [] as ParsedMedication[]);

  return {
    medications: uniqueMedications,
    raw_text: text
  };
}