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

    // Resolve user email and ID from JWT
    let userEmail: string | null = null;
    let userId: string | null = null;

    // Try getClaims first
    const claimsClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await claimsClient.auth.getClaims(token);

    if (!claimsError && claimsData?.claims) {
      userEmail = claimsData.claims.email as string;
      userId = claimsData.claims.sub as string;
    }

    // Fallback: decode JWT manually
    if (!userEmail) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          userId = payload.sub;
          userEmail = payload.email;
        }
      } catch {
        // ignore
      }
    }

    // Final fallback: admin API
    if (!userEmail && userId) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: adminUser } = await adminClient.auth.admin.getUserById(userId);
      if (adminUser?.user?.email) {
        userEmail = adminUser.user.email;
      }
    }

    if (!userEmail || !userId) {
      return new Response(JSON.stringify({ valid: false, error: 'Auth failed' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing password' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify current password
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      // Clean up
      await verifyClient.auth.signOut().catch(() => {});
      return new Response(JSON.stringify({ valid: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sign out the verify session
    await verifyClient.auth.signOut().catch(() => {});

    // If newPassword provided, update it via admin API (no session needed)
    if (newPassword) {
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ valid: true, updated: false, error: 'Password too short' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError.message);
        return new Response(JSON.stringify({ valid: true, updated: false, error: updateError.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ valid: true, updated: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
