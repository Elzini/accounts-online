import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message, status }, status);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Expected path: /api-gateway/v1/{resource}
    // After edge function routing, pathParts = ['v1', resource, ...rest]
    
    const version = pathParts[0]; // 'v1'
    const resource = pathParts[1]; // 'customers', 'suppliers', etc.
    const resourceId = pathParts[2]; // optional ID

    if (version !== 'v1') {
      return errorResponse('Unsupported API version. Use /v1/', 400);
    }

    // Authenticate via API key or Bearer token
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let companyId: string | null = null;
    let userId: string | null = null;

    if (apiKey) {
      // Validate API key from api_keys table
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('company_id, user_id, is_active, permissions, rate_limit, request_count, last_used_at')
        .eq('key_hash', await hashApiKey(apiKey))
        .eq('is_active', true)
        .single();

      if (keyError || !keyData) {
        return errorResponse('Invalid or inactive API key', 401);
      }

      // Check expiration
      companyId = keyData.company_id;
      userId = keyData.user_id;

      // Update usage stats
      await supabase
        .from('api_keys')
        .update({ 
          request_count: (keyData.request_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('key_hash', await hashApiKey(apiKey));

    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      
      const { data: { user }, error } = await userClient.auth.getUser();
      if (error || !user) {
        return errorResponse('Invalid Bearer token', 401);
      }
      userId = user.id;

      // Get company from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      companyId = profile?.company_id || null;
    } else {
      return errorResponse('Authentication required. Provide x-api-key or Bearer token', 401);
    }

    if (!companyId) {
      return errorResponse('No company associated with this authentication', 403);
    }

    // IP Whitelisting Check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    const { data: ipCheck } = await supabase.rpc('check_tenant_ip_access', {
      p_tenant_id: companyId,
      p_ip_address: clientIp,
      p_request_path: url.pathname,
      p_request_method: req.method,
      p_user_agent: req.headers.get('user-agent'),
    });

    if (ipCheck && !ipCheck.allowed) {
      return errorResponse(`Access denied from IP: ${clientIp}. ${ipCheck.reason || ''}`, 403);
    }

    // Route to handler
    const method = req.method;
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await req.json() : null;

    const ALLOWED_RESOURCES = [
      'customers', 'suppliers', 'cars', 'sales', 
      'journal-entries', 'account-categories', 
      'invoices', 'expenses', 'vouchers',
      'fiscal-years', 'employees'
    ];

    if (!resource || !ALLOWED_RESOURCES.includes(resource)) {
      return jsonResponse({
        message: 'Elzini Public API v1',
        available_resources: ALLOWED_RESOURCES,
        documentation: '/api-gateway/v1/docs',
      });
    }

    // Map resource to table name
    const TABLE_MAP: Record<string, string> = {
      'customers': 'customers',
      'suppliers': 'suppliers',
      'cars': 'cars',
      'sales': 'sales',
      'journal-entries': 'journal_entries',
      'account-categories': 'account_categories',
      'expenses': 'expenses',
      'vouchers': 'vouchers',
      'fiscal-years': 'fiscal_years',
      'employees': 'employees',
    };

    const tableName = TABLE_MAP[resource];
    if (!tableName) {
      return errorResponse(`Resource '${resource}' not found`, 404);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    // Validate order_by against allowed columns
    const ALLOWED_ORDER_COLUMNS = ['created_at', 'updated_at', 'name', 'id', 'status', 'amount', 'date'];
    const rawOrderBy = url.searchParams.get('order_by') || 'created_at';
    const orderBy = ALLOWED_ORDER_COLUMNS.includes(rawOrderBy) ? rawOrderBy : 'created_at';
    const orderDir = url.searchParams.get('order_dir') === 'asc' ? true : false;
    
    // Sanitize search query: allow letters, digits, spaces, hyphens, Arabic chars only
    const rawSearch = url.searchParams.get('search') || '';
    const searchQuery = rawSearch.replace(/[^a-zA-Z0-9\s\-\u0600-\u06FF]/g, '').slice(0, 100);

    switch (method) {
      case 'GET': {
        if (resourceId) {
          // Get single record
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', resourceId)
            .eq('company_id', companyId)
            .single();

          if (error || !data) {
            return errorResponse('Record not found', 404);
          }
          return jsonResponse({ data });
        }

        // List records with pagination
        let query = supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .eq('company_id', companyId)
          .order(orderBy, { ascending: orderDir })
          .range(offset, offset + limit - 1);

        // Apply search if provided
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error, count } = await query;
        if (error) {
          return errorResponse(error.message, 500);
        }

        return jsonResponse({
          data,
          pagination: {
            page,
            limit,
            total: count,
            total_pages: Math.ceil((count || 0) / limit),
          },
        });
      }

      case 'POST': {
        if (!body) return errorResponse('Request body required', 400);
        
        const { data, error } = await supabase
          .from(tableName)
          .insert({ ...body, company_id: companyId })
          .select()
          .single();

        if (error) {
          return errorResponse(error.message, 422);
        }
        return jsonResponse({ data }, 201);
      }

      case 'PUT':
      case 'PATCH': {
        if (!resourceId) return errorResponse('Resource ID required', 400);
        if (!body) return errorResponse('Request body required', 400);

        // Remove fields that shouldn't be updated
        delete body.id;
        delete body.company_id;
        delete body.created_at;

        const { data, error } = await supabase
          .from(tableName)
          .update(body)
          .eq('id', resourceId)
          .eq('company_id', companyId)
          .select()
          .single();

        if (error) {
          return errorResponse(error.message, 422);
        }
        return jsonResponse({ data });
      }

      case 'DELETE': {
        if (!resourceId) return errorResponse('Resource ID required', 400);

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', resourceId)
          .eq('company_id', companyId);

        if (error) {
          return errorResponse(error.message, 422);
        }
        return jsonResponse({ message: 'Deleted successfully' });
      }

      default:
        return errorResponse('Method not allowed', 405);
    }

  } catch (err) {
    console.error('API Gateway error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
});

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
