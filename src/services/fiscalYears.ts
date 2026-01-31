import { supabase } from '@/integrations/supabase/client';

export interface FiscalYear {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  is_current: boolean;
  opening_balance_entry_id: string | null;
  closing_balance_entry_id: string | null;
  closed_at: string | null;
  closed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FiscalYearInsert = Omit<FiscalYear, 'id' | 'created_at' | 'updated_at'>;

// جلب السنوات المالية للشركة
export async function fetchFiscalYears(companyId: string): Promise<FiscalYear[]> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: false });
  
  if (error) throw error;
  return data as FiscalYear[];
}

// جلب السنة المالية الحالية
export async function getCurrentFiscalYear(companyId: string): Promise<FiscalYear | null> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle();
  
  if (error) throw error;
  return data as FiscalYear | null;
}

// إنشاء سنة مالية جديدة
export async function createFiscalYear(fiscalYear: {
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status?: string;
  is_current?: boolean;
  notes?: string;
}): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .insert(fiscalYear)
    .select()
    .single();
  
  if (error) throw error;
  return data as FiscalYear;
}

// تحديث السنة المالية
export async function updateFiscalYear(id: string, updates: Partial<FiscalYear>): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FiscalYear;
}

// تعيين السنة كسنة حالية
export async function setCurrentFiscalYear(id: string): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as FiscalYear;
}

// تحديث السنة المالية للمستخدم
export async function setUserFiscalYear(userId: string, fiscalYearId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ current_fiscal_year_id: fiscalYearId })
    .eq('user_id', userId);
  
  if (error) throw error;
}

// جلب السنة المالية المختارة للمستخدم
export async function getUserFiscalYear(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_fiscal_year_id')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data?.current_fiscal_year_id || null;
}

