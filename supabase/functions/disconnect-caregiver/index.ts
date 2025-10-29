import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Disconnecting caregiver relationship for user:', user.id);

    // Fetch user's profile to determine their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('caregiver_id, patient_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let otherUserId: string | null = null;

    // Determine if user is a patient or caregiver and get the other user's ID
    if (profile.caregiver_id) {
      // User is a patient with a caregiver
      otherUserId = profile.caregiver_id;
      console.log('User is patient, disconnecting from caregiver:', otherUserId);
    } else if (profile.patient_id) {
      // User is a caregiver
      otherUserId = profile.patient_id;
      console.log('User is caregiver, disconnecting from patient:', otherUserId);
    } else {
      console.log('No caregiver relationship found');
      return new Response(
        JSON.stringify({ error: 'No caregiver connection found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform the disconnection
    // 1. Clear current user's caregiver/patient relationship
    const { error: updateSelfError } = await supabase
      .from('profiles')
      .update({
        caregiver_id: null,
        patient_id: null,
      })
      .eq('id', user.id);

    if (updateSelfError) {
      console.error('Error updating own profile:', updateSelfError);
      return new Response(
        JSON.stringify({ error: 'Failed to disconnect' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Clear the other user's relationship
    const { error: updateOtherError } = await supabase
      .from('profiles')
      .update({
        caregiver_id: null,
        patient_id: null,
      })
      .eq('id', otherUserId);

    if (updateOtherError) {
      console.error('Error updating other user profile:', updateOtherError);
      // Note: We don't rollback here as partial disconnection is acceptable
    }

    // 3. Deactivate any active invitations between these users
    const { error: deactivateError } = await supabase
      .from('invitations')
      .update({ is_active: false })
      .or(`created_by_user_id.eq.${user.id},created_by_user_id.eq.${otherUserId}`)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating invitations:', deactivateError);
    }

    console.log('Successfully disconnected caregiver relationship');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
