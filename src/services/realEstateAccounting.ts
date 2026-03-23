/**
 * Real Estate Project Accounting Workflow
 * 
 * Implements IFRS 15 / SOCPA compliant accounting:
 * 1. Project costs → "Projects Under Development" (asset, not expense)
 * 2. Unit sale → Cost transfer from Project Cost → COGS
 * 3. Revenue recognized only on confirmed sale
 * 4. Advance payments recorded as liabilities
 */

import { supabase } from '@/hooks/modules/useMiscServices';
import { JournalEngine } from '@/core/engine/journalEngine';

// ============================================================
// Account code resolution helper (supports new + legacy codes)
// ============================================================

/** Try multiple codes in priority order, return the first found */
async function resolveAccountFlex(companyId: string, ...codes: string[]): Promise<string | null> {
  const { data } = await supabase
    .from('account_categories')
    .select('id, code')
    .eq('company_id', companyId)
    .in('code', codes);
  if (!data?.length) return null;
  for (const code of codes) {
    const found = data.find((a: any) => a.code === code);
    if (found) return found.id;
  }
  return data[0].id;
}

/** Helper: create journal entry via Core Engine */
async function createEngineEntry(
  companyId: string,
  params: { entry_date: string; description: string; reference_type: string; reference_id: string; fiscal_year_id?: string | null },
  lines: Array<{ account_id: string; description: string; debit: number; credit: number }>
) {
  const engine = new JournalEngine(companyId);
  return engine.createEntry({
    company_id: companyId,
    fiscal_year_id: params.fiscal_year_id || '',
    entry_date: params.entry_date,
    description: params.description,
    reference_type: params.reference_type as any,
    reference_id: params.reference_id,
    is_posted: true,
    lines: lines.map(l => ({ ...l, description: l.description || null, cost_center_id: null })),
  });
}

