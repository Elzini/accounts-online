import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { historicalSummary, forecastSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت محلل مالي خبير متخصص في توقعات المبيعات. حلل البيانات التالية وقدم:
1. ملخص للاتجاهات الرئيسية
2. تقييم دقة التوقعات الإحصائية
3. عوامل الخطر المحتملة
4. توصيات عملية لتحسين المبيعات
5. فرص النمو المتاحة

كن دقيقاً ومحدداً في تحليلك. استخدم الأرقام الفعلية من البيانات. أجب بالعربية.`;

    const userPrompt = `## البيانات التاريخية (آخر 12 شهر):
${historicalSummary}

## التوقعات الإحصائية (6 أشهر قادمة):
${forecastSummary}

حلل هذه البيانات وقدم رؤيتك المتخصصة.`;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام التحليل الذكي" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "لم يتم الحصول على تحليل";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-sales-forecast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
