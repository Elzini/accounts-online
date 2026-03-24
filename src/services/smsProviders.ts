/**
 * SMS Provider Configs - STUBBED (sms_provider_configs table removed)
 */
export async function fetchSmsProviderConfigs(): Promise<any[]> {
  return [];
}

export async function upsertSmsProviderConfig(_existing: any, _companyId: string, _provider: string, _config: Record<string, string>): Promise<void> {
  throw new Error('SMS provider feature is being redesigned');
}
