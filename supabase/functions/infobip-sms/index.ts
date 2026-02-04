import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendOtpRequest {
  action: "send-otp";
  phone: string;
  messageText?: string;
}

interface VerifyOtpRequest {
  action: "verify-otp";
  phone: string;
  otp: string;
  pinId: string;
}

interface SendSmsRequest {
  action: "send-sms";
  phone: string;
  message: string;
  from?: string;
}

interface CheckBalanceRequest {
  action: "check-balance";
}

type RequestBody = SendOtpRequest | VerifyOtpRequest | SendSmsRequest | CheckBalanceRequest;

// Store PIN IDs temporarily (in production, use a database)
const pinIdStore = new Map<string, string>();

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

    const requestBody: RequestBody = await req.json();
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `App ${INFOBIP_API_KEY}`,
    };

    let response: Response;
    let result: unknown;

    switch (requestBody.action) {
      case "send-otp": {
        const { phone, messageText } = requestBody;

        // Use Infobip 2FA API to send OTP
        const body = {
          applicationId: "default",
          messageId: "default",
          from: "InfoSMS",
          to: phone,
          messageText: messageText || "رمز التحقق الخاص بك هو: {{pin}}",
          pinType: "NUMERIC",
          pinLength: 6,
        };

        response = await fetch(`${INFOBIP_BASE_URL}/2fa/2/pin`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Infobip send-otp error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "requestError" in result
              ? String((result as { requestError: { serviceException: { text: string } } }).requestError?.serviceException?.text || "Failed to send OTP")
              : "Failed to send OTP"
          );
        }

        // Store pinId for verification
        const pinId = (result as { pinId: string }).pinId;
        if (pinId) {
          pinIdStore.set(phone, pinId);
        }

        console.log("OTP sent successfully via Infobip to", phone);
        break;
      }

      case "verify-otp": {
        const { phone, otp, pinId: providedPinId } = requestBody;
        
        // Get pinId from store or use provided one
        const pinId = providedPinId || pinIdStore.get(phone);
        if (!pinId) {
          throw new Error("No pending OTP verification for this phone number");
        }

        response = await fetch(`${INFOBIP_BASE_URL}/2fa/2/pin/${pinId}/verify`, {
          method: "POST",
          headers,
          body: JSON.stringify({ pin: otp }),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Infobip verify-otp error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "requestError" in result
              ? String((result as { requestError: { serviceException: { text: string } } }).requestError?.serviceException?.text || "Failed to verify OTP")
              : "Failed to verify OTP"
          );
        }

        // Clear pinId after verification
        pinIdStore.delete(phone);

        console.log("OTP verification result for", phone, ":", result);
        break;
      }

      case "send-sms": {
        const { phone, message, from } = requestBody;

        const body = {
          messages: [
            {
              destinations: [{ to: phone }],
              from: from || "InfoSMS",
              text: message,
            },
          ],
        };

        response = await fetch(`${INFOBIP_BASE_URL}/sms/2/text/advanced`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Infobip send-sms error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "requestError" in result
              ? String((result as { requestError: { serviceException: { text: string } } }).requestError?.serviceException?.text || "Failed to send SMS")
              : "Failed to send SMS"
          );
        }

        console.log("SMS sent successfully via Infobip to", phone);
        break;
      }

      case "check-balance": {
        response = await fetch(`${INFOBIP_BASE_URL}/account/1/balance`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `App ${INFOBIP_API_KEY}`,
          },
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Infobip balance error:", result);
          throw new Error("Failed to check balance");
        }

        console.log("Balance checked:", result);
        break;
      }

      default:
        throw new Error("Invalid action");
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Infobip SMS error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
