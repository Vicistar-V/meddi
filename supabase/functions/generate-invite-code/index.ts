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

    console.log('Generating invitation code for user:', user.id);

    // Deactivate any existing active invitations for this user
    const { error: deactivateError } = await supabase
      .from('invitations')
      .update({ is_active: false })
      .eq('created_by_user_id', user.id)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old invitations:', deactivateError);
    }

    // Generate a unique 6-character alphanumeric code
    const generateCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Try to generate a unique code (with retry logic)
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('invitation_code', code)
        .single();

      if (!existing) {
        break; // Code is unique
      }

      code = generateCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error('Failed to generate unique code after', maxAttempts, 'attempts');
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique invitation code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the new invitation
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        invitation_code: code,
        created_by_user_id: user.id,
        is_active: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated invitation code:', code);

    return new Response(
      JSON.stringify({
        code: invitation.invitation_code,
        expires_at: invitation.expires_at,
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
