import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashOTP(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'مستخدم غير صالح' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { otpId, code, companyId } = await req.json();

    if (!otpId || !code || !companyId) {
      return new Response(JSON.stringify({ error: 'بيانات ناقصة' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Hash the submitted code
    const codeHash = await hashOTP(code);

    // Find the OTP record using the hash
    const { data: otpRecord, error } = await supabase
      .from('critical_operation_otps')
      .select('*')
      .eq('id', otpId)
      .eq('company_id', companyId)
      .eq('otp_hash', codeHash)
      .eq('is_used', false)
      .single();

    if (error || !otpRecord) {
      return new Response(JSON.stringify({ error: 'كود التحقق غير صحيح', valid: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'انتهت صلاحية كود التحقق', valid: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark as used
    await supabase
      .from('critical_operation_otps')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', otpId);

    // Update sensitive operations log
    await supabase
      .from('sensitive_operations_log')
      .update({ otp_verified: true, status: 'approved' })
      .eq('company_id', companyId)
      .eq('operation_type', otpRecord.operation_type)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({ valid: true, message: 'تم التحقق بنجاح' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return new Response(JSON.stringify({ error: 'خطأ داخلي في الخادم' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
