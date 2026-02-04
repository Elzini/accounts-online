import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.2.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: 'setup' | 'verify' | 'disable' | 'check' | 'verify-login' | 'setup-sms' | 'verify-sms' | 'verify-login-sms';
  token?: string;
  phone?: string;
  pinId?: string;
}

// Store PIN IDs for SMS verification
const pinIdStore = new Map<string, string>();

// AES-256-GCM Encryption utilities
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get("TWO_FA_ENCRYPTION_KEY");
  if (!keyString) {
    throw new Error("Encryption key not configured");
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyString),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("2fa-salt-v1"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return "enc:" + btoa(String.fromCharCode(...combined));
}

async function decryptSecret(ciphertext: string): Promise<string> {
  if (!ciphertext.startsWith("enc:")) {
    return atob(ciphertext);
  }
  
  const key = await getEncryptionKey();
  const base64Data = ciphertext.slice(4);
  const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

async function encryptBackupCode(code: string): Promise<string> {
  return await encryptSecret(code);
}

async function decryptBackupCode(encrypted: string): Promise<string> {
  return await decryptSecret(encrypted);
}

// Format phone number to E.164
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

// Send OTP via Infobip
async function sendOtpViaInfobip(phone: string): Promise<{ success: boolean; pinId?: string; error?: string }> {
  const apiKey = Deno.env.get("INFOBIP_API_KEY");
  const baseUrl = Deno.env.get("INFOBIP_BASE_URL");
  
  if (!apiKey) {
    return { success: false, error: "INFOBIP_API_KEY not configured" };
  }
  if (!baseUrl) {
    return { success: false, error: "INFOBIP_BASE_URL not configured" };
  }

  try {
    const body = {
      applicationId: "default",
      messageId: "default",
      from: "InfoSMS",
      to: phone,
      messageText: "رمز التحقق الخاص بك هو: {{pin}}",
      pinType: "NUMERIC",
      pinLength: 6,
    };

    const response = await fetch(`${baseUrl}/2fa/2/pin`, {
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
      console.error("Infobip send-otp error:", result);
      const errorText = result?.requestError?.serviceException?.text || `HTTP ${response.status}`;
      return { success: false, error: errorText };
    }

    return { success: true, pinId: result.pinId };
  } catch (error) {
    console.error("Failed to send OTP via Infobip:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Verify OTP via Infobip
async function verifyOtpViaInfobip(pinId: string, otp: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  const apiKey = Deno.env.get("INFOBIP_API_KEY");
  const baseUrl = Deno.env.get("INFOBIP_BASE_URL");
  
  if (!apiKey) {
    return { success: false, error: "INFOBIP_API_KEY not configured" };
  }
  if (!baseUrl) {
    return { success: false, error: "INFOBIP_BASE_URL not configured" };
  }

  try {
    const response = await fetch(`${baseUrl}/2fa/2/pin/${pinId}/verify`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `App ${apiKey}`,
      },
      body: JSON.stringify({ pin: otp }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Infobip verify-otp error:", result);
      const errorText = result?.requestError?.serviceException?.text || `HTTP ${response.status}`;
      return { success: false, error: errorText };
    }

    return { success: true, verified: result.verified === true };
  } catch (error) {
    console.error("Failed to verify OTP via Infobip:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("لم يتم توفير رمز المصادقة");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("المستخدم غير مصادق");
    }

    const { action, token, phone, pinId: providedPinId }: RequestBody = await req.json();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      // ===================== TOTP App-based 2FA =====================
      case 'setup': {
        const totp = new OTPAuth.TOTP({
          issuer: "Elzini System",
          label: user.email || user.id,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: new OTPAuth.Secret({ size: 20 }),
        });

        const secret = totp.secret.base32;
        const otpauthUrl = totp.toString();

        const backupCodes: string[] = [];
        for (let i = 0; i < 10; i++) {
          const code = Array.from({ length: 8 }, () => 
            Math.random().toString(36).charAt(2)
          ).join('').toUpperCase();
          backupCodes.push(code);
        }

        const encryptedSecret = await encryptSecret(secret);
        const encryptedBackupCodes = await Promise.all(
          backupCodes.map(code => encryptBackupCode(code))
        );

        await adminClient
          .from('user_2fa')
          .upsert({
            user_id: user.id,
            secret_encrypted: encryptedSecret,
            is_enabled: false,
            backup_codes: encryptedBackupCodes,
            two_fa_type: 'totp',
          }, { onConflict: 'user_id' });

        return new Response(
          JSON.stringify({
            success: true,
            secret,
            otpauthUrl,
            backupCodes,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify': {
        if (!token) {
          throw new Error("الرمز مطلوب");
        }

        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          throw new Error("لم يتم إعداد المصادقة الثنائية");
        }

        const secret = await decryptSecret(twoFaData.secret_encrypted);

        const totp = new OTPAuth.TOTP({
          issuer: "Elzini System",
          label: user.email || user.id,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });

        const delta = totp.validate({ token, window: 1 });
        const isValid = delta !== null;

        if (isValid) {
          await adminClient
            .from('user_2fa')
            .update({
              is_enabled: true,
              verified_at: new Date().toISOString(),
              two_fa_type: 'totp',
            })
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ success: true, isValid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify-login': {
        if (!token) {
          throw new Error("الرمز مطلوب");
        }

        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted, backup_codes, two_fa_type')
          .eq('user_id', user.id)
          .eq('is_enabled', true)
          .single();

        if (!twoFaData) {
          throw new Error("المصادقة الثنائية غير مفعلة");
        }

        const secret = await decryptSecret(twoFaData.secret_encrypted);
        const totp = new OTPAuth.TOTP({
          issuer: "Elzini System",
          label: user.email || user.id,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });

        let isValid = totp.validate({ token, window: 1 }) !== null;

        // Try backup codes if TOTP fails
        if (!isValid && twoFaData.backup_codes) {
          const tokenUpper = token.toUpperCase();
          
          for (let i = 0; i < twoFaData.backup_codes.length; i++) {
            const decryptedCode = await decryptBackupCode(twoFaData.backup_codes[i]);
            if (decryptedCode === tokenUpper) {
              isValid = true;
              const newBackupCodes = [...twoFaData.backup_codes];
              newBackupCodes.splice(i, 1);
              
              await adminClient
                .from('user_2fa')
                .update({ backup_codes: newBackupCodes })
                .eq('user_id', user.id);
              break;
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, isValid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'disable': {
        if (!token) {
          throw new Error("الرمز مطلوب للتعطيل");
        }

        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted, two_fa_type, phone_number, sms_pin_id')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          throw new Error("المصادقة الثنائية غير مفعلة");
        }

        let isValid = false;

        if (twoFaData.two_fa_type === 'sms' && twoFaData.sms_pin_id) {
          // Verify via Infobip SMS OTP
          const verifyResult = await verifyOtpViaInfobip(twoFaData.sms_pin_id, token);
          isValid = verifyResult.verified === true;
        } else {
          // Verify via TOTP
          const secret = await decryptSecret(twoFaData.secret_encrypted);
          const totp = new OTPAuth.TOTP({
            issuer: "Elzini System",
            label: user.email || user.id,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret),
          });
          isValid = totp.validate({ token, window: 1 }) !== null;
        }

        if (!isValid) {
          throw new Error("الرمز غير صحيح");
        }

        await adminClient
          .from('user_2fa')
          .delete()
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'check': {
        const { data: twoFaData } = await supabase
          .from('user_2fa')
          .select('is_enabled, two_fa_type, phone_number')
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            isEnabled: twoFaData?.is_enabled || false,
            twoFaType: twoFaData?.two_fa_type || null,
            phoneNumber: twoFaData?.phone_number ? twoFaData.phone_number.replace(/(\+\d{3})\d+(\d{4})/, '$1****$2') : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ===================== SMS-based 2FA (Infobip) =====================
      case 'setup-sms': {
        if (!phone) {
          throw new Error("رقم الهاتف مطلوب");
        }

        const formattedPhone = formatPhoneNumber(phone);

        // Send OTP via Infobip
        const sendResult = await sendOtpViaInfobip(formattedPhone);
        if (!sendResult.success) {
          throw new Error(sendResult.error || "فشل في إرسال رمز التحقق");
        }

        // Store phone number and pinId temporarily (not enabled yet)
        await adminClient
          .from('user_2fa')
          .upsert({
            user_id: user.id,
            phone_number: formattedPhone,
            sms_pin_id: sendResult.pinId,
            is_enabled: false,
            two_fa_type: 'sms',
          }, { onConflict: 'user_id' });

        return new Response(
          JSON.stringify({
            success: true,
            message: "تم إرسال رمز التحقق إلى رقم الهاتف",
            maskedPhone: formattedPhone.replace(/(\+\d{3})\d+(\d{4})/, '$1****$2'),
            pinId: sendResult.pinId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify-sms': {
        if (!token) {
          throw new Error("رمز التحقق مطلوب");
        }

        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('phone_number, sms_pin_id')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData?.phone_number || !twoFaData?.sms_pin_id) {
          throw new Error("لم يتم إعداد رقم الهاتف");
        }

        // Verify OTP via Infobip
        const verifyResult = await verifyOtpViaInfobip(twoFaData.sms_pin_id, token);
        
        if (!verifyResult.success) {
          throw new Error(verifyResult.error || "فشل في التحقق من الرمز");
        }

        const isValid = verifyResult.verified === true;

        if (isValid) {
          await adminClient
            .from('user_2fa')
            .update({
              is_enabled: true,
              verified_at: new Date().toISOString(),
              two_fa_type: 'sms',
              sms_pin_id: null, // Clear after verification
            })
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ success: true, isValid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify-login-sms': {
        if (!token) {
          throw new Error("رمز التحقق مطلوب");
        }

        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('phone_number, sms_pin_id')
          .eq('user_id', user.id)
          .eq('is_enabled', true)
          .eq('two_fa_type', 'sms')
          .single();

        if (!twoFaData?.phone_number) {
          throw new Error("المصادقة الثنائية عبر SMS غير مفعلة");
        }

        // First, send a new OTP if no pinId exists
        let pinId = twoFaData.sms_pin_id || providedPinId;
        
        if (!pinId) {
          // Send new OTP for login verification
          const sendResult = await sendOtpViaInfobip(twoFaData.phone_number);
          if (!sendResult.success) {
            throw new Error(sendResult.error || "فشل في إرسال رمز التحقق");
          }
          pinId = sendResult.pinId;
          
          // Store the new pinId
          await adminClient
            .from('user_2fa')
            .update({ sms_pin_id: pinId })
            .eq('user_id', user.id);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              needsOtp: true, 
              message: "تم إرسال رمز التحقق",
              pinId,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify OTP via Infobip
        const verifyResult = await verifyOtpViaInfobip(pinId, token);
        
        if (!verifyResult.success) {
          throw new Error(verifyResult.error || "فشل في التحقق من الرمز");
        }

        // Clear pinId after successful verification
        await adminClient
          .from('user_2fa')
          .update({ sms_pin_id: null })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, isValid: verifyResult.verified === true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("إجراء غير صالح");
    }
  } catch (error: unknown) {
    console.error("2FA Error:", error);
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
