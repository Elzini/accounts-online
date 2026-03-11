import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchCompanyData(supabaseClient: any, companyId: string) {
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const thisYear = now.getFullYear();

  const [
    { data: cars },
    { data: sales },
    { data: customers },
    { data: suppliers },
    { data: expenses },
  ] = await Promise.all([
    supabaseClient.from('cars').select('id, name, model, status, purchase_price, purchase_date').eq('company_id', companyId),
    supabaseClient.from('sales').select('id, sale_price, profit, sale_date, car:cars(name, model), customer:customers(name)').eq('company_id', companyId).order('sale_date', { ascending: false }).limit(500),
    supabaseClient.from('customers').select('id, name, phone').eq('company_id', companyId),
    supabaseClient.from('suppliers').select('id, name').eq('company_id', companyId),
    supabaseClient.from('expenses').select('id, amount, description, expense_date, category').eq('company_id', companyId).limit(500),
  ]);

  // Calculate summaries
  const allSales = sales || [];
  const allCars = cars || [];
  const allExpenses = expenses || [];

  const totalSales = allSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const totalProfit = allSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);
  const totalPurchases = allCars.reduce((s: number, r: any) => s + (r.purchase_price || 0), 0);
  const totalExpenses = allExpenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // This month
  const thisMonthSales = allSales.filter((s: any) => s.sale_date >= thisMonthStart);
  const thisMonthSalesTotal = thisMonthSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const thisMonthProfit = thisMonthSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);
  const thisMonthPurchases = allCars.filter((c: any) => c.purchase_date >= thisMonthStart);
  const thisMonthPurchasesTotal = thisMonthPurchases.reduce((s: number, r: any) => s + (r.purchase_price || 0), 0);
  const thisMonthExpenses = allExpenses.filter((e: any) => e.expense_date >= thisMonthStart);
  const thisMonthExpensesTotal = thisMonthExpenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // This year
  const yearStart = `${thisYear}-01-01`;
  const thisYearSales = allSales.filter((s: any) => s.sale_date >= yearStart);
  const thisYearSalesTotal = thisYearSales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0);
  const thisYearProfit = thisYearSales.reduce((s: number, r: any) => s + (r.profit || 0), 0);

  // Inventory
  const availableCars = allCars.filter((c: any) => c.status === 'available').length;
  const soldCars = allCars.filter((c: any) => c.status === 'sold').length;

  // Monthly breakdown for this year
  const monthlyBreakdown: Record<string, { sales: number; profit: number; purchases: number }> = {};
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  for (let m = 0; m < 12; m++) {
    const key = `${thisYear}-${String(m + 1).padStart(2, '0')}`;
    monthlyBreakdown[key] = { sales: 0, profit: 0, purchases: 0 };
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
  allCars.forEach((c: any) => {
    if (c.purchase_date >= yearStart) {
      const key = c.purchase_date.substring(0, 7);
      if (monthlyBreakdown[key]) {
        monthlyBreakdown[key].purchases += c.purchase_price || 0;
      }
    }
  });

  const monthlyText = Object.entries(monthlyBreakdown)
    .filter(([_, v]) => v.sales > 0 || v.purchases > 0)
    .map(([k, v]) => {
      const monthIdx = parseInt(k.split('-')[1]) - 1;
      return `${arabicMonths[monthIdx]}: مبيعات ${v.sales.toLocaleString()} | أرباح ${v.profit.toLocaleString()} | مشتريات ${v.purchases.toLocaleString()}`;
    }).join('\n');

  // Recent sales
  const recentSalesText = allSales.slice(0, 10).map((s: any) => 
    `${s.sale_date} - ${s.car?.name || ''} ${s.car?.model || ''} - العميل: ${s.customer?.name || 'غير محدد'} - السعر: ${(s.sale_price || 0).toLocaleString()} - الربح: ${(s.profit || 0).toLocaleString()}`
  ).join('\n');

  return `
=== بيانات الشركة الحالية ===
التاريخ الحالي: ${now.toISOString().split('T')[0]}

📊 إجمالي المبيعات: ${totalSales.toLocaleString()} ريال (${allSales.length} عملية)
💰 إجمالي الأرباح: ${totalProfit.toLocaleString()} ريال
🛒 إجمالي المشتريات: ${totalPurchases.toLocaleString()} ريال (${allCars.length} سيارة)
💸 إجمالي المصروفات: ${totalExpenses.toLocaleString()} ريال

📅 هذا الشهر:
- مبيعات: ${thisMonthSalesTotal.toLocaleString()} ريال (${thisMonthSales.length} عملية)
- أرباح: ${thisMonthProfit.toLocaleString()} ريال
- مشتريات: ${thisMonthPurchasesTotal.toLocaleString()} ريال
- مصروفات: ${thisMonthExpensesTotal.toLocaleString()} ريال

📅 هذه السنة (${thisYear}):
- مبيعات: ${thisYearSalesTotal.toLocaleString()} ريال
- أرباح: ${thisYearProfit.toLocaleString()} ريال

🚗 المخزون:
- سيارات متاحة: ${availableCars}
- سيارات مباعة: ${soldCars}

👥 عدد العملاء: ${(customers || []).length}
🏢 عدد الموردين: ${(suppliers || []).length}

📈 تفصيل شهري لسنة ${thisYear}:
${monthlyText || 'لا توجد بيانات'}

🕐 آخر 10 مبيعات:
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

    // Get user's company from profile (don't trust client)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch company data using verified company_id
    let dataContext = '';
    if (profile?.company_id) {
      try {
        dataContext = await fetchCompanyData(adminClient, profile.company_id);
      } catch (e) {
        console.error("Error fetching company data:", e);
        dataContext = '\n(لم يتم تحميل البيانات)';
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
            content: `أنت مساعد ذكي متخصص في المحاسبة وإدارة الأعمال. تعمل داخل نظام محاسبي لإدارة السيارات والمبيعات والمشتريات.

لديك وصول مباشر لبيانات الشركة الحقيقية. استخدم هذه البيانات للإجابة على أسئلة المستخدم بدقة.

${dataContext}

مهامك:
- الإجابة على الأسئلة المحاسبية والمالية باستخدام البيانات الحقيقية أعلاه
- عند السؤال عن أرقام (مبيعات، أرباح، مشتريات، مصروفات) أجب بالأرقام الفعلية من البيانات
- شرح التقارير والأرقام بلغة بسيطة
- تقديم نصائح لتحسين الأداء المالي بناءً على البيانات
- المساعدة في استخدام النظام
- تحليل البيانات المالية وتقديم رؤى

أجب دائماً باللغة العربية وبشكل مختصر ومفيد. عند ذكر أرقام استخدم الأرقام الحقيقية من البيانات.`
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
