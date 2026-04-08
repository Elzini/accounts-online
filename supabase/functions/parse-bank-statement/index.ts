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

    const systemPrompt = `You are a bank statement parser. Extract ALL transactions and metadata from the provided bank statement.

Return ONLY a valid JSON object with this structure:
{
  "opening_balance": number or null,
  "closing_balance": number or null,
  "statement_period_from": "YYYY-MM-DD" or null,
  "statement_period_to": "YYYY-MM-DD" or null,
  "transactions": [...]
}

Each transaction in the "transactions" array must have these fields:
- "transaction_date": string in YYYY-MM-DD format
- "description": string describing the transaction
- "reference": string (reference number if available, empty string if not)
- "debit": number (withdrawal amount, 0 if credit)
- "credit": number (deposit amount, 0 if debit)
- "balance": number or null (running balance if available)

Rules:
- Extract the opening balance from the statement header/summary (e.g. "Opening Balance", "رصيد الحساب الافتتاحي", "الرصيد الافتتاحي")
- Extract the closing balance from the statement header/summary (e.g. "Closing Balance", "رصيد الإقفال")
- Parse dates carefully, convert any format to YYYY-MM-DD
- Amounts should be plain numbers without currency symbols
- If a single "amount" column exists, positive = credit, negative = debit
- Include ALL transactions, don't skip any
- Return ONLY the JSON object, no markdown, no explanation
- For multi-page statements, extract transactions from ALL pages
- Do NOT summarize or aggregate - list every single transaction`;

    const isDataUrl = typeof fileContent === 'string' && fileContent.startsWith('data:');
    const isPdf = fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');

    let messages: any[];

    if (isDataUrl && isPdf) {
      const base64Data = fileContent.split(',')[1] || fileContent;
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Parse this bank statement PDF (file: ${fileName}). Extract the opening balance, closing balance, and ALL transactions from ALL pages. Return them as a JSON object with opening_balance, closing_balance, and transactions array.`,
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
      const userPrompt = `Parse the following bank statement (file: ${fileName}, type: ${fileType}).
Extract the opening balance, closing balance, and all transactions. Return as a JSON object.

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
        max_tokens: 64000,
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
    const content = data.choices?.[0]?.message?.content || "{}";

    let jsonStr = content.trim();
    // Strip markdown code fences
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to recover truncated JSON by closing open arrays/objects
      console.warn("Initial JSON parse failed, attempting truncation recovery...");
      try {
        // Find the last complete transaction object (ends with })
        const lastCompleteObj = jsonStr.lastIndexOf('}');
        if (lastCompleteObj > 0) {
          let recovered = jsonStr.substring(0, lastCompleteObj + 1);
          // Count open brackets to close them
          const openBrackets = (recovered.match(/\[/g) || []).length - (recovered.match(/\]/g) || []).length;
          const openBraces = (recovered.match(/\{/g) || []).length - (recovered.match(/\}/g) || []).length;
          // Remove trailing comma if any
          recovered = recovered.replace(/,\s*$/, '');
          for (let i = 0; i < openBrackets; i++) recovered += ']';
          for (let i = 0; i < openBraces; i++) recovered += '}';
          parsed = JSON.parse(recovered);
          console.log("Successfully recovered truncated JSON");
        } else {
          throw new Error("No recoverable JSON found");
        }
      } catch (recoveryErr) {
        console.error("Failed to parse AI response:", content.substring(0, 500));
        return new Response(JSON.stringify({ error: "لم يتمكن الذكاء الاصطناعي من قراءة الملف بشكل صحيح" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle both old format (array) and new format (object with transactions)
    let transactions: any[];
    let opening_balance: number | null = null;
    let closing_balance: number | null = null;

    if (Array.isArray(parsed)) {
      transactions = parsed;
    } else {
      transactions = parsed.transactions || [];
      opening_balance = typeof parsed.opening_balance === 'number' ? parsed.opening_balance : null;
      closing_balance = typeof parsed.closing_balance === 'number' ? parsed.closing_balance : null;
    }

    console.log(`Parsed ${transactions.length} transactions from ${fileName} (PDF: ${isDataUrl && isPdf}, opening: ${opening_balance}, closing: ${closing_balance})`);

    return new Response(JSON.stringify({ transactions, opening_balance, closing_balance }), {
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
