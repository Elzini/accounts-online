import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileType } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/png';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `أنت محلل مالي متخصص في استخراج بيانات ميزان المراجعة من الصور والملفات.
            
مهمتك:
1. استخراج جميع الحسابات من الصورة
2. لكل حساب، استخرج:
   - رقم/كود الحساب (accountCode)
   - اسم الحساب (accountName)
   - الرصيد السابق مدين (openingDebit) - رقم
   - الرصيد السابق دائن (openingCredit) - رقم
   - الحركة مدين (movementDebit) - رقم
   - الحركة دائن (movementCredit) - رقم
   - الرصيد الختامي/الصافي مدين (closingDebit) - رقم
   - الرصيد الختامي/الصافي دائن (closingCredit) - رقم

قواعد مهمة:
- إذا كانت الخلية فارغة أو تحتوي على شرطة "-" فالقيمة = 0
- الأرقام بين أقواس مثل (1,234) تعني رقم سالب
- احذف الفواصل من الأرقام
- تجاهل صفوف العناوين والإجماليات الفرعية
- أرجع فقط الحسابات الفعلية التي لها أرقام

أرجع النتيجة كـ JSON array فقط بدون أي نص إضافي:
[{"accountCode": "...", "accountName": "...", "openingDebit": 0, "openingCredit": 0, "movementDebit": 0, "movementCredit": 0, "closingDebit": 0, "closingCredit": 0}, ...]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'استخرج جميع الحسابات من ميزان المراجعة في هذه الصورة. أرجع JSON array فقط.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content.substring(0, 500));

    // Parse the JSON from the response
    let accounts = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        accounts = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', content);
    }

    // Validate and clean the accounts
    accounts = accounts.map((acc: any) => ({
      accountCode: String(acc.accountCode || ''),
      accountName: String(acc.accountName || ''),
      openingDebit: parseFloat(acc.openingDebit) || 0,
      openingCredit: parseFloat(acc.openingCredit) || 0,
      movementDebit: parseFloat(acc.movementDebit) || 0,
      movementCredit: parseFloat(acc.movementCredit) || 0,
      closingDebit: parseFloat(acc.closingDebit) || 0,
      closingCredit: parseFloat(acc.closingCredit) || 0,
    })).filter((acc: any) => acc.accountName || acc.accountCode);

    return new Response(JSON.stringify({ 
      success: true, 
      accounts,
      count: accounts.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
