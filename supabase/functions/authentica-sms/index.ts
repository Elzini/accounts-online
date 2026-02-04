import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://api.authentica.sa";

interface SendOtpRequest {
  action: "send-otp";
  method: "sms" | "whatsapp" | "email";
  phone?: string;
  email?: string;
}

interface VerifyOtpRequest {
  action: "verify-otp";
  phone?: string;
  email?: string;
  otp: string;
}

interface SendSmsRequest {
  action: "send-sms";
  phone: string;
  message: string;
  senderName?: string;
}

interface CheckBalanceRequest {
  action: "check-balance";
}

type RequestBody = SendOtpRequest | VerifyOtpRequest | SendSmsRequest | CheckBalanceRequest;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AUTHENTICA_API_KEY = Deno.env.get("AUTHENTICA_API_KEY");
    if (!AUTHENTICA_API_KEY) {
      throw new Error("AUTHENTICA_API_KEY not configured");
    }

    const requestBody: RequestBody = await req.json();
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Authorization": AUTHENTICA_API_KEY,
    };

    let response: Response;
    let result: unknown;

    switch (requestBody.action) {
      case "send-otp": {
        const { method, phone, email } = requestBody;
        const body = method === "email" 
          ? { method, email } 
          : { method, phone };

        response = await fetch(`${BASE_URL}/api/v2/send-otp`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Authentica send-otp error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "message" in result
              ? String((result as { message: string }).message)
              : "Failed to send OTP"
          );
        }

        console.log("OTP sent successfully via", method);
        break;
      }

      case "verify-otp": {
        const { phone, email, otp } = requestBody;
        const body = email 
          ? { email, otp } 
          : { phone, otp };

        response = await fetch(`${BASE_URL}/api/v2/verify-otp`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Authentica verify-otp error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "message" in result
              ? String((result as { message: string }).message)
              : "Failed to verify OTP"
          );
        }

        console.log("OTP verification result:", result);
        break;
      }

      case "send-sms": {
        const { phone, message, senderName } = requestBody;
        const body: Record<string, string> = { phone, message };
        if (senderName) {
          body.sender_name = senderName;
        }

        response = await fetch(`${BASE_URL}/api/v2/send-sms`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Authentica send-sms error:", result);
          throw new Error(
            typeof result === "object" && result !== null && "message" in result
              ? String((result as { message: string }).message)
              : "Failed to send SMS"
          );
        }

        console.log("SMS sent successfully to", phone);
        break;
      }

      case "check-balance": {
        response = await fetch(`${BASE_URL}/api/v2/balance`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-Authorization": AUTHENTICA_API_KEY,
          },
        });
        result = await response.json();

        if (!response.ok) {
          console.error("Authentica balance error:", result);
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
    console.error("Authentica SMS error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
