import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strict whitelist of allowed public UI settings - cosmetic only, no secrets
const ALLOWED_PUBLIC_KEYS = [
  'login_title',
  'login_subtitle',
  'login_bg_color',
  'login_card_color',
  'login_header_gradient_start',
  'login_header_gradient_end',
  'login_button_text',
  'login_logo_url',
  'register_title',
  'register_subtitle',
  'register_button_text'
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch only the whitelisted global settings (company_id IS NULL)
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .is('company_id', null)
      .in('key', [...ALLOWED_PUBLIC_KEYS]);

    if (error) {
      console.error("Error fetching public settings:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to key-value object for easier consumption
    const settings: Record<string, string> = {};
    for (const item of data || []) {
      if (ALLOWED_PUBLIC_KEYS.includes(item.key as typeof ALLOWED_PUBLIC_KEYS[number])) {
        settings[item.key] = item.value || '';
      }
    }

    return new Response(
      JSON.stringify({ success: true, settings }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          // Cache for 5 minutes to reduce load
          "Cache-Control": "public, max-age=300"
        } 
      }
    );
  } catch (error) {
    console.error("Public auth settings error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
