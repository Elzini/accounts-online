/**
 * Real Estate Project Accounting Workflow
 * 
 * Implements IFRS 15 / SOCPA compliant accounting:
 * 1. Project costs → "Projects Under Development" (asset, not expense)
 * 2. Unit sale → Cost transfer from Project Cost → COGS
 * 3. Revenue recognized only on confirmed sale
 * 4. Advance payments recorded as liabilities
 */

import { supabase } from '@/integrations/supabase/client';
import { createJournalEntry } from './accounting';

// ============================================================
// Account code resolution helper
// ============================================================
async function resolveAccountId(companyId: string, code: string): Promise<string | null> {
  const { data } = await supabase
    .from('account_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('code', code)
    .single();
  return data?.id || null;
}

async function resolveAccounts(companyId: string, codes: string[]): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('account_categories')
    .select('id, code')
    .eq('company_id', companyId)
    .in('code', codes);
  
  const map: Record<string, string> = {};
  (data || []).forEach((a: any) => { map[a.code] = a.id; });
  return map;
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
  paymentAccountCode?: string; // default '1101' (Bank)
  fiscalYearId?: string;
}): Promise<{ journalEntryId: string; projectCostId: string }> {
  const { companyId, projectId, projectName, description, amount, costType, paymentAccountCode = '1101', fiscalYearId } = params;

  if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  const accounts = await resolveAccounts(companyId, ['1301', paymentAccountCode]);
  const projectCostAccountId = accounts['1301']; // مشاريع تحت التطوير
  const paymentAccountId = accounts[paymentAccountCode];

  if (!projectCostAccountId) throw new Error('حساب المشاريع تحت التطوير (1301) غير موجود');
  if (!paymentAccountId) throw new Error(`حساب الدفع (${paymentAccountCode}) غير موجود`);

  // Create journal entry: Debit Project Cost, Credit Bank/Cash
  const entry = await createJournalEntry(
    {
      company_id: companyId,
      entry_date: new Date().toISOString().split('T')[0],
      description: `تكلفة مشروع: ${projectName} - ${description}`,
      status: 'posted',
      reference_type: 'project_cost',
      reference_id: projectId,
      fiscal_year_id: fiscalYearId || null,
    } as any,
    [
      { account_id: projectCostAccountId, description: `تكلفة ${costType} - ${projectName}`, debit: amount, credit: 0 },
      { account_id: paymentAccountId, description: `دفع تكلفة ${costType}`, debit: 0, credit: amount },
    ]
  );

  // Record in project_costs table
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

  const accounts = await resolveAccounts(companyId, ['1101', '2102']);
  const bankAccountId = accounts['1101']; // البنك
  const advancePaymentAccountId = accounts['2102']; // دفعات مقدمة من العملاء (التزام)

  if (!bankAccountId) throw new Error('حساب البنك (1101) غير موجود');
  if (!advancePaymentAccountId) throw new Error('حساب الدفعات المقدمة (2102) غير موجود');

  // Debit Bank, Credit Advance Payments (Liability)
  const entry = await createJournalEntry(
    {
      company_id: companyId,
      entry_date: new Date().toISOString().split('T')[0],
      description: `دفعة مقدمة من ${customerName} - وحدة ${unitNumber} - ${projectName}`,
      status: 'posted',
      reference_type: 'advance_payment',
      reference_id: unitId,
      fiscal_year_id: fiscalYearId || null,
    } as any,
    [
      { account_id: bankAccountId, description: `تحصيل دفعة مقدمة - ${customerName}`, debit: amount, credit: 0 },
      { account_id: advancePaymentAccountId, description: `دفعة مقدمة - وحدة ${unitNumber}`, debit: 0, credit: amount },
    ]
  );

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

  // Get total project costs
  const { data: costs } = await supabase
    .from('project_costs')
    .select('total_cost')
    .eq('company_id', companyId)
    .eq('project_id', projectId);

  const totalProjectCost = (costs || []).reduce((s: number, c: any) => s + Number(c.total_cost || 0), 0);

  // Get all units for this project
  const { data: allUnits } = await supabase
    .from('re_units')
    .select('id, area')
    .eq('company_id', companyId)
    .eq('project_id', projectId);

  // Get the specific unit
  const { data: unit } = await supabase
    .from('re_units')
    .select('area')
    .eq('id', unitId)
    .single();

  const totalUnits = (allUnits || []).length;
  const unitArea = Number(unit?.area || 0);
  const totalArea = (allUnits || []).reduce((s: number, u: any) => s + Number(u.area || 0), 0);

  // Proportional cost allocation by area (if areas available), otherwise equal split
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
  advancePayments?: number; // total advance payments already received
  vatRate?: number; // default 15%
  fiscalYearId?: string;
}): Promise<{ revenueEntryId: string; cogsEntryId: string; unitCost: number }> {
  const {
    companyId, unitId, unitNumber, projectId, projectName,
    customerName, salePrice, advancePayments = 0,
    vatRate = 0.15, fiscalYearId,
  } = params;

  if (salePrice <= 0) throw new Error('سعر البيع يجب أن يكون أكبر من صفر');

  // --- Calculate unit cost ---
  const costCalc = await calculateUnitCost({ companyId, projectId, unitId });
  const unitCost = costCalc.unitCost;

  // --- Resolve accounts ---
  const accounts = await resolveAccounts(companyId, [
    '1201', // ذمم مدينة
    '2102', // دفعات مقدمة من العملاء
    '4101', // إيرادات بيع وحدات
    '21041', // ضريبة مبيعات
    '5102', // تكلفة إنشاء وحدات مباعة (COGS)
    '1301', // مشاريع تحت التطوير
  ]);

  const receivableId = accounts['1201'];
  const advanceId = accounts['2102'];
  const revenueId = accounts['4101'];
  const vatId = accounts['21041'];
  const cogsId = accounts['5102'];
  const projectCostId = accounts['1301'];

  if (!receivableId || !revenueId) throw new Error('حسابات الإيرادات غير مكتملة');
  if (!cogsId || !projectCostId) throw new Error('حسابات التكلفة غير مكتملة');

  const vatAmount = salePrice * vatRate;
  const netReceivable = salePrice + vatAmount - advancePayments;

  // --- Entry 1: Revenue Recognition (IFRS 15) ---
  const revenueLines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [];

  // Debit: Receivable (net of advance payments)
  if (netReceivable > 0) {
    revenueLines.push({
      account_id: receivableId,
      description: `ذمم مدينة - ${customerName} - وحدة ${unitNumber}`,
      debit: netReceivable,
      credit: 0,
    });
  }

  // Debit: Transfer advance payments from liability
  if (advancePayments > 0 && advanceId) {
    revenueLines.push({
      account_id: advanceId,
      description: `ترحيل دفعات مقدمة - ${customerName}`,
      debit: advancePayments,
      credit: 0,
    });
  }

  // Credit: Revenue
  revenueLines.push({
    account_id: revenueId,
    description: `إيراد بيع وحدة ${unitNumber} - ${projectName}`,
    debit: 0,
    credit: salePrice,
  });

  // Credit: VAT
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

  // --- Entry 2: COGS Transfer (Project Cost → Cost of Sales) ---
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

  // --- Update unit with cost and sale info ---
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
  // Get project costs from project_costs table
  const { data: costs } = await supabase
    .from('project_costs')
    .select('total_cost')
    .eq('company_id', companyId)
    .eq('project_id', projectId) as any;

  const totalCosts = (costs || []).reduce((s: number, c: any) => s + Number(c.total_cost || 0), 0);

  // Get units
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

  // Get advance payments balance from journal entries
  const advanceQuery = supabase
    .from('journal_entries')
    .select('total_credit')
    .eq('company_id', companyId) as any;
  const { data: advanceEntries } = await advanceQuery.eq('status', 'posted');

  const totalAdvances = (advanceEntries || []).reduce((s: number, e: any) => s + Number(e.total_credit || 0), 0);

  // Subtract transferred advances (from revenue recognition entries)
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
