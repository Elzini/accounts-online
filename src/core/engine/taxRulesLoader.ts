/**
 * Tax Rules Loader
 * Merges Module defaults with DB overrides per company.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { TaxRulesConfig, TaxRule, GENERAL_TAX_RULES } from './taxRules';
import { ModuleRegistry } from './moduleRegistry';

/**
 * Load tax rules for a company: DB overrides → Module defaults → General defaults.
 */
export async function loadTaxRules(
  companyId: string,
  companyType?: string | null
): Promise<TaxRulesConfig> {
  // 1. Get module defaults
  const module = ModuleRegistry.getForType(companyType || 'general_trading');
  const moduleDefaults = module?.taxRules || GENERAL_TAX_RULES;

  // 2. Try DB overrides
  const { data: dbRules } = await supabase
    .from('tax_rules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (!dbRules || dbRules.length === 0) {
    return moduleDefaults;
  }

  // 3. Merge: DB rules override module defaults
  const rules: TaxRule[] = dbRules.map((r: any) => ({
    id: r.rule_key,
    label: r.label,
    method: r.method,
    rate: Number(r.rate),
    appliesTo: {
      itemCondition: r.applies_to_condition || undefined,
      transactionType: r.applies_to_transaction || undefined,
    },
    marginInclusive: r.margin_inclusive,
  }));

  return {
    defaultRate: moduleDefaults.defaultRate,
    taxName: moduleDefaults.taxName,
    rules,
  };
}
