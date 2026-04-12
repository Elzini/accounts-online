import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ valid: false, error: 'No auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const token = authHeader.replace('Bearer ', '');

    // Use getClaims to validate JWT without requiring an active session
    const claimsClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await claimsClient.auth.getClaims(token);

    let userEmail: string | null = null;
    let userId: string | null = null;

    if (!claimsError && claimsData?.claims) {
      userEmail = claimsData.claims.email as string;
      userId = claimsData.claims.sub as string;
    }

    // If getClaims failed, try admin getUserById as fallback
    if (!userEmail && !claimsError) {
      // Try to decode JWT manually to get sub
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          userId = payload.sub;
          userEmail = payload.email;
        }
      } catch {
        // ignore decode errors
      }
    }

    // Final fallback: use admin API to look up user
    if (!userEmail && userId) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: adminUser } = await adminClient.auth.admin.getUserById(userId);
      if (adminUser?.user?.email) {
        userEmail = adminUser.user.email;
      }
    }

    if (!userEmail) {
      console.error('verify-password: could not resolve user email');
      return new Response(JSON.stringify({ valid: false, error: 'Auth failed' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { currentPassword } = await req.json();
    if (!currentPassword) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing password' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify password by attempting sign-in with a separate isolated client
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sign out the verify client session immediately
    await verifyClient.auth.signOut();

    return new Response(JSON.stringify({ valid: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-password error:', err);
    return new Response(JSON.stringify({ valid: false, error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
