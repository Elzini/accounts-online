import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwtPayload(token: string): { sub?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ valid: false, error: 'No auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const token = authHeader.replace('Bearer ', '');
    
    // First try admin getUser (works when session is valid)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    let userEmail: string | null = null;

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    
    if (user?.email) {
      userEmail = user.email;
    } else {
      // Fallback: decode JWT to get user ID, then look up via admin API
      console.log('verify-password: session lookup failed, trying JWT decode fallback');
      const payload = decodeJwtPayload(token);
      
      if (payload?.sub) {
        // Check if JWT is not expired
        const exp = (payload as Record<string, unknown>).exp as number;
        if (exp && exp * 1000 < Date.now()) {
          return new Response(JSON.stringify({ valid: false, error: 'Token expired' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Look up user by ID using admin API
        const { data: adminUser, error: adminError } = await adminClient.auth.admin.getUserById(payload.sub);
        if (adminUser?.user?.email) {
          userEmail = adminUser.user.email;
        }
      }
    }

    if (!userEmail) {
      console.error('verify-password: could not resolve user email');
      return new Response(JSON.stringify({ valid: false, error: 'Session expired' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { currentPassword } = await req.json();
    if (!currentPassword) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing password' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify password by attempting sign-in with a separate client
    const verifyClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
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
