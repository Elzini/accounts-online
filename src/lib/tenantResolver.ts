/**
 * Tenant Resolver - Extracts subdomain from hostname and resolves to company
 * 
 * Supports:
 * - company1.elzini.com → tenant: "company1"
 * - company2.yourdomain.com → tenant: "company2"
 * - localhost / lovable.app → null (no tenant, use normal auth flow)
 */

// Domains where subdomains are meaningful (add your domains here)
const TENANT_DOMAINS = ['elzini.com', 'alnimar-car.com'];

// Subdomains to ignore (not tenant identifiers)
const IGNORED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp'];

/**
 * Extract the subdomain/tenant slug from the current hostname.
 * Returns null if on a non-tenant domain (localhost, lovable.app, bare domain).
 */
export function extractSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Skip localhost and IP addresses
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Skip Lovable preview/staging domains
  if (hostname.endsWith('.lovable.app')) {
    return null;
  }

  // Check against known tenant domains
  for (const domain of TENANT_DOMAINS) {
    if (hostname.endsWith(`.${domain}`)) {
      const subdomain = hostname.replace(`.${domain}`, '');
      
      // Ignore www, app, etc.
      if (IGNORED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null;
      }
      
      // Valid tenant subdomain found
      return subdomain.toLowerCase();
    }
  }

  return null;
}

/**
 * Get the base domain for the current hostname.
 */
export function getBaseDomain(): string | null {
  const hostname = window.location.hostname;
  
  for (const domain of TENANT_DOMAINS) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return domain;
    }
  }
  
  return null;
}

/**
 * Build a URL for a specific tenant subdomain.
 */
export function buildTenantUrl(subdomain: string, baseDomain?: string): string {
  const domain = baseDomain || getBaseDomain() || TENANT_DOMAINS[0];
  const protocol = window.location.protocol;
  return `${protocol}//${subdomain}.${domain}`;
}
