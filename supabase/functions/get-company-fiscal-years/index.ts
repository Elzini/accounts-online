import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ fiscal_years: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Look up the user by email
    const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(
        JSON.stringify({ fiscal_years: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      // Don't reveal if email exists or not - return empty
      return new Response(
        JSON.stringify({ fiscal_years: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's company from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return new Response(
        JSON.stringify({ fiscal_years: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get fiscal years for this company (only open ones)
    const { data: fiscalYears, error: fyError } = await supabaseAdmin
      .from('fiscal_years')
      .select('id, name, start_date, end_date, is_current')
      .eq('company_id', profile.company_id)
      .eq('status', 'open')
      .order('start_date', { ascending: false });

    if (fyError) {
      console.error('Error fetching fiscal years:', fyError);
      return new Response(
        JSON.stringify({ fiscal_years: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ fiscal_years: fiscalYears || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ fiscal_years: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
