import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expense receipt data extractor. Extract data from receipt images and return structured JSON. Always respond with valid JSON only, no markdown."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the following from this receipt image: vendor name, total amount, date, category (food/transport/office/utilities/other), and brief description. Return as JSON: {\"vendor\": \"\", \"amount\": 0, \"date\": \"YYYY-MM-DD\", \"category\": \"\", \"description\": \"\"}. Use Arabic for vendor, category, and description if the receipt is in Arabic."
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt",
              description: "Extract structured data from a receipt image",
              parameters: {
                type: "object",
                properties: {
                  vendor: { type: "string", description: "Name of the vendor/store" },
                  amount: { type: "number", description: "Total amount" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  category: { type: "string", description: "Expense category in Arabic" },
                  description: { type: "string", description: "Brief description in Arabic" }
                },
                required: ["vendor", "amount", "date", "category", "description"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    
    // Extract tool call result
    let extracted = { vendor: "غير محدد", amount: 0, date: new Date().toISOString().split('T')[0], category: "عام", description: "" };
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        // fallback: try content
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          try {
            extracted = JSON.parse(content);
          } catch {}
        }
      }
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("expense-ocr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
