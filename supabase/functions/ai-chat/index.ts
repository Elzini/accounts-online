import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

async function fetchCompanyData(supabaseClient: any, companyId: string) {
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
  const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const thisYear = now.getFullYear();
  const yearStart = `${thisYear}-01-01`;

  // Fetch all data in parallel
  const [
    { data: cars },
    { data: sales },
    { data: customers },
    { data: suppliers },
    { data: expenses },
    { data: invoices },
    { data: journalEntries },
    { data: checks },
    { data: bankAccounts },
    { data: hrEmployees },
    { data: payrollRecords },
    { data: vouchers },
    { data: installments },
    { data: company },
  ] = await Promise.all([
    supabaseClient.from('cars').select('id, name, model, status, purchase_price, purchase_date').eq('company_id', companyId),
    supabaseClient.from('sales').select('id, sale_price, profit, sale_date, car:cars(name, model), customer:customers(name)').eq('company_id', companyId).order('sale_date', { ascending: false }).limit(500),
    supabaseClient.from('customers').select('id, name, phone, balance').eq('company_id', companyId),
    supabaseClient.from('suppliers').select('id, name, balance').eq('company_id', companyId),
    supabaseClient.from('expenses').select('id, amount, description, expense_date, category').eq('company_id', companyId).gte('expense_date', yearStart).limit(1000),
    supabaseClient.from('invoices').select('id, invoice_number, invoice_type, total_amount, tax_amount, net_amount, status, issue_date, due_date, customer_id, supplier_id, paid_amount, remaining_amount').eq('company_id', companyId).gte('issue_date', yearStart).order('issue_date', { ascending: false }).limit(1000),
    supabaseClient.from('journal_entries').select('id, entry_number, description, total_debit, total_credit, entry_date, status').eq('company_id', companyId).gte('entry_date', yearStart).order('entry_date', { ascending: false }).limit(500),
    supabaseClient.from('checks').select('id, check_number, check_type, amount, status, due_date, issue_date, bank_name, payee_name, drawer_name').eq('company_id', companyId).limit(500),
    supabaseClient.from('bank_accounts').select('id, bank_name, account_name, current_balance, is_active').eq('company_id', companyId),
    supabaseClient.from('hr_employees').select('id, name, department, position, salary, status').eq('company_id', companyId),
    supabaseClient.from('payroll_records').select('id, employee_name, net_salary, deductions, month, year, status').eq('company_id', companyId).gte('year', thisYear).limit(500),
    supabaseClient.from('vouchers').select('id, voucher_type, amount, description, voucher_date, status').eq('company_id', companyId).gte('voucher_date', yearStart).limit(500),
    supabaseClient.from('installments').select('id, total_amount, paid_amount, remaining_amount, status, customer_name').eq('company_id', companyId).limit(500),
    supabaseClient.from('companies').select('name, company_type').eq('id', companyId).single(),
  ]);

  const allSales = sales || [];
  const allCars = cars || [];
  const allExpenses = expenses || [];
  const allInvoices = invoices || [];
  const allChecks = checks || [];
  const allVouchers = vouchers || [];
  const allCustomers = customers || [];
  const allSuppliers = suppliers || [];
  const allInstallments = installments || [];

  // === Sales Summary ===
  const totalSalesAmount = allSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const totalProfit = allSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);
  const thisMonthSales = allSales.filter((s: any) => s.sale_date >= thisMonthStart);
  const thisMonthSalesTotal = thisMonthSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const thisMonthProfit = thisMonthSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);
  const lastMonthSales = allSales.filter((s: any) => s.sale_date >= lastMonthStart && s.sale_date < lastMonthEnd);
  const lastMonthSalesTotal = lastMonthSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const lastMonthProfit = lastMonthSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);

  // === Invoice Summary ===
  const salesInvoices = allInvoices.filter((i: any) => i.invoice_type === 'sale');
  const purchaseInvoices = allInvoices.filter((i: any) => i.invoice_type === 'purchase');
  const overdueInvoices = allInvoices.filter((i: any) => i.due_date && i.due_date < now.toISOString().split('T')[0] && (i.remaining_amount || 0) > 0);
  const thisMonthInvoiceSales = salesInvoices.filter((i: any) => i.issue_date >= thisMonthStart);
  const thisMonthInvoiceSalesTotal = thisMonthInvoiceSales.reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
  const thisMonthInvoicePurchases = purchaseInvoices.filter((i: any) => i.issue_date >= thisMonthStart);
  const thisMonthInvoicePurchasesTotal = thisMonthInvoicePurchases.reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
  const totalReceivables = allInvoices.filter((i: any) => i.invoice_type === 'sale').reduce((s: number, r: any) => s + (r.remaining_amount || 0), 0);
  const totalPayables = allInvoices.filter((i: any) => i.invoice_type === 'purchase').reduce((s: number, r: any) => s + (r.remaining_amount || 0), 0);

  // === Checks Summary ===
  const receivedChecks = allChecks.filter((c: any) => c.check_type === 'received');
  const issuedChecks = allChecks.filter((c: any) => c.check_type === 'issued');
  const pendingReceivedChecks = receivedChecks.filter((c: any) => c.status === 'pending' || c.status === 'active');
  const pendingIssuedChecks = issuedChecks.filter((c: any) => c.status === 'pending' || c.status === 'active');
  const pendingReceivedTotal = pendingReceivedChecks.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const pendingIssuedTotal = pendingIssuedChecks.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // === Bank Accounts ===
  const activeBanks = (bankAccounts || []).filter((b: any) => b.is_active);
  const totalBankBalance = activeBanks.reduce((s: number, r: any) => s + (r.current_balance || 0), 0);
  const bankDetails = activeBanks.map((b: any) => `${b.bank_name} - ${b.account_name}: ${(b.current_balance || 0).toLocaleString()} ريال`).join('\n');

  // === Expenses ===
  const totalExpensesAmount = allExpenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const thisMonthExpenses = allExpenses.filter((e: any) => e.expense_date >= thisMonthStart);
  const thisMonthExpensesTotal = thisMonthExpenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  // Group by category
  const expensesByCategory: Record<string, number> = {};
  allExpenses.forEach((e: any) => {
    const cat = e.category || 'أخرى';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
  });
  const expensesCategoryText = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([cat, total]) => `${cat}: ${(total as number).toLocaleString()} ريال`)
    .join('\n');

  // === Vouchers ===
  const receiptVouchers = allVouchers.filter((v: any) => v.voucher_type === 'receipt');
  const paymentVouchers = allVouchers.filter((v: any) => v.voucher_type === 'payment');
  const totalReceipts = receiptVouchers.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalPayments = paymentVouchers.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // === Top Debtors (customers with highest balance) ===
  const debtors = allCustomers
    .filter((c: any) => (c.balance || 0) > 0)
    .sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 10);
  const debtorsText = debtors.map((c: any, i: number) => `${i + 1}. ${c.name}: ${(c.balance || 0).toLocaleString()} ريال`).join('\n');

  // === Top Creditors (suppliers with balance) ===
  const creditors = allSuppliers
    .filter((s: any) => (s.balance || 0) > 0)
    .sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 10);
  const creditorsText = creditors.map((s: any, i: number) => `${i + 1}. ${s.name}: ${(s.balance || 0).toLocaleString()} ريال`).join('\n');

  // === Inventory ===
  const availableCars = allCars.filter((c: any) => c.status === 'available').length;
  const soldCars = allCars.filter((c: any) => c.status === 'sold').length;
  const totalPurchases = allCars.reduce((s: number, r: any) => s + (r.purchase_price || 0), 0);

  // === HR ===
  const activeEmployees = (hrEmployees || []).filter((e: any) => e.status === 'active');
  const totalSalaries = activeEmployees.reduce((s: number, r: any) => s + (r.salary || 0), 0);

  // === Installments ===
  const activeInstallments = allInstallments.filter((i: any) => i.status === 'active');
  const totalInstallmentsRemaining = activeInstallments.reduce((s: number, r: any) => s + (r.remaining_amount || 0), 0);

  // === Monthly breakdown ===
  const monthlyBreakdown: Record<string, { sales: number; profit: number; purchases: number; invoiceSales: number; invoicePurchases: number }> = {};
  for (let m = 0; m < 12; m++) {
    const key = `${thisYear}-${String(m + 1).padStart(2, '0')}`;
    monthlyBreakdown[key] = { sales: 0, profit: 0, purchases: 0, invoiceSales: 0, invoicePurchases: 0 };
  }
  allSales.forEach((s: any) => {
    if (s.sale_date >= yearStart) {
      const key = s.sale_date.substring(0, 7);
      if (monthlyBreakdown[key]) {
        monthlyBreakdown[key].sales += s.sale_price || 0;
        monthlyBreakdown[key].profit += s.profit || 0;
      }
    }
  });
  salesInvoices.forEach((i: any) => {
    const key = i.issue_date?.substring(0, 7);
    if (key && monthlyBreakdown[key]) {
      monthlyBreakdown[key].invoiceSales += i.total_amount || 0;
    }
  });
  purchaseInvoices.forEach((i: any) => {
    const key = i.issue_date?.substring(0, 7);
    if (key && monthlyBreakdown[key]) {
      monthlyBreakdown[key].invoicePurchases += i.total_amount || 0;
    }
  });
  const monthlyText = Object.entries(monthlyBreakdown)
    .filter(([_, v]) => v.sales > 0 || v.purchases > 0 || v.invoiceSales > 0 || v.invoicePurchases > 0)
    .map(([k, v]) => {
      const monthIdx = parseInt(k.split('-')[1]) - 1;
      return `${arabicMonths[monthIdx]}: مبيعات ${(v.sales + v.invoiceSales).toLocaleString()} | أرباح ${v.profit.toLocaleString()} | مشتريات ${(v.purchases + v.invoicePurchases).toLocaleString()}`;
    }).join('\n');

  // === Recent transactions ===
  const recentSalesText = allSales.slice(0, 5).map((s: any) =>
    `${s.sale_date} - ${s.car?.name || ''} ${s.car?.model || ''} - ${s.customer?.name || 'غير محدد'} - ${(s.sale_price || 0).toLocaleString()} ريال - ربح: ${(s.profit || 0).toLocaleString()}`
  ).join('\n');

  const overdueText = overdueInvoices.slice(0, 10).map((i: any) =>
    `فاتورة ${i.invoice_number || i.id.slice(0, 8)} - مستحقة: ${i.due_date} - المتبقي: ${(i.remaining_amount || 0).toLocaleString()} ريال`
  ).join('\n');

  const companyName = company?.name || 'غير محدد';
  const companyType = company?.company_type || 'general';

  // === Percentage changes ===
  const salesChange = lastMonthSalesTotal > 0 ? (((thisMonthSalesTotal - lastMonthSalesTotal) / lastMonthSalesTotal) * 100).toFixed(1) : 'N/A';
  const profitChange = lastMonthProfit > 0 ? (((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100).toFixed(1) : 'N/A';

  return `
=== بيانات شركة "${companyName}" (${companyType}) ===
التاريخ: ${now.toISOString().split('T')[0]}

━━━ المبيعات ━━━
📊 إجمالي (سيارات): ${totalSalesAmount.toLocaleString()} ريال (${allSales.length} عملية)
📊 إجمالي (فواتير بيع): ${salesInvoices.reduce((s: number, r: any) => s + (r.total_amount || 0), 0).toLocaleString()} ريال (${salesInvoices.length} فاتورة)
💰 إجمالي الأرباح: ${totalProfit.toLocaleString()} ريال

هذا الشهر:
- مبيعات: ${thisMonthSalesTotal.toLocaleString()} + فواتير ${thisMonthInvoiceSalesTotal.toLocaleString()} ريال
- أرباح: ${thisMonthProfit.toLocaleString()} ريال
- نسبة تغير المبيعات عن الشهر السابق: ${salesChange}%
- نسبة تغير الأرباح عن الشهر السابق: ${profitChange}%

الشهر السابق:
- مبيعات: ${lastMonthSalesTotal.toLocaleString()} ريال | أرباح: ${lastMonthProfit.toLocaleString()} ريال

━━━ المشتريات ━━━
🛒 مشتريات سيارات: ${totalPurchases.toLocaleString()} ريال (${allCars.length} سيارة)
🛒 فواتير شراء: ${purchaseInvoices.reduce((s: number, r: any) => s + (r.total_amount || 0), 0).toLocaleString()} ريال (${purchaseInvoices.length} فاتورة)
هذا الشهر: ${thisMonthInvoicePurchasesTotal.toLocaleString()} ريال

━━━ المصروفات ━━━
💸 إجمالي هذه السنة: ${totalExpensesAmount.toLocaleString()} ريال
💸 هذا الشهر: ${thisMonthExpensesTotal.toLocaleString()} ريال
تصنيف المصروفات:
${expensesCategoryText || 'لا توجد بيانات'}

━━━ الذمم المدينة والدائنة ━━━
📌 ذمم مدينة (مستحقة من العملاء): ${totalReceivables.toLocaleString()} ريال
📌 ذمم دائنة (مستحقة للموردين): ${totalPayables.toLocaleString()} ريال
📌 أقساط نشطة متبقية: ${totalInstallmentsRemaining.toLocaleString()} ريال

أكثر العملاء ديوناً:
${debtorsText || 'لا توجد ذمم مدينة'}

أكثر الموردين استحقاقاً:
${creditorsText || 'لا توجد ذمم دائنة'}

━━━ الشيكات ━━━
شيكات واردة معلقة: ${pendingReceivedChecks.length} بقيمة ${pendingReceivedTotal.toLocaleString()} ريال
شيكات صادرة معلقة: ${pendingIssuedChecks.length} بقيمة ${pendingIssuedTotal.toLocaleString()} ريال

━━━ البنوك ━━━
إجمالي الأرصدة البنكية: ${totalBankBalance.toLocaleString()} ريال
${bankDetails || 'لا توجد حسابات بنكية'}

━━━ سندات القبض والصرف ━━━
سندات قبض: ${totalReceipts.toLocaleString()} ريال (${receiptVouchers.length} سند)
سندات صرف: ${totalPayments.toLocaleString()} ريال (${paymentVouchers.length} سند)

━━━ القيود المحاسبية ━━━
عدد القيود هذه السنة: ${(journalEntries || []).length} قيد

━━━ فواتير متأخرة ━━━
عدد الفواتير المتأخرة: ${overdueInvoices.length}
${overdueText || 'لا توجد فواتير متأخرة'}

━━━ المخزون ━━━
🚗 سيارات متاحة: ${availableCars} | مباعة: ${soldCars}
👥 عدد العملاء: ${allCustomers.length} | الموردين: ${allSuppliers.length}

━━━ الموارد البشرية ━━━
👤 موظفين نشطين: ${activeEmployees.length}
💵 إجمالي الرواتب الشهرية: ${totalSalaries.toLocaleString()} ريال

━━━ تفصيل شهري ${thisYear} ━━━
${monthlyText || 'لا توجد بيانات'}

━━━ آخر المبيعات ━━━
${recentSalesText || 'لا توجد مبيعات'}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company from profile
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch comprehensive company data
    let dataContext = '';
    if (profile?.company_id) {
      try {
        dataContext = await fetchCompanyData(adminClient, profile.company_id);
      } catch (e) {
        console.error("Error fetching company data:", e);
        dataContext = '\n(لم يتم تحميل البيانات بالكامل)';
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي متخصص في المحاسبة وإدارة الأعمال، تعمل داخل نظام ERP متكامل.
لديك وصول مباشر لجميع بيانات الشركة الحقيقية والمحدّثة.

${dataContext}

═══ تعليمات ═══
1. أجب دائماً بالأرقام الفعلية من البيانات أعلاه - لا تخمن أبداً
2. عند السؤال عن "الأرباح" أو "المبيعات" قدم أرقام هذا الشهر مع المقارنة بالشهر السابق
3. عند السؤال عن "المديونيات" أو "الذمم" اعرض قائمة أكثر العملاء ديوناً
4. عند السؤال عن "الشيكات" اعرض الشيكات المعلقة مع قيمتها
5. قدم توصيات عملية بناءً على البيانات (مثل: تحصيل ذمم، تجديد مخزون)
6. استخدم إيموجي مناسبة وتنسيق markdown واضح
7. أجب باللغة العربية بشكل مختصر ومهني
8. عند عدم توفر بيانات لسؤال معين، أوضح ذلك بصراحة
9. يمكنك حساب: هامش الربح، معدل دوران المخزون، متوسط فترة التحصيل، وغيرها
10. عند السؤال عن "صحة الشركة" قدم تحليل شامل مع نقاط القوة والضعف`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول مرة أخرى لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام المساعد الذكي." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
