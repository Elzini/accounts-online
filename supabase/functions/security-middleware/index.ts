import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

interface SecurityCheckRequest {
  action: 'validate_ip' | 'log_access' | 'check_session';
  company_id?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface SecurityLogEntry {
  user_id: string;
  company_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  entity_type: string;
  entity_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SecurityCheckRequest = await req.json();

    switch (body.action) {
      case 'validate_ip': {
        // Get user's company and check IP restrictions
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (!profile?.company_id) {
          return new Response(
            JSON.stringify({ valid: false, error: 'No company associated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if IP restriction is enabled for this company
        const { data: settings } = await supabaseClient
          .from('app_settings')
          .select('value')
          .eq('company_id', profile.company_id)
          .eq('key', 'allowed_ips')
          .single();

        if (settings?.value) {
          const allowedIPs = settings.value.split(',').map((ip: string) => ip.trim());
          const isAllowed = allowedIPs.includes(clientIP) || allowedIPs.includes('*');
          
          if (!isAllowed) {
            // Log blocked access attempt
            await supabaseClient.from('audit_logs').insert({
              user_id: user.id,
              company_id: profile.company_id,
              action: 'blocked_ip_access',
              entity_type: 'security',
              ip_address: clientIP,
              user_agent: userAgent,
              new_data: { attempted_ip: clientIP, allowed_ips: allowedIPs }
            });

            return new Response(
              JSON.stringify({ 
                valid: false, 
                error: 'Access denied: IP address not allowed',
                your_ip: clientIP 
              }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        return new Response(
          JSON.stringify({ valid: true, ip: clientIP }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'log_access': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (profile?.company_id) {
          await supabaseClient.from('audit_logs').insert({
            user_id: user.id,
            company_id: profile.company_id,
            action: 'user_access',
            entity_type: 'session',
            ip_address: clientIP,
            user_agent: userAgent,
            new_data: { 
              timestamp: new Date().toISOString(),
              action_details: body 
            }
          });
        }

        return new Response(
          JSON.stringify({ logged: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_session': {
        // Verify session is still valid and user belongs to active company
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select(`
            company_id,
            companies!inner (
              id,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Profile not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const company = profile.companies as { id: string; is_active: boolean };
        if (!company?.is_active) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Company is inactive' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check 2FA if enabled
        const { data: twoFA } = await supabaseClient
          .from('user_2fa')
          .select('is_enabled')
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({ 
            valid: true, 
            company_id: profile.company_id,
            two_fa_enabled: twoFA?.is_enabled || false,
            ip: clientIP
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Security middleware error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