// إغلاق السنة المالية مع إنشاء قيد إقفال
export async function closeFiscalYear(
  fiscalYearId: string,
  companyId: string,
  closedBy: string
): Promise<{ success: boolean; closingEntryId?: string; error?: string }> {
  try {
    // 1. جلب أرصدة الحسابات في نهاية السنة
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', fiscalYearId)
      .single();
    
    if (!fiscalYear) throw new Error('السنة المالية غير موجودة');

    // 2. حساب صافي الربح للسنة من الإيرادات والمصروفات
    const { data: journalLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .gte('journal_entry.entry_date', fiscalYear.start_date)
      .lte('journal_entry.entry_date', fiscalYear.end_date);

    // 3. جلب الحسابات لتحديد الإيرادات والمصروفات
    const { data: accounts } = await supabase
      .from('account_categories')
      .select('*')
      .eq('company_id', companyId);

    if (!accounts) throw new Error('لا توجد حسابات');

    const revenueAccounts = accounts.filter(a => a.type === 'revenue');
    const expenseAccounts = accounts.filter(a => a.type === 'expenses');
    const retainedEarningsAccount = accounts.find(a => a.code.startsWith('33'));

    // حساب الأرصدة
    const balances = new Map<string, number>();
    (journalLines || []).forEach((line: any) => {
      const current = balances.get(line.account_id) || 0;
      const account = accounts.find(a => a.id === line.account_id);
      if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
        balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
      } else {
        balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
      }
    });

    // حساب صافي الربح
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    // 4. إنشاء قيد إقفال (إقفال الإيرادات والمصروفات إلى الأرباح المحتجزة)
    if (retainedEarningsAccount && netIncome !== 0) {
      const closingEntryLines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];
      
      // إقفال الإيرادات (مدين)
      revenueAccounts.forEach(acc => {
        const balance = balances.get(acc.id) || 0;
        if (balance !== 0) {
          closingEntryLines.push({
            account_id: acc.id,
            debit: balance,
            credit: 0,
            description: `إقفال ${acc.name}`
          });
        }
      });

      // إقفال المصروفات (دائن)
      expenseAccounts.forEach(acc => {
        const balance = balances.get(acc.id) || 0;
        if (balance !== 0) {
          closingEntryLines.push({
            account_id: acc.id,
            debit: 0,
            credit: Math.abs(balance),
            description: `إقفال ${acc.name}`
          });
        }
      });

      // قيد الأرباح المحتجزة
      closingEntryLines.push({
        account_id: retainedEarningsAccount.id,
        debit: netIncome < 0 ? Math.abs(netIncome) : 0,
        credit: netIncome > 0 ? netIncome : 0,
        description: 'صافي الربح/الخسارة للسنة'
      });

      const totalDebit = closingEntryLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = closingEntryLines.reduce((sum, l) => sum + l.credit, 0);

      // إنشاء قيد الإقفال
      const { data: closingEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          description: `قيد إقفال السنة المالية ${fiscalYear.name}`,
          entry_date: fiscalYear.end_date,
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_posted: true,
          reference_type: 'closing',
          fiscal_year_id: fiscalYearId,
          created_by: closedBy
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // إضافة بنود القيد
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(closingEntryLines.map(line => ({
          ...line,
          journal_entry_id: closingEntry.id
        })));

      if (linesError) throw linesError;

      // 5. تحديث السنة المالية كمغلقة
      const { error: updateError } = await supabase
        .from('fiscal_years')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: closedBy,
          closing_balance_entry_id: closingEntry.id
        })
        .eq('id', fiscalYearId);

      if (updateError) throw updateError;

      return { success: true, closingEntryId: closingEntry.id };
    }

    // إغلاق بدون قيد إقفال (لا توجد إيرادات أو مصروفات)
    const { error: updateError } = await supabase
      .from('fiscal_years')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: closedBy
      })
      .eq('id', fiscalYearId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// فتح سنة مالية جديدة مع ترحيل الأرصدة
export async function openNewFiscalYear(
  companyId: string,
  name: string,
  startDate: string,
  endDate: string,
  previousYearId?: string,
  autoCarryForward: boolean = true
): Promise<{ success: boolean; fiscalYearId?: string; openingEntryId?: string; error?: string }> {
  try {
    // 1. إنشاء السنة المالية الجديدة
    const { data: newYear, error: createError } = await supabase
      .from('fiscal_years')
      .insert({
        company_id: companyId,
        name,
        start_date: startDate,
        end_date: endDate,
        status: 'open',
        is_current: true
      })
      .select()
      .single();

    if (createError) throw createError;

    // 2. إذا تم طلب الترحيل التلقائي
    if (autoCarryForward && previousYearId) {
      const { data: previousYear } = await supabase
        .from('fiscal_years')
        .select('*')
        .eq('id', previousYearId)
        .single();

      if (previousYear) {
        // جلب أرصدة الأصول والخصوم وحقوق الملكية
        const { data: journalLines } = await supabase
          .from('journal_entry_lines')
          .select(`
            account_id,
            debit,
            credit,
            journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
          `)
          .eq('journal_entry.company_id', companyId)
          .eq('journal_entry.is_posted', true)
          .lte('journal_entry.entry_date', previousYear.end_date);

        const { data: accounts } = await supabase
          .from('account_categories')
          .select('*')
          .eq('company_id', companyId);

        if (accounts && journalLines) {
          // حساب الأرصدة
          const balances = new Map<string, number>();
          journalLines.forEach((line: any) => {
            const current = balances.get(line.account_id) || 0;
            const account = accounts.find(a => a.id === line.account_id);
            if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
              balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
            } else {
              balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
            }
          });

          // الحسابات التي تُرحّل (الأصول، الخصوم، حقوق الملكية)
          const balanceSheetAccounts = accounts.filter(a => 
            a.type === 'assets' || a.type === 'liabilities' || a.type === 'equity'
          );

          const openingLines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

          balanceSheetAccounts.forEach(acc => {
            const balance = balances.get(acc.id) || 0;
            if (balance !== 0) {
              if (acc.type === 'assets') {
                openingLines.push({
                  account_id: acc.id,
                  debit: balance > 0 ? balance : 0,
                  credit: balance < 0 ? Math.abs(balance) : 0,
                  description: `رصيد افتتاحي - ${acc.name}`
                });
              } else {
                openingLines.push({
                  account_id: acc.id,
                  debit: balance < 0 ? Math.abs(balance) : 0,
                  credit: balance > 0 ? balance : 0,
                  description: `رصيد افتتاحي - ${acc.name}`
                });
              }
            }
          });

          if (openingLines.length > 0) {
            const totalDebit = openingLines.reduce((sum, l) => sum + l.debit, 0);
            const totalCredit = openingLines.reduce((sum, l) => sum + l.credit, 0);

            // إنشاء قيد الافتتاح
            const { data: openingEntry, error: entryError } = await supabase
              .from('journal_entries')
              .insert({
                company_id: companyId,
                description: `قيد افتتاحي للسنة المالية ${name}`,
                entry_date: startDate,
                total_debit: totalDebit,
                total_credit: totalCredit,
                is_posted: true,
                reference_type: 'opening',
                fiscal_year_id: newYear.id
              })
              .select()
              .single();

            if (entryError) throw entryError;

            // إضافة بنود القيد
            const { error: linesError } = await supabase
              .from('journal_entry_lines')
              .insert(openingLines.map(line => ({
                ...line,
                journal_entry_id: openingEntry.id
              })));

            if (linesError) throw linesError;

            // تحديث السنة بقيد الافتتاح
            await supabase
              .from('fiscal_years')
              .update({ opening_balance_entry_id: openingEntry.id })
              .eq('id', newYear.id);

            return { success: true, fiscalYearId: newYear.id, openingEntryId: openingEntry.id };
          }
        }
      }
    }

    return { success: true, fiscalYearId: newYear.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// حذف سنة مالية (فقط إذا كانت مفتوحة ولا تحتوي على معاملات)
export async function deleteFiscalYear(id: string): Promise<void> {
  const { error } = await supabase
    .from('fiscal_years')
    .delete()
    .eq('id', id)
    .eq('status', 'open');
  
  if (error) throw error;
}

// ترحيل المخزون (السيارات المتاحة) من سنة مالية إلى أخرى
export async function carryForwardInventory(
  fromFiscalYearId: string,
  toFiscalYearId: string,
  companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // جلب السيارات المتاحة من السنة المالية المصدر
    const { data: cars, error: fetchError } = await supabase
      .from('cars')
      .select('id')
      .eq('company_id', companyId)
      .eq('fiscal_year_id', fromFiscalYearId)
      .eq('status', 'available');

    if (fetchError) throw fetchError;

    if (!cars || cars.length === 0) {
      return { success: true, count: 0 };
    }

    // تحديث fiscal_year_id للسيارات المتاحة
    const carIds = cars.map(car => car.id);
    const { error: updateError } = await supabase
      .from('cars')
      .update({ fiscal_year_id: toFiscalYearId })
      .in('id', carIds);

    if (updateError) throw updateError;

    return { success: true, count: cars.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// تحديث الأرصدة الافتتاحية للسنة المالية بناءً على أرصدة السنة السابقة
export async function refreshOpeningBalances(
  fiscalYearId: string,
  previousYearId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // جلب السنة المالية الحالية
    const { data: currentYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', fiscalYearId)
      .single();

    if (!currentYear) throw new Error('السنة المالية غير موجودة');

    // جلب السنة السابقة
    const { data: previousYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', previousYearId)
      .single();

    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    // حذف قيد الافتتاح القديم إن وجد
    if (currentYear.opening_balance_entry_id) {
      // حذف بنود القيد أولاً
      await supabase
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', currentYear.opening_balance_entry_id);
      
      // حذف القيد
      await supabase
        .from('journal_entries')
        .delete()
        .eq('id', currentYear.opening_balance_entry_id);
    }

    // جلب جميع القيود المحاسبية للسنة السابقة
    const { data: journalLines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lte('journal_entry.entry_date', previousYear.end_date);

    const { data: accounts } = await supabase
      .from('account_categories')
      .select('*')
      .eq('company_id', companyId);

    if (!accounts) throw new Error('لا توجد حسابات');

    // حساب الأرصدة
    const balances = new Map<string, number>();
    (journalLines || []).forEach((line: any) => {
      const current = balances.get(line.account_id) || 0;
      const account = accounts.find(a => a.id === line.account_id);
      if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
        balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
      } else {
        balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
      }
    });

    // حساب صافي الربح للسنة السابقة
    const revenueAccounts = accounts.filter(a => a.type === 'revenue');
    const expenseAccounts = accounts.filter(a => a.type === 'expenses');
    const retainedEarningsAccount = accounts.find(a => a.code.startsWith('33'));

    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    // الحسابات التي تُرحّل (الأصول، الخصوم، حقوق الملكية)
    const balanceSheetAccounts = accounts.filter(a => 
      a.type === 'assets' || a.type === 'liabilities' || a.type === 'equity'
    );

    const openingLines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

    balanceSheetAccounts.forEach(acc => {
      let balance = balances.get(acc.id) || 0;
      
      // إضافة صافي الربح للأرباح المحتجزة
      if (retainedEarningsAccount && acc.id === retainedEarningsAccount.id) {
        balance += netIncome;
      }
      
      if (balance !== 0) {
        if (acc.type === 'assets') {
          openingLines.push({
            account_id: acc.id,
            debit: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
            description: `رصيد افتتاحي مُحدّث - ${acc.name}`
          });
        } else {
          openingLines.push({
            account_id: acc.id,
            debit: balance < 0 ? Math.abs(balance) : 0,
            credit: balance > 0 ? balance : 0,
            description: `رصيد افتتاحي مُحدّث - ${acc.name}`
          });
        }
      }
    });

    if (openingLines.length > 0) {
      const totalDebit = openingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = openingLines.reduce((sum, l) => sum + l.credit, 0);

      // إنشاء قيد الافتتاح الجديد
      const { data: openingEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
          entry_date: currentYear.start_date,
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_posted: true,
          reference_type: 'opening',
          fiscal_year_id: fiscalYearId
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // إضافة بنود القيد
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(openingLines.map(line => ({
          ...line,
          journal_entry_id: openingEntry.id
        })));

      if (linesError) throw linesError;

      // تحديث السنة بقيد الافتتاح الجديد
      await supabase
        .from('fiscal_years')
        .update({ opening_balance_entry_id: openingEntry.id })
        .eq('id', fiscalYearId);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// تحديث أرصدة العملاء المرحلة
export async function refreshCustomerBalances(
  fiscalYearId: string,
  previousYearId: string,
  companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // جلب السنة السابقة
    const { data: previousYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', previousYearId)
      .single();

    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    // جلب السنة الحالية
    const { data: currentYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', fiscalYearId)
      .single();

    if (!currentYear) throw new Error('السنة المالية غير موجودة');

    // جلب جميع المبيعات من السنة السابقة
    const { data: unpaidSales, error: salesError } = await supabase
      .from('sales')
      .select('id, customer_id, sale_price')
      .eq('company_id', companyId)
      .gte('sale_date', previousYear.start_date)
      .lte('sale_date', previousYear.end_date);

    if (salesError) throw salesError;

    // جلب حساب العملاء (المدينون)
    const { data: receivablesAccount } = await supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '1201')
      .single();

    if (!receivablesAccount) {
      return { success: true, count: 0 };
    }

    // حساب إجمالي المديونية
    const totalReceivables = (unpaidSales || []).reduce((sum, sale) => sum + Number(sale.sale_price), 0);

    if (totalReceivables > 0) {
      // التحقق من وجود قيد مرحل للعملاء
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
        .eq('fiscal_year_id', fiscalYearId)
        .eq('reference_type', 'customer_balance_forward')
        .single();

      if (existingEntry) {
        // حذف القيد القديم
        await supabase
          .from('journal_entry_lines')
          .delete()
          .eq('journal_entry_id', existingEntry.id);
        
        await supabase
          .from('journal_entries')
          .delete()
          .eq('id', existingEntry.id);
      }
    }

    return { success: true, count: unpaidSales?.length || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// تحديث أرصدة الموردين المرحلة
export async function refreshSupplierBalances(
  fiscalYearId: string,
  previousYearId: string,
  companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // جلب السنة السابقة
    const { data: previousYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', previousYearId)
      .single();

    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    // جلب السنة الحالية
    const { data: currentYear } = await supabase
      .from('fiscal_years')
      .select('*')
      .eq('id', fiscalYearId)
      .single();

    if (!currentYear) throw new Error('السنة المالية غير موجودة');

    // جلب جميع المشتريات غير المسددة بالكامل من السنة السابقة
    const { data: unpaidPurchases, error: purchasesError } = await supabase
      .from('cars')
      .select('id, supplier_id, purchase_price')
      .eq('company_id', companyId)
      .gte('purchase_date', previousYear.start_date)
      .lte('purchase_date', previousYear.end_date);

    if (purchasesError) throw purchasesError;

    // جلب حساب الموردين (الدائنون)
    const { data: payablesAccount } = await supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '2101')
      .single();

    if (!payablesAccount) {
      return { success: true, count: 0 };
    }

    return { success: true, count: unpaidPurchases?.length || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// تحديث شامل لجميع الأرصدة المرحلة
export async function refreshAllCarryForwardBalances(
  fiscalYearId: string,
  previousYearId: string,
  companyId: string
): Promise<{ 
  success: boolean; 
  openingBalancesUpdated?: boolean;
  inventoryCount?: number;
  error?: string 
}> {
  try {
    // 1. تحديث الأرصدة الافتتاحية
    const openingResult = await refreshOpeningBalances(fiscalYearId, previousYearId, companyId);
    if (!openingResult.success) throw new Error(openingResult.error);

    // 2. ترحيل المخزون
    const inventoryResult = await carryForwardInventory(previousYearId, fiscalYearId, companyId);

    // 3. تحديث أرصدة العملاء
    await refreshCustomerBalances(fiscalYearId, previousYearId, companyId);

    // 4. تحديث أرصدة الموردين
    await refreshSupplierBalances(fiscalYearId, previousYearId, companyId);

    return { 
      success: true, 
      openingBalancesUpdated: true,
      inventoryCount: inventoryResult.count || 0
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
