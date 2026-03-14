import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transactions, companyId } = await req.json();

    if (!transactions?.length || !companyId) {
      return new Response(JSON.stringify({ error: "Missing transactions or companyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch chart of accounts for this company
    const { data: accounts, error: accErr } = await supabase
      .from('account_categories')
      .select('id, code, name, type')
      .eq('company_id', companyId)
      .order('code');

    if (accErr) throw accErr;

    const accountsList = (accounts || [])
      .map(a => `${a.id} | ${a.code} | ${a.name} | ${a.type}`)
      .join('\n');

    // Prepare transactions summary for AI
    const txnSummary = transactions.map((t: any, i: number) => 
      `${i}: date=${t.transaction_date} | desc="${t.description || ''}" | ref="${t.reference || ''}" | debit=${t.debit || 0} | credit=${t.credit || 0}`
    ).join('\n');

    const systemPrompt = `أنت محاسب سعودي محترف. مهمتك تصنيف معاملات كشف الحساب البنكي وربطها بالحسابات المناسبة من شجرة الحسابات.

شجرة الحسابات بالتنسيق: UUID | كود | اسم | نوع
يجب أن تستخدم الـ UUID الفعلي من القائمة أدناه في حقل account_id.

قواعد التصنيف:
- التحويلات للأشخاص = ذمم مدينة أو دائنة حسب السياق (ابحث عن حساب الذمم المدينة أو الدائنة)
- رسوم بنكية / عمولات / commission = مصاريف بنكية
- Commodity Buy / مرابحة / تورق = التمويل الإسلامي أو مشتريات
- فواتير نظام سداد = مصاريف عامة أو مرافق
- رواتب = مصاريف رواتب
- إيجار = مصاريف إيجار
- إيرادات / مبيعات = حساب الإيرادات
- إذا لم تستطع التصنيف بدقة = اختر أقرب حساب مناسب من الشجرة

مهم جداً: account_id يجب أن يكون UUID حقيقي من شجرة الحسابات المقدمة. لا تخترع UUIDs.

أجب بـ JSON array فقط. كل عنصر:
{"index": رقم, "account_id": "UUID من الشجرة", "account_code": "كود الحساب", "account_name": "اسم الحساب", "confidence": "high"|"medium"|"low", "reason": "سبب التصنيف مختصر"}`;

    const userPrompt = `شجرة الحسابات المتاحة (UUID | كود | اسم | نوع):
${accountsList}

المعاملات البنكية المطلوب تصنيفها:
${txnSummary}

صنّف كل معاملة واربطها بالحساب المناسب من شجرة الحسابات أعلاه. استخدم الـ UUID الفعلي. أعد JSON array فقط.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يلزم إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "خطأ في التصنيف" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let classifications;
    try {
      classifications = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI classification:", content);
      return new Response(JSON.stringify({ error: "فشل في تحليل نتائج التصنيف", raw: content }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(classifications)) classifications = [];

    return new Response(JSON.stringify({ classifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-bank-transactions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
