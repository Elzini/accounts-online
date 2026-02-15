import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendReminderRequest {
  tripId?: string;
  checkAll?: boolean;
}

function formatPhoneNumber(phone: string): string {
  let phoneNumber = phone.replace(/\s/g, "");
  if (!phoneNumber.startsWith("+")) {
    if (phoneNumber.startsWith("05")) {
      phoneNumber = "+966" + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith("5")) {
      phoneNumber = "+966" + phoneNumber;
    } else if (phoneNumber.startsWith("0")) {
      phoneNumber = "+20" + phoneNumber.substring(1);
    } else {
      phoneNumber = "+966" + phoneNumber;
    }
  }
  return phoneNumber;
}

async function sendSmsViaInfobip(
  apiKey: string,
  baseUrl: string,
  phone: string,
  message: string,
  from?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = {
      messages: [
        {
          destinations: [{ to: phone }],
          from: from || "InfoSMS",
          text: message,
        },
      ],
    };

    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `App ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result?.requestError?.serviceException?.text || `HTTP ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function sendEmailReminder(
  resend: any,
  email: string,
  trip: any,
  passengerName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const name = passengerName || trip.customer_name;
    const notesHtml = trip.notes ? `<tr><td style="padding:10px;color:#6b7280;">ملاحظات</td><td style="padding:10px;color:#111827;">${trip.notes}</td></tr>` : '';
    
    await resend.emails.send({
      from: "Elzini SaaS <onboarding@resend.dev>",
      to: [email],
      subject: `تذكير برحلتك 🚗 - ${trip.destination}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;background:#f4f7fa;direction:rtl;">
          <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;">🚗 تذكير برحلتك</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">مرحباً ${name}</p>
            </div>
            <div style="padding:30px;">
              <table style="width:100%;border-collapse:collapse;font-size:15px;">
                <tr><td style="padding:10px;color:#6b7280;width:120px;">الوجهة</td><td style="padding:10px;color:#111827;font-weight:bold;">${trip.destination}</td></tr>
                <tr><td style="padding:10px;color:#6b7280;">نقطة الانطلاق</td><td style="padding:10px;color:#111827;">${trip.departure_point}</td></tr>
                <tr><td style="padding:10px;color:#6b7280;">التاريخ</td><td style="padding:10px;color:#111827;">${trip.trip_date}</td></tr>
                <tr><td style="padding:10px;color:#6b7280;">الوقت</td><td style="padding:10px;color:#111827;">${trip.trip_time}</td></tr>
                ${trip.price ? `<tr><td style="padding:10px;color:#6b7280;">السعر</td><td style="padding:10px;color:#111827;">${trip.price} ريال</td></tr>` : ''}
                ${notesHtml}
              </table>
              <div style="margin-top:20px;padding:15px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;text-align:center;">
                <p style="color:#166534;margin:0;font-size:14px;">نتمنى لك رحلة سعيدة! 🌟</p>
              </div>
            </div>
            <div style="background:#f9fafb;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;margin:0;font-size:12px;">Elzini SaaS - إشعار تلقائي</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Email reminder error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INFOBIP_API_KEY = Deno.env.get("INFOBIP_API_KEY");
    if (!INFOBIP_API_KEY) throw new Error("INFOBIP_API_KEY not configured");

    let INFOBIP_BASE_URL = Deno.env.get("INFOBIP_BASE_URL");
    if (!INFOBIP_BASE_URL) throw new Error("INFOBIP_BASE_URL not configured");
    if (!INFOBIP_BASE_URL.startsWith("http")) INFOBIP_BASE_URL = `https://${INFOBIP_BASE_URL}`;
    INFOBIP_BASE_URL = INFOBIP_BASE_URL.replace(/\/+$/, "");

    const SENDER_NAME = Deno.env.get("INFOBIP_SENDER_NAME");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
    const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tripId, checkAll }: SendReminderRequest = await req.json();
    let tripsToRemind = [];

    if (tripId) {
      const { data: trip, error } = await supabaseAdmin.from("trips").select("*").eq("id", tripId).single();
      if (error) throw error;
      if (trip) tripsToRemind.push(trip);
    } else if (checkAll) {
      const now = new Date();
      const { data: trips, error } = await supabaseAdmin
        .from("trips").select("*").eq("status", "scheduled").eq("reminder_sent", false);
      if (error) throw error;

      tripsToRemind = (trips || []).filter((trip) => {
        const tripDateTime = new Date(`${trip.trip_date}T${trip.trip_time}`);
        const reminderTime = new Date(tripDateTime.getTime() - (trip.reminder_hours_before * 60 * 60 * 1000));
        return now >= reminderTime && tripDateTime > now;
      });
    }

    const results = [];

    for (const trip of tripsToRemind) {
      try {
        // 1. Send SMS to customer
        const phoneNumber = formatPhoneNumber(trip.customer_phone);
        const notesText = trip.notes ? `\n📝 ملاحظات: ${trip.notes}` : '';
        const message = `تذكير برحلتك 🚗\n📍 الوجهة: ${trip.destination}\n📍 نقطة الانطلاق: ${trip.departure_point}\n📅 التاريخ: ${trip.trip_date}\n⏰ الوقت: ${trip.trip_time}\n💰 السعر: ${trip.price} ريال${notesText}\n\nنتمنى لك رحلة سعيدة!`;

        const smsResult = await sendSmsViaInfobip(INFOBIP_API_KEY, INFOBIP_BASE_URL, phoneNumber, message, SENDER_NAME);

        // 2. Send email to customer if they have an email
        if (resend && trip.customer_email) {
          const emailResult = await sendEmailReminder(resend, trip.customer_email, trip);
          console.log(`Email reminder to customer ${trip.customer_email}:`, emailResult.success ? "sent" : emailResult.error);
        }

        // 3. Send admin notification email
        if (resend && ADMIN_EMAIL) {
          try {
            const now = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' });
            await resend.emails.send({
              from: "Elzini SaaS <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `🔔 تذكير رحلة: ${trip.customer_name} - ${trip.destination}`,
              html: `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar"><head><meta charset="UTF-8"></head>
                <body style="font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;background:#f4f7fa;direction:rtl;">
                  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:25px;text-align:center;">
                      <h1 style="color:#fff;margin:0;font-size:20px;">🔔 تذكير رحلة تم إرساله</h1>
                    </div>
                    <div style="padding:25px;">
                      <table style="width:100%;border-collapse:collapse;font-size:14px;">
                        <tr><td style="padding:8px;color:#6b7280;">العميل</td><td style="padding:8px;color:#111827;font-weight:bold;">${trip.customer_name}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">الهاتف</td><td style="padding:8px;color:#111827;" dir="ltr">${trip.customer_phone}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">الوجهة</td><td style="padding:8px;color:#111827;">${trip.destination}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">التاريخ</td><td style="padding:8px;color:#111827;">${trip.trip_date} - ${trip.trip_time}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">وقت الإرسال</td><td style="padding:8px;color:#111827;">${now}</td></tr>
                        <tr><td style="padding:8px;color:#6b7280;">حالة SMS</td><td style="padding:8px;color:${smsResult.success ? '#166534' : '#dc2626'};">${smsResult.success ? '✅ تم الإرسال' : '❌ فشل: ' + smsResult.error}</td></tr>
                      </table>
                    </div>
                    <div style="background:#f9fafb;padding:12px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="color:#9ca3af;margin:0;font-size:11px;">Elzini SaaS - إشعار إداري تلقائي</p>
                    </div>
                  </div>
                </body></html>
              `,
            });
          } catch (adminErr) {
            console.error("Admin email failed:", adminErr);
          }
        }

        if (!smsResult.success) {
          results.push({ tripId: trip.id, success: false, error: smsResult.error });
          continue;
        }

        // Mark reminder as sent
        await supabaseAdmin.from("trips").update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
        }).eq("id", trip.id);

        results.push({ tripId: trip.id, success: true, phone: phoneNumber });
        console.log(`Reminder sent for trip ${trip.id} to ${phoneNumber}`);

        // Send to additional passengers
        const { data: passengers } = await supabaseAdmin
          .from("trip_passengers").select("*").eq("trip_id", trip.id);

        for (const passenger of passengers || []) {
          // SMS
          if (passenger.passenger_phone) {
            const passengerPhone = formatPhoneNumber(passenger.passenger_phone);
            const passengerMsg = `تذكير برحلتك 🚗\nمرحباً ${passenger.passenger_name}\n📍 الوجهة: ${trip.destination}\n📍 نقطة الانطلاق: ${trip.departure_point}\n📅 التاريخ: ${trip.trip_date}\n⏰ الوقت: ${trip.trip_time}\n\nنتمنى لك رحلة سعيدة!`;
            await sendSmsViaInfobip(INFOBIP_API_KEY, INFOBIP_BASE_URL, passengerPhone, passengerMsg, SENDER_NAME);
            console.log(`Passenger SMS sent to ${passengerPhone}`);
          }
          // Email
          if (resend && passenger.passenger_email) {
            const emailResult = await sendEmailReminder(resend, passenger.passenger_email, trip, passenger.passenger_name);
            console.log(`Passenger email to ${passenger.passenger_email}:`, emailResult.success ? "sent" : emailResult.error);
          }
        }
      } catch (tripError) {
        console.error(`Error for trip ${trip.id}:`, tripError);
        results.push({ tripId: trip.id, success: false, error: tripError instanceof Error ? tripError.message : "Unknown error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersProcessed: tripsToRemind.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-trip-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
