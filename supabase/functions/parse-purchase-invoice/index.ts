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

    // Handle batch mode
    if (batchFiles && Array.isArray(batchFiles) && batchFiles.length > 0) {
      const results = [];
      const errors = [];
      
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        try {
          const result = await parseInvoice(file.fileContent, file.fileName, LOVABLE_API_KEY);
          results.push({ index: i, fileName: file.fileName, data: result, success: true });
        } catch (e) {
          console.error(`Error parsing file ${file.fileName}:`, e);
          errors.push({ index: i, fileName: file.fileName, error: e instanceof Error ? e.message : "Unknown error" });
        }
        
        // Small delay between requests to avoid rate limiting
        if (i < batchFiles.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      return new Response(JSON.stringify({ results, errors, total: batchFiles.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single file mode
    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = await parseInvoice(fileContent, fileName, LOVABLE_API_KEY);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-purchase-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseInvoice(fileContent: string, fileName: string, apiKey: string) {
  const isPDF = fileName?.toLowerCase().endsWith('.pdf');

  const systemPrompt = `أنت محلل فواتير مشتريات محترف ودقيق جداً. مهمتك استخراج جميع البيانات من فاتورة المشتريات.

تعليمات مهمة جداً:
1. رقم الفاتورة: استخرج رقم الفاتورة بدقة تامة كما هو مكتوب في الفاتورة. قد يكون بالأرقام العربية (١٢٣) أو الإنجليزية (123). انتبه للفرق بين أرقام مثل ١٧٠ و ١-١٧٠. إذا كان الرقم يحتوي على شرطة أو بادئة مثل "1-170" فاستخرجه كاملاً.
2. الأرقام العربية: حوّل جميع الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية (0123456789) في جميع الحقول الرقمية.
3. التواريخ: حوّل التواريخ إلى صيغة YYYY-MM-DD.
4. المبالغ: استخرج المبالغ كأرقام بدون رموز عملات.
5. بنود الفاتورة: استخرج كل بند بدقة مع الكمية وسعر الوحدة والإجمالي.
6. تحديد نوع الأسعار (مهم جداً):
   - إذا كانت الفاتورة تحتوي على أعمدة منفصلة للسعر والضريبة والإجمالي الصافي (Net)، فالأسعار قبل الضريبة (price_includes_tax = false).
   - إذا كان السعر الموضح هو السعر النهائي شامل الضريبة بدون فصل، فـ (price_includes_tax = true).
   - في معظم الفواتير السعودية الضريبية، الأسعار تكون قبل الضريبة (price_includes_tax = false).
7. سعر الوحدة (unit_price): يجب أن يكون سعر الوحدة قبل الضريبة دائماً. إذا كانت الأسعار شاملة الضريبة، اقسم على (1 + نسبة الضريبة).
8. إجمالي البند (total): يجب أن يكون إجمالي البند قبل الضريبة (الكمية × سعر الوحدة قبل الضريبة).
9. subtotal: المجموع الكلي قبل الضريبة لجميع البنود.
10. total_amount: الإجمالي النهائي شامل الضريبة.

أعد النتائج كـ JSON فقط بدون أي تنسيق markdown.`;

  const userContent: any[] = [
    {
      type: "text",
      text: `حلل فاتورة المشتريات التالية واستخرج جميع البيانات بدقة.
الملف: ${fileName}

انتبه بشكل خاص لرقم الفاتورة - استخرجه بالضبط كما يظهر في الفاتورة.

${isPDF ? 'الملف مرفق كصورة/PDF.' : `المحتوى:\n${fileContent}`}`,
    },
  ];

  if (isPDF || fileContent.startsWith('data:image/') || fileContent.startsWith('data:application/pdf')) {
    userContent.push({
      type: "image_url",
      image_url: { url: fileContent },
    });
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
            name: "extract_purchase_invoice",
            description: "Extract structured data from a purchase invoice. Invoice number must be extracted exactly as shown on the invoice document.",
            parameters: {
              type: "object",
              properties: {
                supplier_name: { type: "string", description: "اسم المورد" },
                supplier_tax_number: { type: "string", description: "الرقم الضريبي للمورد" },
                supplier_phone: { type: "string", description: "هاتف المورد" },
                supplier_address: { type: "string", description: "عنوان المورد" },
                invoice_number: { type: "string", description: "رقم الفاتورة بالضبط كما يظهر في الفاتورة - مثل 1-170 أو INV-001" },
                invoice_date: { type: "string", description: "تاريخ الفاتورة YYYY-MM-DD" },
                due_date: { type: "string", description: "تاريخ الاستحقاق YYYY-MM-DD" },
                items: {
                  type: "array",
                  description: "بنود الفاتورة",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string", description: "وصف البند" },
                      quantity: { type: "number", description: "الكمية" },
                      unit_price: { type: "number", description: "سعر الوحدة" },
                      total: { type: "number", description: "الإجمالي" },
                    },
                    required: ["description", "quantity", "unit_price", "total"],
                  },
                },
                subtotal: { type: "number", description: "المجموع قبل الضريبة" },
                vat_amount: { type: "number", description: "مبلغ ضريبة القيمة المضافة" },
                vat_rate: { type: "number", description: "نسبة الضريبة" },
                total_amount: { type: "number", description: "الإجمالي شامل الضريبة" },
                discount: { type: "number", description: "مبلغ الخصم إن وجد" },
                notes: { type: "string", description: "ملاحظات أخرى" },
                price_includes_tax: { type: "boolean", description: "هل الأسعار شاملة الضريبة" },
              },
              required: ["supplier_name", "invoice_number", "invoice_date", "items", "total_amount"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_purchase_invoice" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً");
    }
    if (response.status === 402) {
      throw new Error("يرجى شحن رصيد الاستخدام");
    }
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiData = await response.json();

  let extracted: any = {};
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try { extracted = JSON.parse(content); } catch {}
      }
    }
  }

  return extracted;
}
