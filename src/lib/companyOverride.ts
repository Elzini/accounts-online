/**
 * Global company ID override for super admin impersonation.
 * When set, all getCurrentCompanyId() calls across services
 * will return this value instead of the user's profile company_id.
 */
let _overrideCompanyId: string | null = null;

export function setCompanyOverride(companyId: string | null) {
  _overrideCompanyId = companyId;
}

export function getCompanyOverride(): string | null {
  return _overrideCompanyId;
}
