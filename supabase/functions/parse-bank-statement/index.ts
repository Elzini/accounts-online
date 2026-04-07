import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileContent, fileName, fileType } = await req.json();

    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a bank statement parser. Extract ALL transactions from the provided bank statement content.

Return ONLY a valid JSON array of transactions. Each transaction object must have these fields:
- "transaction_date": string in YYYY-MM-DD format
- "description": string describing the transaction
- "reference": string (reference number if available, empty string if not)
- "debit": number (withdrawal amount, 0 if credit)
- "credit": number (deposit amount, 0 if debit)
- "balance": number or null (running balance if available)

Rules:
- Parse dates carefully, convert any format to YYYY-MM-DD
- Amounts should be plain numbers without currency symbols
- If a single "amount" column exists, positive = credit, negative = debit
- Include ALL transactions, don't skip any
- Return ONLY the JSON array, no markdown, no explanation
- If you cannot find transactions, return an empty array []
- For multi-page statements, extract transactions from ALL pages
- Do NOT summarize or aggregate - list every single transaction`;

    // Detect if content is a data URL (base64 encoded file like PDF)
    const isDataUrl = typeof fileContent === 'string' && fileContent.startsWith('data:');
    const isPdf = fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');

    let messages: any[];

    if (isDataUrl && isPdf) {
      // Extract base64 data from data URL
      const base64Data = fileContent.split(',')[1] || fileContent;
      
      // Send PDF as multimodal image_url content (Gemini supports PDF natively)
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Parse this bank statement PDF (file: ${fileName}). Extract ALL transactions from ALL pages and return them as a JSON array. Make sure you don't miss any transaction.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`,
              },
            },
          ],
        },
      ];
    } else {
      // Text-based content (CSV, Excel converted to text)
      const userPrompt = `Parse the following bank statement (file: ${fileName}, type: ${fileType}).
Extract all transactions and return them as a JSON array.

Content:
${fileContent}`;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يلزم إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "خطأ في معالجة الملف" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let transactions;
    try {
      transactions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "لم يتمكن الذكاء الاصطناعي من قراءة الملف بشكل صحيح", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    console.log(`Parsed ${transactions.length} transactions from ${fileName} (PDF multimodal: ${isDataUrl && isPdf})`);

    return new Response(JSON.stringify({ transactions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-bank-statement error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
