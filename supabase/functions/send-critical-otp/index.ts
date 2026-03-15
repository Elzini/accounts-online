import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOTP(): string {
  const chars = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
}

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

    // التحقق من المستخدم
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

    const body = await req.json();
    const { companyId, operationType, operationDescription, entityType, entityId } = body;

    if (!companyId || !operationType) {
      return new Response(JSON.stringify({ error: 'بيانات ناقصة' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // جلب بريد المسؤول عن الشركة
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('company_id', companyId)
      .limit(1)
      .single();

    // جلب بريد المسؤول من user_roles أو من الملف الشخصي
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('permission', 'admin');

    let adminEmail = '';
    let adminUserId = '';

    if (adminRoles && adminRoles.length > 0) {
      // البحث عن أدمن مرتبط بنفس الشركة
      for (const role of adminRoles) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, company_id')
          .eq('id', role.user_id)
          .eq('company_id', companyId)
          .single();
        if (profile?.email) {
          adminEmail = profile.email;
          adminUserId = profile.id;
          break;
        }
      }
    }

    if (!adminEmail && adminProfile?.email) {
      adminEmail = adminProfile.email;
      adminUserId = adminProfile.id;
    }

    if (!adminEmail) {
      return new Response(JSON.stringify({ error: 'لم يتم العثور على بريد المسؤول' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // توليد كود OTP وتجزئته
    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 دقائق

    // حفظ الهاش فقط في قاعدة البيانات (لا يُخزّن الكود الأصلي)
    const { data: otpRecord, error: insertError } = await supabase
      .from('critical_operation_otps')
      .insert({
        company_id: companyId,
        requested_by: user.id,
        operation_type: operationType,
        operation_description: operationDescription || '',
        entity_type: entityType || '',
        entity_id: entityId || '',
        // otp_code column removed - only otp_hash is stored
        otp_hash: otpHash,
        admin_email: adminEmail,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return new Response(JSON.stringify({ error: 'فشل في إنشاء كود التحقق' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // إرسال البريد الإلكتروني للمسؤول
    const operationLabels: Record<string, string> = {
      'delete_account': 'حذف حساب محاسبي',
      'edit_account': 'تعديل حساب محاسبي أساسي',
      'delete_journal': 'حذف قيد محاسبي',
      'edit_posted_journal': 'تعديل قيد مرحّل',
      'reset_database': 'تصفير قاعدة البيانات',
      'delete_fiscal_year': 'حذف سنة مالية',
      'edit_settings': 'تعديل إعدادات النظام الأساسية',
      'bulk_delete': 'حذف جماعي للبيانات',
      'change_permissions': 'تغيير الصلاحيات',
      'export_sensitive': 'تصدير بيانات حساسة',
    };

    const operationLabel = operationLabels[operationType] || operationType;

    // محاولة إرسال بريد عبر Supabase Auth Admin
    try {
      const { error: emailError } = await supabase.auth.admin.sendRawEmail({
        email: adminEmail,
        subject: `🔐 كود تحقق للعملية الحساسة - ${operationLabel}`,
        body: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px; color: white; text-align: center;">
              <h1 style="margin: 0 0 10px;">🔐 كود التحقق</h1>
              <p style="margin: 0; opacity: 0.8;">عملية حساسة تحتاج موافقتك</p>
            </div>
            <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 12px 12px;">
              <p><strong>نوع العملية:</strong> ${operationLabel}</p>
              ${operationDescription ? `<p><strong>التفاصيل:</strong> ${operationDescription}</p>` : ''}
              <div style="background: white; border: 2px dashed #e9ecef; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: #6c757d;">كود التحقق</p>
                <h2 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #1a1a2e;">${otpCode}</h2>
              </div>
              <p style="color: #dc3545; font-size: 14px;">⏱ ينتهي صلاحية الكود خلال 5 دقائق</p>
              <p style="color: #6c757d; font-size: 12px;">إذا لم تطلب هذه العملية، يرجى تجاهل هذه الرسالة والتحقق من أمان حسابك.</p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.log('Email send via auth admin failed, OTP still saved:', emailError);
      }
    } catch (emailErr) {
      console.log('Email sending not available, OTP saved in database:', emailErr);
    }

    // تسجيل العملية في سجل العمليات الحساسة
    await supabase.from('sensitive_operations_log').insert({
      company_id: companyId,
      user_id: user.id,
      operation_type: operationType,
      operation_description: operationDescription || '',
      entity_type: entityType || '',
      entity_id: entityId || '',
      otp_verified: false,
      status: 'pending',
    });

    return new Response(JSON.stringify({
      success: true,
      otpId: otpRecord.id,
      adminEmail: adminEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresAt,
      message: 'تم إرسال كود التحقق إلى المسؤول'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Critical OTP error:', error);
    return new Response(JSON.stringify({ error: 'خطأ داخلي في الخادم' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
