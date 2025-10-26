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
    const { medication_name } = await req.json();
    
    if (!medication_name || typeof medication_name !== 'string' || medication_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate medication name length and characters
    const sanitizedName = medication_name.trim().substring(0, 100);
    
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
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

    // Get user's current medications
    const { data: medications, error: medsError } = await supabase
      .from('medications')
      .select('name')
      .eq('user_id', user.id);

    if (medsError) {
      console.error('Error fetching medications:', medsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch medications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking interactions for ${sanitizedName} with ${medications?.length || 0} existing medications`);

    // Mock drug interaction database with structured severity levels
    const knownInteractions: Record<string, Array<{ 
      drug: string; 
      severity: 'severe' | 'moderate' | 'minor'; 
      warning: string; 
      recommendation: string 
    }>> = {
      'aspirin': [
        { 
          drug: 'warfarin', 
          severity: 'severe', 
          warning: 'Increases risk of bleeding significantly. Combined use can lead to serious bleeding complications.', 
          recommendation: 'Consult your doctor before combining. May require dosage adjustment or alternative medication.' 
        },
        { 
          drug: 'ibuprofen', 
          severity: 'moderate', 
          warning: 'Reduces cardioprotective effect of aspirin when taken together.', 
          recommendation: 'Take ibuprofen at least 8 hours before or 30 minutes after aspirin if both are necessary.' 
        },
        { 
          drug: 'lisinopril', 
          severity: 'moderate', 
          warning: 'May reduce the blood pressure lowering effect of Lisinopril.', 
          recommendation: 'Monitor blood pressure regularly and report any changes to your doctor.' 
        },
      ],
      'warfarin': [
        { 
          drug: 'aspirin', 
          severity: 'severe', 
          warning: 'Significantly increases bleeding risk when taken together.', 
          recommendation: 'Avoid combination unless specifically prescribed by doctor. Requires close monitoring.' 
        },
        { 
          drug: 'vitamin k', 
          severity: 'moderate', 
          warning: 'Can reduce effectiveness of warfarin anticoagulation therapy.', 
          recommendation: 'Maintain consistent vitamin K intake. Consult doctor before changing diet.' 
        },
      ],
      'lisinopril': [
        { 
          drug: 'aspirin', 
          severity: 'moderate', 
          warning: 'May reduce blood pressure lowering effects of Lisinopril.', 
          recommendation: 'Monitor blood pressure regularly and report elevated readings.' 
        },
        { 
          drug: 'potassium', 
          severity: 'moderate', 
          warning: 'May cause dangerously high potassium levels (hyperkalemia).', 
          recommendation: 'Avoid potassium supplements without doctor approval. Regular blood tests recommended.' 
        },
      ],
      'metformin': [
        { 
          drug: 'alcohol', 
          severity: 'moderate', 
          warning: 'Increases risk of lactic acidosis, a serious condition.', 
          recommendation: 'Limit alcohol consumption. Avoid heavy drinking while taking metformin.' 
        },
      ],
      'simvastatin': [
        { 
          drug: 'grapefruit', 
          severity: 'moderate', 
          warning: 'Grapefruit can increase statin levels in blood, raising risk of side effects including muscle damage.', 
          recommendation: 'Avoid grapefruit and grapefruit juice completely while taking this medication.' 
        },
      ],
      'ibuprofen': [
        { 
          drug: 'aspirin', 
          severity: 'moderate', 
          warning: 'Reduces the cardioprotective benefits of low-dose aspirin.', 
          recommendation: 'Timing is important - take ibuprofen at least 8 hours before aspirin or 30 minutes after.' 
        },
      ],
    };

    const interactions: any[] = [];
    const searchMedName = sanitizedName.toLowerCase();

    // Check for known interactions
    if (medications && medications.length > 0) {
      // Check if new medication interacts with existing ones
      if (knownInteractions[searchMedName]) {
        for (const userMed of medications) {
          const userMedName = userMed.name.toLowerCase();
          const matchingInteractions = knownInteractions[searchMedName].filter(
            interaction => interaction.drug.toLowerCase() === userMedName
          );
          interactions.push(...matchingInteractions);
        }
      }

      // Also check reverse interactions (user's existing meds that interact with new med)
      for (const userMed of medications) {
        const userMedName = userMed.name.toLowerCase();
        if (knownInteractions[userMedName]) {
          const matchingInteractions = knownInteractions[userMedName].filter(
            interaction => interaction.drug.toLowerCase() === searchMedName
          );
          // Add interactions with swapped drug name
          interactions.push(...matchingInteractions.map(i => ({
            ...i,
            drug: userMed.name, // Show the existing medication name
          })));
        }
      }
    }

    console.log(`Found ${interactions.length} interactions`);

    return new Response(
      JSON.stringify({ 
        has_interactions: interactions.length > 0,
        checked_medication: sanitizedName,
        checked_against: medications?.map(m => m.name) || [],
        interactions: interactions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in drug-interaction-checker:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});