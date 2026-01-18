import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} for company ${companyName}`);

    const emailResponse = await resend.emails.send({
      from: "نظام إدارة السيارات <onboarding@resend.dev>",
      to: [email],
      subject: "مرحباً بك في نظام إدارة السيارات - تم تسجيل شركتك بنجاح",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🚗</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">مرحباً بك!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">تم تسجيل شركتك بنجاح</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">أهلاً بشركة ${companyName}!</h2>
              
              <p style="color: #4b5563; line-height: 1.8; margin: 0 0 20px; font-size: 16px;">
                شكراً لتسجيلك في نظام إدارة السيارات. نحن سعداء بانضمامك إلينا!
              </p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #166534; margin: 0 0 12px; font-size: 18px;">✅ تم تفعيل حسابك</h3>
                <p style="color: #15803d; margin: 0; font-size: 14px;">
                  يمكنك الآن تسجيل الدخول والبدء في استخدام النظام
                </p>
              </div>
              
              <h3 style="color: #1f2937; margin: 25px 0 15px; font-size: 18px;">ما يمكنك فعله الآن:</h3>
              
              <ul style="color: #4b5563; line-height: 2; padding-right: 20px; margin: 0;">
                <li>إدارة مخزون السيارات</li>
                <li>تسجيل عمليات الشراء والبيع</li>
                <li>إدارة العملاء والموردين</li>
                <li>متابعة التقارير والإحصائيات</li>
              </ul>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}" 
                   style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  تسجيل الدخول الآن
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                نظام إدارة السيارات - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
