import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.2.2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: 'setup' | 'verify' | 'disable' | 'check' | 'verify-login';
  token?: string;
}

// AES-256-GCM Encryption utilities
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get("TWO_FA_ENCRYPTION_KEY");
  if (!keyString) {
    throw new Error("Encryption key not configured");
  }
  
  // Derive a proper 256-bit key from the secret using PBKDF2
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
      salt: new TextEncoder().encode("2fa-salt-v1"), // Static salt for deterministic key derivation
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
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Prefix with "enc:" to identify encrypted values
  return "enc:" + btoa(String.fromCharCode(...combined));
}

async function decryptSecret(ciphertext: string): Promise<string> {
  // Handle legacy base64-encoded secrets (not encrypted)
  if (!ciphertext.startsWith("enc:")) {
    // Legacy format - just base64 decode
    return atob(ciphertext);
  }
  
  // New encrypted format
  const key = await getEncryptionKey();
  const base64Data = ciphertext.slice(4); // Remove "enc:" prefix
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

    const { action, token }: RequestBody = await req.json();

    // Admin client for sensitive operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'setup': {
        // Generate new secret
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

        // Generate backup codes
        const backupCodes: string[] = [];
        for (let i = 0; i < 10; i++) {
          const code = Array.from({ length: 8 }, () => 
            Math.random().toString(36).charAt(2)
          ).join('').toUpperCase();
          backupCodes.push(code);
        }

        // Encrypt the secret using AES-256-GCM
        const encryptedSecret = await encryptSecret(secret);
        
        // Encrypt backup codes
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

        // Get the stored secret
        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          throw new Error("لم يتم إعداد المصادقة الثنائية");
        }

        // Decrypt the secret (handles both legacy and new format)
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
          // Enable 2FA
          await adminClient
            .from('user_2fa')
            .update({
              is_enabled: true,
              verified_at: new Date().toISOString(),
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

        // Get the stored secret
        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted, backup_codes')
          .eq('user_id', user.id)
          .eq('is_enabled', true)
          .single();

        if (!twoFaData) {
          throw new Error("المصادقة الثنائية غير مفعلة");
        }

        // Decrypt the secret (handles both legacy and new format)
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

        // If TOTP fails, try backup codes
        if (!isValid && twoFaData.backup_codes) {
          const tokenUpper = token.toUpperCase();
          
          // Decrypt and check each backup code
          for (let i = 0; i < twoFaData.backup_codes.length; i++) {
            const decryptedCode = await decryptBackupCode(twoFaData.backup_codes[i]);
            if (decryptedCode === tokenUpper) {
              isValid = true;
              // Remove used backup code
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

        // Verify token before disabling
        const { data: twoFaData } = await adminClient
          .from('user_2fa')
          .select('secret_encrypted')
          .eq('user_id', user.id)
          .single();

        if (!twoFaData) {
          throw new Error("المصادقة الثنائية غير مفعلة");
        }

        // Decrypt the secret (handles both legacy and new format)
        const secret = await decryptSecret(twoFaData.secret_encrypted);
        const totp = new OTPAuth.TOTP({
          issuer: "Elzini System",
          label: user.email || user.id,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });

        const isValid = totp.validate({ token, window: 1 }) !== null;

        if (!isValid) {
          throw new Error("الرمز غير صحيح");
        }

        // Delete 2FA record
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
          .select('is_enabled')
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            isEnabled: twoFaData?.is_enabled || false,
          }),
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
