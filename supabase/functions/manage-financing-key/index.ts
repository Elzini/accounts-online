import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple AES-256-GCM encryption using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const masterKey = Deno.env.get("FINANCING_MASTER_KEY");
  if (!masterKey) {
    throw new Error("Master encryption key not configured");
  }
  
  // Derive a proper 256-bit key from the master key using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("financing-api-keys-salt-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptApiKey(plainText: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  
  // Combine IV + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return base64Encode(combined.buffer);
}

async function decryptApiKey(encryptedText: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = base64Decode(encryptedText);
  
  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "•".repeat(apiKey.length);
  }
  const visiblePrefix = apiKey.slice(0, 4);
  const visibleSuffix = apiKey.slice(-4);
  const maskedLength = apiKey.length - 8;
  return `${visiblePrefix}${"•".repeat(Math.min(maskedLength, 20))}${visibleSuffix}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to check permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company and verify admin permission
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "No company associated with user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminCheck } = await supabase
      .from("user_roles")
      .select("permission")
      .eq("user_id", user.id)
      .eq("permission", "admin")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Admin permission required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, financingCompanyId, apiKey } = body;

    switch (action) {
      case "encrypt": {
        // Encrypt and store a new API key
        if (!financingCompanyId || !apiKey) {
          return new Response(
            JSON.stringify({ error: "financingCompanyId and apiKey required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the financing company belongs to user's company
        const { data: fc, error: fcError } = await supabase
          .from("financing_companies")
          .select("id, company_id")
          .eq("id", financingCompanyId)
          .eq("company_id", profile.company_id)
          .single();

        if (fcError || !fc) {
          return new Response(
            JSON.stringify({ error: "Financing company not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const encryptedKey = await encryptApiKey(apiKey);
        
        const { error: updateError } = await supabase
          .from("financing_companies")
          .update({ 
            api_key_encrypted: encryptedKey,
            updated_at: new Date().toISOString()
          })
          .eq("id", financingCompanyId);

        if (updateError) {
          console.error("Failed to store encrypted key:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to store API key" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log this sensitive operation
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          company_id: profile.company_id,
          entity_type: "financing_company",
          entity_id: financingCompanyId,
          action: "api_key_updated",
          new_data: { masked_key: maskApiKey(apiKey) },
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            masked_key: maskApiKey(apiKey) 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_masked": {
        // Return only masked version of the key (for display)
        if (!financingCompanyId) {
          return new Response(
            JSON.stringify({ error: "financingCompanyId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: fc, error: fcError } = await supabase
          .from("financing_companies")
          .select("id, api_key_encrypted")
          .eq("id", financingCompanyId)
          .eq("company_id", profile.company_id)
          .single();

        if (fcError || !fc) {
          return new Response(
            JSON.stringify({ error: "Financing company not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!fc.api_key_encrypted) {
          return new Response(
            JSON.stringify({ success: true, masked_key: null, has_key: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          const decryptedKey = await decryptApiKey(fc.api_key_encrypted);
          return new Response(
            JSON.stringify({ 
              success: true, 
              masked_key: maskApiKey(decryptedKey),
              has_key: true 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (decryptError) {
          console.error("Failed to decrypt key:", decryptError);
          return new Response(
            JSON.stringify({ 
              success: true, 
              masked_key: "[DECRYPTION_ERROR]",
              has_key: true 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "use_for_api_call": {
        // This action would be used by other edge functions that need to make
        // authenticated calls to financing partner APIs. The decrypted key
        // NEVER leaves the server - it's used here to make the external call.
        // For now, we just return success to indicate the pattern.
        
        if (!financingCompanyId) {
          return new Response(
            JSON.stringify({ error: "financingCompanyId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: fc } = await supabase
          .from("financing_companies")
          .select("id, api_key_encrypted, api_endpoint")
          .eq("id", financingCompanyId)
          .eq("company_id", profile.company_id)
          .single();

        if (!fc?.api_key_encrypted || !fc?.api_endpoint) {
          return new Response(
            JSON.stringify({ error: "API key or endpoint not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decrypt the key (stays on server)
        const decryptedKey = await decryptApiKey(fc.api_key_encrypted);
        
        // Here you would make the actual API call to the financing partner
        // using the decrypted key. Example:
        // const response = await fetch(fc.api_endpoint, {
        //   headers: { "Authorization": `Bearer ${decryptedKey}` },
        //   ...
        // });

        // Log the API access
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          company_id: profile.company_id,
          entity_type: "financing_company",
          entity_id: financingCompanyId,
          action: "api_key_used",
          new_data: { endpoint: fc.api_endpoint },
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "API key ready for use (server-side only)" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        // Remove the API key
        if (!financingCompanyId) {
          return new Response(
            JSON.stringify({ error: "financingCompanyId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("financing_companies")
          .update({ 
            api_key_encrypted: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", financingCompanyId)
          .eq("company_id", profile.company_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to delete API key" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log the deletion
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          company_id: profile.company_id,
          entity_type: "financing_company",
          entity_id: financingCompanyId,
          action: "api_key_deleted",
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: encrypt, get_masked, use_for_api_call, delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in manage-financing-key:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
