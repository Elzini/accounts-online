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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials not configured");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tripId, checkAll }: SendReminderRequest = await req.json();

    let tripsToRemind = [];

    if (tripId) {
      // Send reminder for specific trip
      const { data: trip, error } = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      if (trip) tripsToRemind.push(trip);
    } else if (checkAll) {
      // Check all trips that need reminders
      const now = new Date();
      
      const { data: trips, error } = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("status", "scheduled")
        .eq("reminder_sent", false);

      if (error) throw error;

      // Filter trips that are within reminder window
      tripsToRemind = (trips || []).filter((trip) => {
        const tripDateTime = new Date(`${trip.trip_date}T${trip.trip_time}`);
        const reminderTime = new Date(tripDateTime.getTime() - (trip.reminder_hours_before * 60 * 60 * 1000));
        return now >= reminderTime && tripDateTime > now;
      });
    }

    const results = [];

    for (const trip of tripsToRemind) {
      try {
        // Format phone number (ensure it starts with +)
        let phoneNumber = trip.customer_phone.replace(/\s/g, "");
        if (!phoneNumber.startsWith("+")) {
          // Assume Saudi Arabia if no country code
          if (phoneNumber.startsWith("0")) {
            phoneNumber = "+966" + phoneNumber.substring(1);
          } else {
            phoneNumber = "+966" + phoneNumber;
          }
        }

        // Create SMS message in Arabic
        const message = `تذكير برحلتك 🚗
📍 الوجهة: ${trip.destination}
📍 نقطة الانطلاق: ${trip.departure_point}
📅 التاريخ: ${trip.trip_date}
⏰ الوقت: ${trip.trip_time}
💰 السعر: ${trip.price} ريال

نتمنى لك رحلة سعيدة!`;

        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", phoneNumber);
        // Use Alphanumeric Sender ID instead of phone number for Saudi Arabia
        formData.append("From", "Trips");
        formData.append("Body", message);

        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const twilioResult = await twilioResponse.json();

        if (!twilioResponse.ok) {
          console.error("Twilio error:", twilioResult);
          results.push({
            tripId: trip.id,
            success: false,
            error: twilioResult.message || "Failed to send SMS",
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
          messageSid: twilioResult.sid,
        });

        console.log(`Reminder sent for trip ${trip.id} to ${phoneNumber}`);

        // Also send to additional passengers if they have phone numbers
        const { data: passengers } = await supabaseAdmin
          .from("trip_passengers")
          .select("*")
          .eq("trip_id", trip.id);

        for (const passenger of passengers || []) {
          if (passenger.passenger_phone) {
            let passengerPhone = passenger.passenger_phone.replace(/\s/g, "");
            if (!passengerPhone.startsWith("+")) {
              if (passengerPhone.startsWith("0")) {
                passengerPhone = "+966" + passengerPhone.substring(1);
              } else {
                passengerPhone = "+966" + passengerPhone;
              }
            }

            const passengerMessage = `تذكير برحلتك 🚗
مرحباً ${passenger.passenger_name}
📍 الوجهة: ${trip.destination}
📍 نقطة الانطلاق: ${trip.departure_point}
📅 التاريخ: ${trip.trip_date}
⏰ الوقت: ${trip.trip_time}

نتمنى لك رحلة سعيدة!`;

            const passengerFormData = new URLSearchParams();
            passengerFormData.append("To", passengerPhone);
            // Use Alphanumeric Sender ID for passengers too
            passengerFormData.append("From", "Trips");
            passengerFormData.append("Body", passengerMessage);

            await fetch(twilioUrl, {
              method: "POST",
              headers: {
                "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: passengerFormData.toString(),
            });
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
