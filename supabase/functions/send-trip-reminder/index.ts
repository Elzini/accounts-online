import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendReminderRequest {
  tripId?: string;
  checkAll?: boolean;
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  let phoneNumber = phone.replace(/\s/g, "");
  if (!phoneNumber.startsWith("+")) {
    // Saudi numbers starting with 05
    if (phoneNumber.startsWith("05")) {
      phoneNumber = "+966" + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith("5")) {
      phoneNumber = "+966" + phoneNumber;
    } else if (phoneNumber.startsWith("0")) {
      // Egypt numbers starting with 0
      phoneNumber = "+20" + phoneNumber.substring(1);
    } else {
      // Default to Saudi Arabia
      phoneNumber = "+966" + phoneNumber;
    }
  }
  return phoneNumber;
}

// Send SMS via Infobip API
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
      console.error("Infobip SMS error:", result);
      return { 
        success: false, 
        error: result?.requestError?.serviceException?.text || `HTTP ${response.status}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send SMS via Infobip:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INFOBIP_API_KEY = Deno.env.get("INFOBIP_API_KEY");
    if (!INFOBIP_API_KEY) {
      throw new Error("INFOBIP_API_KEY not configured");
    }

    const INFOBIP_BASE_URL = Deno.env.get("INFOBIP_BASE_URL");
    if (!INFOBIP_BASE_URL) {
      throw new Error("INFOBIP_BASE_URL not configured");
    }

    // Optional: Get sender name from environment
    const SENDER_NAME = Deno.env.get("INFOBIP_SENDER_NAME");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tripId, checkAll }: SendReminderRequest = await req.json();

    let tripsToRemind = [];

    if (tripId) {
      const { data: trip, error } = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      if (trip) tripsToRemind.push(trip);
    } else if (checkAll) {
      const now = new Date();
      
      const { data: trips, error } = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("status", "scheduled")
        .eq("reminder_sent", false);

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
        const phoneNumber = formatPhoneNumber(trip.customer_phone);

        const message = `تذكير برحلتك 🚗
📍 الوجهة: ${trip.destination}
📍 نقطة الانطلاق: ${trip.departure_point}
📅 التاريخ: ${trip.trip_date}
⏰ الوقت: ${trip.trip_time}
💰 السعر: ${trip.price} ريال

نتمنى لك رحلة سعيدة!`;

        const smsResult = await sendSmsViaInfobip(
          INFOBIP_API_KEY,
          INFOBIP_BASE_URL,
          phoneNumber,
          message,
          SENDER_NAME
        );

        if (!smsResult.success) {
          results.push({
            tripId: trip.id,
            success: false,
            error: smsResult.error,
          });
          continue;
        }

        // Mark reminder as sent
        await supabaseAdmin
          .from("trips")
          .update({
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", trip.id);

        results.push({
          tripId: trip.id,
          success: true,
          phone: phoneNumber,
        });

        console.log(`Reminder sent for trip ${trip.id} to ${phoneNumber}`);

        // Also send to additional passengers
        const { data: passengers } = await supabaseAdmin
          .from("trip_passengers")
          .select("*")
          .eq("trip_id", trip.id);

        for (const passenger of passengers || []) {
          if (passenger.passenger_phone) {
            const passengerPhone = formatPhoneNumber(passenger.passenger_phone);

            const passengerMessage = `تذكير برحلتك 🚗
مرحباً ${passenger.passenger_name}
📍 الوجهة: ${trip.destination}
📍 نقطة الانطلاق: ${trip.departure_point}
📅 التاريخ: ${trip.trip_date}
⏰ الوقت: ${trip.trip_time}

نتمنى لك رحلة سعيدة!`;

            await sendSmsViaInfobip(
              INFOBIP_API_KEY,
              INFOBIP_BASE_URL,
              passengerPhone,
              passengerMessage,
              SENDER_NAME
            );
            
            console.log(`Passenger reminder sent to ${passengerPhone}`);
          }
        }

      } catch (tripError) {
        console.error(`Error sending reminder for trip ${trip.id}:`, tripError);
        results.push({
          tripId: trip.id,
          success: false,
          error: tripError instanceof Error ? tripError.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersProcessed: tripsToRemind.length,
        results 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-trip-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
