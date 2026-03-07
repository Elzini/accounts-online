import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  companyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName }: WelcomeEmailRequest = await req.json();

    if (!email || !companyName) {
      return new Response(
        JSON.stringify({ error: 'Email and company name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedCompanyName = companyName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    console.log(`Sending welcome email to ${email} for company ${sanitizedCompanyName}`);

    // 1. Send welcome email to the new user
    const emailResponse = await resend.emails.send({
      from: "Elzini SaaS <onboarding@resend.dev>",
      to: [email],
      subject: "مرحباً بك في Elzini SaaS - تم تسجيل شركتك بنجاح",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🏢</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">مرحباً بك!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">تم تسجيل شركتك بنجاح</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">أهلاً بشركة ${sanitizedCompanyName}!</h2>
              <p style="color: #4b5563; line-height: 1.8; margin: 0 0 20px; font-size: 16px;">
                شكراً لتسجيلك في Elzini SaaS. نحن سعداء بانضمامك إلينا!
              </p>
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #166534; margin: 0 0 12px; font-size: 18px;">✅ تم تفعيل حسابك</h3>
                <p style="color: #15803d; margin: 0; font-size: 14px;">
                  يمكنك الآن تسجيل الدخول والبدء في استخدام النظام
                </p>
              </div>
              <h3 style="color: #1f2937; margin: 25px 0 15px; font-size: 18px;">ما يمكنك فعله الآن:</h3>
              <ul style="color: #4b5563; line-height: 2; padding-right: 20px; margin: 0;">
                <li>إدارة الحسابات والقيود المحاسبية</li>
                <li>تسجيل عمليات الشراء والبيع</li>
                <li>إدارة العملاء والموردين</li>
                <li>متابعة التقارير والإحصائيات</li>
              </ul>
            </div>
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                Elzini SaaS - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // 2. Send admin notification email
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    if (adminEmail) {
      try {
        const now = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' });
        const adminNotification = await resend.emails.send({
          from: "Elzini SaaS <onboarding@resend.dev>",
          to: [adminEmail],
          subject: `🆕 تسجيل شركة جديدة: ${sanitizedCompanyName}`,
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; direction: rtl;">
              <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 22px;">🆕 تسجيل شركة جديدة</h1>
                </div>
                <div style="padding: 30px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 130px;">اسم الشركة</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">${sanitizedCompanyName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">البريد الإلكتروني</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;" dir="ltr">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">تاريخ التسجيل</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${now}</td>
                    </tr>
                  </table>
                </div>
                <div style="background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; margin: 0; font-size: 12px;">Elzini SaaS - إشعار تلقائي</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log("Admin notification sent:", adminNotification);
      } catch (adminError) {
        console.error("Failed to send admin notification:", adminError);
        // Don't fail the main request if admin notification fails
      }
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
