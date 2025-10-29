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

    // Parse request body
    const { code } = await req.json();

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid invitation code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Accepting invitation code:', code, 'for user:', user.id);

    // Look up the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation not found or inactive:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.error('Invitation expired:', invitation.expires_at);
      return new Response(
        JSON.stringify({ error: 'Invitation code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-connection
    if (invitation.created_by_user_id === user.id) {
      console.error('User attempting to connect to themselves');
      return new Response(
        JSON.stringify({ error: 'You cannot connect to your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caregiver is already connected to another patient
    const { data: existingConnection } = await supabase
      .from('profiles')
      .select('patient_id')
      .eq('id', user.id)
      .single();

    if (existingConnection?.patient_id) {
      console.log('Caregiver already connected to another patient, disconnecting first');
      // Disconnect from previous patient
      const { error: disconnectError } = await supabase
        .from('profiles')
        .update({ caregiver_id: null })
        .eq('id', existingConnection.patient_id);

      if (disconnectError) {
        console.error('Error disconnecting from previous patient:', disconnectError);
      }
    }

    // Perform the connection in a transaction-like manner
    // 1. Update patient's profile to set caregiver_id
    const { error: updatePatientError } = await supabase
      .from('profiles')
      .update({ caregiver_id: user.id })
      .eq('id', invitation.created_by_user_id);

    if (updatePatientError) {
      console.error('Error updating patient profile:', updatePatientError);
      return new Response(
        JSON.stringify({ error: 'Failed to connect to patient' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update caregiver's profile to set patient_id
    const { error: updateCaregiverError } = await supabase
      .from('profiles')
      .update({ patient_id: invitation.created_by_user_id })
      .eq('id', user.id);

    if (updateCaregiverError) {
      console.error('Error updating caregiver profile:', updateCaregiverError);
      // Rollback patient update
      await supabase
        .from('profiles')
        .update({ caregiver_id: null })
        .eq('id', invitation.created_by_user_id);

      return new Response(
        JSON.stringify({ error: 'Failed to establish connection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Deactivate the invitation and mark as accepted
    const { error: deactivateError } = await supabase
      .from('invitations')
      .update({
        is_active: false,
        accepted_by_user_id: user.id,
      })
      .eq('id', invitation.id);

    if (deactivateError) {
      console.error('Error deactivating invitation:', deactivateError);
      // Note: We don't rollback here as the connection is already established
    }

    // Fetch patient's name for the response
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', invitation.created_by_user_id)
      .single();

    console.log('Successfully connected caregiver to patient');

    return new Response(
      JSON.stringify({
        success: true,
        patientName: patientProfile?.full_name || 'Patient',
        patientId: invitation.created_by_user_id,
      }),
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