async function resolveAccountId(companyId: string, code: string): Promise<string | null> {
  const { data } = await supabase
    .from('account_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('code', code)
    .single();
  return data?.id || null;
}

// ============================================================
// 1. Record Project Cost (capitalizes cost as asset)
// ============================================================
export async function recordProjectCost(params: {
  companyId: string;
  projectId: string;
  projectName: string;
  description: string;
  amount: number;
  costType: string;
  paymentAccountCode?: string;
  fiscalYearId?: string;
}): Promise<{ journalEntryId: string; projectCostId: string }> {
  const { companyId, projectId, projectName, description, amount, costType, paymentAccountCode, fiscalYearId } = params;

  if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  // مشاريع تحت التطوير: 1301 (template), legacy 1220
  const projectCostAccountId = await resolveAccountFlex(companyId, '1301', '1220');
  // البنك: 110201 (sub), 1102 (header), legacy 1121/1101
  const paymentAccountId = paymentAccountCode
    ? await resolveAccountId(companyId, paymentAccountCode)
    : await resolveAccountFlex(companyId, '110201', '1102', '1121', '1101');

  if (!projectCostAccountId) throw new Error('حساب المشاريع تحت التطوير (1301) غير موجود');
  if (!paymentAccountId) throw new Error('حساب الدفع غير موجود');

  const entry = await createEngineEntry(companyId, {
    entry_date: new Date().toISOString().split('T')[0],
    description: `تكلفة مشروع: ${projectName} - ${description}`,
    reference_type: 'project_cost',
    reference_id: projectId,
    fiscal_year_id: fiscalYearId,
  }, [
    { account_id: projectCostAccountId, description: `تكلفة ${costType} - ${projectName}`, debit: amount, credit: 0 },
    { account_id: paymentAccountId, description: `دفع تكلفة ${costType}`, debit: 0, credit: amount },
  ]);

  const { data: costRecord, error: costError } = await supabase
    .from('project_costs')
    .insert({
      company_id: companyId,
      project_id: projectId,
      description,
      cost_type: costType,
      unit_cost: amount,
      total_cost: amount,
      quantity: 1,
      journal_entry_id: entry.id,
    })
    .select()
    .single();

  if (costError) throw costError;

  return { journalEntryId: entry.id, projectCostId: costRecord.id };
}

// ============================================================
// 2. Record Customer Advance Payment (as liability)
// ============================================================
export async function recordAdvancePayment(params: {
  companyId: string;
  unitId: string;
  unitNumber: string;
  projectName: string;
  customerId: string;
  customerName: string;
  amount: number;
  fiscalYearId?: string;
}): Promise<string> {
  const { companyId, unitId, unitNumber, projectName, customerName, amount, fiscalYearId } = params;

  if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  // البنك: 110201 (sub), 1102, legacy 1121/1101
  const bankAccountId = await resolveAccountFlex(companyId, '110201', '1102', '1121', '1101');
  // دفعات مقدمة من العملاء: 2102 (template), legacy 2120
  const advancePaymentAccountId = await resolveAccountFlex(companyId, '2102', '2120');

  if (!bankAccountId) throw new Error('حساب البنك غير موجود');
  if (!advancePaymentAccountId) throw new Error('حساب الدفعات المقدمة غير موجود');

  const entry = await createEngineEntry(companyId, {
    entry_date: new Date().toISOString().split('T')[0],
    description: `دفعة مقدمة من ${customerName} - وحدة ${unitNumber} - ${projectName}`,
    reference_type: 'advance_payment',
    reference_id: unitId,
    fiscal_year_id: fiscalYearId,
  }, [
    { account_id: bankAccountId, description: `تحصيل دفعة مقدمة - ${customerName}`, debit: amount, credit: 0 },
    { account_id: advancePaymentAccountId, description: `دفعة مقدمة - وحدة ${unitNumber}`, debit: 0, credit: amount },
  ]);

  return entry.id;
}

// ============================================================
// 3. Calculate Unit Proportional Cost
// ============================================================
export async function calculateUnitCost(params: {
  companyId: string;
  projectId: string;
  unitId: string;
}): Promise<{ totalProjectCost: number; totalUnits: number; unitArea: number; totalArea: number; unitCost: number }> {
  const { companyId, projectId, unitId } = params;

  const { data: costs } = await supabase
    .from('project_costs')
    .select('total_cost')
    .eq('company_id', companyId)
    .eq('project_id', projectId);

  const totalProjectCost = (costs || []).reduce((s: number, c: any) => s + Number(c.total_cost || 0), 0);

  const { data: allUnits } = await supabase
    .from('re_units')
    .select('id, area')
    .eq('company_id', companyId)
    .eq('project_id', projectId);

  const { data: unit } = await supabase
    .from('re_units')
    .select('area')
    .eq('id', unitId)
    .single();

  const totalUnits = (allUnits || []).length;
  const unitArea = Number(unit?.area || 0);
  const totalArea = (allUnits || []).reduce((s: number, u: any) => s + Number(u.area || 0), 0);

  let unitCost: number;
  if (totalArea > 0 && unitArea > 0) {
    unitCost = (unitArea / totalArea) * totalProjectCost;
  } else if (totalUnits > 0) {
    unitCost = totalProjectCost / totalUnits;
  } else {
    unitCost = 0;
  }

  return { totalProjectCost, totalUnits, unitArea, totalArea, unitCost };
}

// ============================================================
// 4. Complete Unit Sale (Revenue Recognition + COGS Transfer)
// ============================================================
export async function completeUnitSale(params: {
  companyId: string;
  unitId: string;
  unitNumber: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  salePrice: number;
  advancePayments?: number;
  vatRate?: number;
  fiscalYearId?: string;
}): Promise<{ revenueEntryId: string; cogsEntryId: string; unitCost: number }> {
  const {
    companyId, unitId, unitNumber, projectId, projectName,
    customerName, salePrice, advancePayments = 0,
    vatRate = 0.15, fiscalYearId,
  } = params;

  if (salePrice <= 0) throw new Error('سعر البيع يجب أن يكون أكبر من صفر');

  const costCalc = await calculateUnitCost({ companyId, projectId, unitId });
  const unitCost = costCalc.unitCost;

  // Resolve accounts with fallback support
  const receivableId = await resolveAccountFlex(companyId, '1103', '1130', '1201');
  const advanceId = await resolveAccountFlex(companyId, '2102', '2120');
  const revenueId = await resolveAccountFlex(companyId, '4101', '4110');
  const vatId = await resolveAccountFlex(companyId, '2104', '210401', '2150', '2151');
  const cogsId = await resolveAccountFlex(companyId, '5102', '5110', '5101');
  const projectCostId = await resolveAccountFlex(companyId, '1301', '1220');

  if (!receivableId || !revenueId) throw new Error('حسابات الإيرادات غير مكتملة');
  if (!cogsId || !projectCostId) throw new Error('حسابات التكلفة غير مكتملة');

  const vatAmount = salePrice * vatRate;
  const netReceivable = salePrice + vatAmount - advancePayments;

  // --- Entry 1: Revenue Recognition (IFRS 15) ---
  const revenueLines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [];

  if (netReceivable > 0) {
    revenueLines.push({
      account_id: receivableId,
      description: `ذمم مدينة - ${customerName} - وحدة ${unitNumber}`,
      debit: netReceivable,
      credit: 0,
    });
  }

  if (advancePayments > 0 && advanceId) {
    revenueLines.push({
      account_id: advanceId,
      description: `ترحيل دفعات مقدمة - ${customerName}`,
      debit: advancePayments,
      credit: 0,
    });
  }

  revenueLines.push({
    account_id: revenueId,
    description: `إيراد بيع وحدة ${unitNumber} - ${projectName}`,
    debit: 0,
    credit: salePrice,
  });

  if (vatAmount > 0 && vatId) {
    revenueLines.push({
      account_id: vatId,
      description: `ضريبة مبيعات 15% - وحدة ${unitNumber}`,
      debit: 0,
      credit: vatAmount,
    });
  }

  const revenueEntry = await createJournalEntry(
    {
      company_id: companyId,
      entry_date: new Date().toISOString().split('T')[0],
      description: `اعتراف بإيراد بيع وحدة ${unitNumber} - ${projectName} - ${customerName}`,
      status: 'posted',
      reference_type: 'unit_sale_revenue',
      reference_id: unitId,
      fiscal_year_id: fiscalYearId || null,
    } as any,
    revenueLines
  );

  // --- Entry 2: COGS Transfer ---
  let cogsEntryId = '';
  if (unitCost > 0) {
    const cogsEntry = await createJournalEntry(
      {
        company_id: companyId,
        entry_date: new Date().toISOString().split('T')[0],
        description: `تحويل تكلفة وحدة مباعة ${unitNumber} - ${projectName} إلى تكلفة المبيعات`,
        status: 'posted',
        reference_type: 'unit_sale_cogs',
        reference_id: unitId,
        fiscal_year_id: fiscalYearId || null,
      } as any,
      [
        { account_id: cogsId, description: `تكلفة وحدة مباعة ${unitNumber}`, debit: unitCost, credit: 0 },
        { account_id: projectCostId, description: `تخفيض تكلفة مشروع ${projectName}`, debit: 0, credit: unitCost },
      ]
    );
    cogsEntryId = cogsEntry.id;
  }

  await supabase
    .from('re_units')
    .update({
      status: 'sold',
      cost: unitCost,
      sale_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', unitId);

  return { revenueEntryId: revenueEntry.id, cogsEntryId, unitCost };
}

// ============================================================
// 5. Get Project Profitability Summary (journal-based)
// ============================================================
export async function getProjectProfitability(companyId: string, projectId: string): Promise<{
  totalCosts: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossMargin: number;
  unitsTotal: number;
  unitsSold: number;
  unitsAvailable: number;
  costPerUnit: number;
  advancePaymentsBalance: number;
}> {
  const { data: costs } = await supabase
    .from('project_costs')
    .select('total_cost')
    .eq('company_id', companyId)
    .eq('project_id', projectId) as any;

  const totalCosts = (costs || []).reduce((s: number, c: any) => s + Number(c.total_cost || 0), 0);

  const { data: units } = await supabase
    .from('re_units')
    .select('id, status, sale_price, cost')
    .eq('company_id', companyId)
    .eq('project_id', projectId) as any;

  const allUnits = units || [];
  const soldUnits = allUnits.filter((u: any) => u.status === 'sold');
  const totalRevenue = soldUnits.reduce((s: number, u: any) => s + Number(u.sale_price || 0), 0);
  const totalCOGS = soldUnits.reduce((s: number, u: any) => s + Number(u.cost || 0), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const advanceQuery = supabase
    .from('journal_entries')
    .select('total_credit')
    .eq('company_id', companyId) as any;
  const { data: advanceEntries } = await advanceQuery.eq('status', 'posted');

  const totalAdvances = (advanceEntries || []).reduce((s: number, e: any) => s + Number(e.total_credit || 0), 0);
  const advancePaymentsBalance = Math.max(0, totalAdvances - totalRevenue);

  return {
    totalCosts,
    totalRevenue,
    totalCOGS,
    grossProfit,
    grossMargin,
    unitsTotal: allUnits.length,
    unitsSold: soldUnits.length,
    unitsAvailable: allUnits.filter((u: any) => u.status === 'available').length,
    costPerUnit: allUnits.length > 0 ? totalCosts / allUnits.length : 0,
    advancePaymentsBalance,
  };
}
