/**
 * Cloudflare Worker - Subdomain Tenant Router
 * 
 * Deploy this to Cloudflare Workers to handle wildcard subdomains.
 * It extracts the subdomain, validates it against your database,
 * and proxies the request to your Lovable app.
 * 
 * Setup:
 * 1. Create a Cloudflare Worker
 * 2. Add a wildcard DNS route: *.elzini.com → Worker
 * 3. Set environment variables:
 *    - SUPABASE_URL: your Supabase project URL
 *    - SUPABASE_ANON_KEY: your Supabase anon key
 *    - ORIGIN_URL: your Lovable app URL (e.g., https://accounts-online.lovable.app)
 * 4. Deploy this worker
 */

// Subdomains that should NOT be treated as tenants (but should still be proxied)
const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'ns1', 'ns2'];

// Your base domains
const BASE_DOMAINS = ['elzini.com', 'alnimar-car.com'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Extract subdomain
    let subdomain = null;
    let baseDomain = null;

    for (const domain of BASE_DOMAINS) {
      if (hostname.endsWith(`.${domain}`) && hostname !== domain) {
        subdomain = hostname.replace(`.${domain}`, '');
        baseDomain = domain;
        break;
      }
    }

    // If no subdomain or it's reserved, proxy directly to origin
    if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return fetch(env.ORIGIN_URL + url.pathname + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }

    // Validate tenant exists in database
    try {
      const supabaseResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/rpc/resolve_company_by_subdomain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ p_subdomain: subdomain }),
        }
      );

      const companies = await supabaseResponse.json();

      if (!companies || companies.length === 0) {
        // Tenant not found - show error page
        return new Response(
          `<!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><meta charset="UTF-8"><title>غير موجود</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f5f5f5;">
            <div style="text-align:center;">
              <h1 style="color:#e53e3e;">الشركة غير موجودة</h1>
              <p>النطاق الفرعي <strong>${subdomain}</strong> غير مسجل في النظام.</p>
              <a href="https://${baseDomain}" style="color:#3182ce;">العودة للصفحة الرئيسية</a>
            </div>
          </body>
          </html>`,
          {
            status: 404,
            headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          }
        );
      }

      // Valid tenant - proxy to Lovable app with tenant context
      const originUrl = new URL(env.ORIGIN_URL + url.pathname + url.search);
      
      const modifiedRequest = new Request(originUrl, {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
      });

      // Add tenant header for the app to read
      modifiedRequest.headers.set('X-Tenant-ID', companies[0].id);
      modifiedRequest.headers.set('X-Tenant-Subdomain', subdomain);

      const response = await fetch(modifiedRequest);
      
      // Clone response and add CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Tenant-ID', companies[0].id);
      newResponse.headers.set('X-Tenant-Subdomain', subdomain);
      
      return newResponse;

    } catch (error) {
      console.error('Tenant resolution error:', error);
      return fetch(env.ORIGIN_URL + url.pathname + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }
  },
};
