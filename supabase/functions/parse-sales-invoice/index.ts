import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileContent, fileName, batchFiles } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (batchFiles && Array.isArray(batchFiles) && batchFiles.length > 0) {
      const results = [];
      const errors = [];
      
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        try {
          const result = await parseSalesInvoice(file.fileContent, file.fileName, LOVABLE_API_KEY);
          results.push({ index: i, fileName: file.fileName, data: result, success: true });
        } catch (e) {
          console.error(`Error parsing file ${file.fileName}:`, e);
          errors.push({ index: i, fileName: file.fileName, error: e instanceof Error ? e.message : "Unknown error" });
        }
        if (i < batchFiles.length - 1) await new Promise(r => setTimeout(r, 500));
      }
      
      return new Response(JSON.stringify({ results, errors, total: batchFiles.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = await parseSalesInvoice(fileContent, fileName, LOVABLE_API_KEY);
    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-sales-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseSalesInvoice(fileContent: string, fileName: string, apiKey: string) {
  const isPDF = fileName?.toLowerCase().endsWith('.pdf');

  const systemPrompt = `أنت محلل فواتير مبيعات محترف ودقيق جداً. مهمتك استخراج جميع البيانات من فاتورة المبيعات.

تعليمات مهمة جداً:
1. رقم الفاتورة: استخرج رقم الفاتورة بدقة تامة كما هو مكتوب في الفاتورة.
2. الأرقام العربية: حوّل جميع الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية (0123456789).
3. التواريخ: حوّل التواريخ إلى صيغة YYYY-MM-DD.
4. المبالغ: استخرج المبالغ كأرقام بدون رموز عملات. لا تقرب الأرقام أبداً.
5. بنود الفاتورة: استخرج كل بند بدقة مع الكمية وسعر الوحدة والإجمالي.
6. معلومات العميل: استخرج اسم العميل ورقمه الضريبي وهاتفه وعنوانه إن وجدت.
7. تحديد نوع الأسعار:
   - إذا كانت الفاتورة تحتوي على أعمدة منفصلة للسعر والضريبة، فالأسعار قبل الضريبة (price_includes_tax = false).
   - إذا كان السعر شامل الضريبة بدون فصل، فـ (price_includes_tax = true).
8. سعر الوحدة (unit_price): يجب أن يكون سعر الوحدة قبل الضريبة دائماً.
9. subtotal: المجموع الكلي قبل الضريبة.
10. total_amount: الإجمالي النهائي شامل الضريبة.
11. طريقة الدفع: إن وجدت (نقدي، شبكة، تحويل بنكي، آجل).

أعد النتائج كـ JSON فقط بدون أي تنسيق markdown.`;

  const userContent: any[] = [
    {
      type: "text",
      text: `حلل فاتورة المبيعات التالية واستخرج جميع البيانات بدقة.
الملف: ${fileName}

${isPDF ? 'الملف مرفق كصورة/PDF.' : `المحتوى:\n${fileContent}`}`,
    },
  ];

  if (isPDF || fileContent.startsWith('data:image/') || fileContent.startsWith('data:application/pdf')) {
    userContent.push({ type: "image_url", image_url: { url: fileContent } });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_sales_invoice",
            description: "Extract structured data from a sales invoice.",
            parameters: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "اسم العميل/المشتري" },
                customer_tax_number: { type: "string", description: "الرقم الضريبي للعميل" },
                customer_phone: { type: "string", description: "هاتف العميل" },
                customer_address: { type: "string", description: "عنوان العميل" },
                invoice_number: { type: "string", description: "رقم الفاتورة" },
                invoice_date: { type: "string", description: "تاريخ الفاتورة YYYY-MM-DD" },
                due_date: { type: "string", description: "تاريخ الاستحقاق YYYY-MM-DD" },
                items: {
                  type: "array",
                  description: "بنود الفاتورة",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string", description: "وصف البند (اسم السيارة أو المنتج)" },
                      quantity: { type: "number", description: "الكمية" },
                      unit_price: { type: "number", description: "سعر الوحدة قبل الضريبة" },
                      total: { type: "number", description: "الإجمالي قبل الضريبة" },
                      chassis_number: { type: "string", description: "رقم الهيكل/الشاصي إن وجد" },
                      plate_number: { type: "string", description: "رقم اللوحة إن وجد" },
                      color: { type: "string", description: "لون السيارة إن وجد" },
                      model: { type: "string", description: "الموديل/سنة الصنع إن وجد" },
                      car_condition: { type: "string", description: "حالة السيارة: new أو used إن وجد" },
                    },
                    required: ["description", "quantity", "unit_price", "total"],
                  },
                },
                subtotal: { type: "number", description: "المجموع قبل الضريبة" },
                vat_amount: { type: "number", description: "مبلغ ضريبة القيمة المضافة" },
                vat_rate: { type: "number", description: "نسبة الضريبة" },
                total_amount: { type: "number", description: "الإجمالي شامل الضريبة" },
                discount: { type: "number", description: "مبلغ الخصم" },
                payment_method: { type: "string", description: "طريقة الدفع (نقدي، شبكة، تحويل، آجل)" },
                notes: { type: "string", description: "ملاحظات" },
                price_includes_tax: { type: "boolean", description: "هل الأسعار شاملة الضريبة" },
                seller_name: { type: "string", description: "اسم البائع/الموظف إن وجد" },
              },
              required: ["invoice_number", "invoice_date", "items", "total_amount"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_sales_invoice" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً");
    if (response.status === 402) throw new Error("يرجى شحن رصيد الاستخدام");
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiData = await response.json();
  let extracted: any = {};
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try { extracted = JSON.parse(toolCall.function.arguments); } catch {
      const content = aiData.choices?.[0]?.message?.content;
      if (content) { try { extracted = JSON.parse(content); } catch {} }
    }
  }
  return extracted;
}
