import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, subdomain, company_id } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    switch (action) {
      case 'resolve': {
        // Resolve subdomain to company
        if (!subdomain) {
          return jsonResponse({ error: 'subdomain required' }, 400);
        }

        const { data, error } = await supabase
          .from('companies')
          .select('id, name, subdomain, is_active, company_type')
          .eq('subdomain', subdomain.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        if (!data) {
          return jsonResponse({ 
            resolved: false, 
            error: 'Tenant not found',
            subdomain 
          }, 404);
        }

        // Check rate limit for this tenant
        const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
          p_company_id: data.id,
        });

        if (rateLimitOk === false) {
          return jsonResponse({
            resolved: false,
            error: 'Rate limit exceeded',
            retry_after: 60,
          }, 429);
        }

        return jsonResponse({
          resolved: true,
          tenant: {
            id: data.id,
            name: data.name,
            subdomain: data.subdomain,
            company_type: data.company_type,
            schema: `tenant_${data.id.replace(/-/g, '_')}`,
          },
        });
      }

      case 'health': {
        // Health check for a specific tenant
        if (!company_id) {
          return jsonResponse({ error: 'company_id required' }, 400);
        }

        const { data: company } = await supabase
          .from('companies')
          .select('id, name, subdomain, is_active')
          .eq('id', company_id)
          .single();

        if (!company) {
          return jsonResponse({ healthy: false, error: 'Company not found' }, 404);
        }

        // Check schema exists
        const { data: schemaExists } = await supabase.rpc('check_tenant_schema_exists', {
          p_company_id: company_id,
        });

        // Check encryption key
        const { data: encKey } = await supabase
          .from('tenant_encryption_keys')
          .select('id')
          .eq('company_id', company_id)
          .maybeSingle();

        // Check resource quota
        const { data: quota } = await supabase
          .from('tenant_resource_quotas')
          .select('max_requests_per_minute, max_storage_mb, max_users')
          .eq('company_id', company_id)
          .maybeSingle();

        return jsonResponse({
          healthy: true,
          tenant: {
            id: company.id,
            name: company.name,
            subdomain: company.subdomain,
            is_active: company.is_active,
          },
          isolation: {
            schema_exists: !!schemaExists,
            encryption_configured: !!encKey,
            quotas_configured: !!quota,
            quotas: quota || null,
          },
        });
      }

      case 'list': {
        // List all active tenants with their routing info
        const { data: tenants, error } = await supabase
          .from('companies')
          .select('id, name, subdomain, is_active, company_type, created_at')
          .order('created_at', { ascending: true });

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({
          tenants: tenants?.map(t => ({
            ...t,
            url: t.subdomain ? `https://${t.subdomain}.elzini.com` : null,
            schema: `tenant_${t.id.replace(/-/g, '_')}`,
          })),
          total: tenants?.length || 0,
          active: tenants?.filter(t => t.is_active).length || 0,
          configured: tenants?.filter(t => t.subdomain).length || 0,
        });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('Tenant router error:', err);
    return jsonResponse({ 
      error: err instanceof Error ? err.message : 'Internal server error' 
    }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
