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

    const interactions: any[] = [];

    // Check interactions with OpenFDA API
    if (medications && medications.length > 0) {
      for (const med of medications) {
        try {
          const encodedNewMed = encodeURIComponent(sanitizedName);
          const encodedExistingMed = encodeURIComponent(med.name);
          
          // Query OpenFDA for the new medication
          const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodedNewMed}"+OR+openfda.generic_name:"${encodedNewMed}"&limit=1`;
          
          const fdaResponse = await fetch(fdaUrl);
          
          if (fdaResponse.ok) {
            const fdaData = await fdaResponse.json();
            
            if (fdaData.results && fdaData.results.length > 0) {
              const drugLabel = fdaData.results[0];
              
              // Check drug interactions field
              const drugInteractions = drugLabel.drug_interactions?.[0] || '';
              
              // Simple keyword matching for existing medications
              if (drugInteractions.toLowerCase().includes(med.name.toLowerCase())) {
                interactions.push({
                  drug: med.name,
                  warning: `Potential interaction detected. ${drugInteractions.substring(0, 300)}...`
                });
              }
              
              // Check warnings and precautions
              const warnings = drugLabel.warnings?.[0] || '';
              if (warnings.toLowerCase().includes(med.name.toLowerCase())) {
                interactions.push({
                  drug: med.name,
                  warning: `Warning found in drug label. Please consult your healthcare provider.`
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error checking interaction with ${med.name}:`, error);
          // Continue checking other medications
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        interactions,
        checked_against: medications?.map(m => m.name) || []
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