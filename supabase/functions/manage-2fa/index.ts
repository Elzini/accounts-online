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

        // Store the secret (encrypted in a real scenario, using base64 for demo)
        const encryptedSecret = btoa(secret);

        await adminClient
          .from('user_2fa')
          .upsert({
            user_id: user.id,
            secret_encrypted: encryptedSecret,
            is_enabled: false,
            backup_codes: backupCodes.map(c => btoa(c)),
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

        const secret = atob(twoFaData.secret_encrypted);

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

        // First try TOTP
        const secret = atob(twoFaData.secret_encrypted);
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
          const backupIndex = twoFaData.backup_codes.findIndex(
            (code: string) => atob(code) === tokenUpper
          );

          if (backupIndex !== -1) {
            isValid = true;
            // Remove used backup code
            const newBackupCodes = [...twoFaData.backup_codes];
            newBackupCodes.splice(backupIndex, 1);
            
            await adminClient
              .from('user_2fa')
              .update({ backup_codes: newBackupCodes })
              .eq('user_id', user.id);
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

        const secret = atob(twoFaData.secret_encrypted);
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
