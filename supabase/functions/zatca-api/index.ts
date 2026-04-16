import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractOfficialQrFromZatcaResponse } from "./extract-official-qr.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ZATCA API endpoints
const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
const ZATCA_SIMULATION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const ZATCA_PRODUCTION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core';

interface ZatcaRequest {
  action: 'compliance' | 'reporting' | 'clearance' | 'get-csid' | 'renew-csid';
  environment: 'sandbox' | 'simulation' | 'production';
  csr?: string;
  otp?: string;
  invoiceHash?: string;
  uuid?: string;
  invoice?: string; // Base64 encoded XML
  csid?: string;
  csidSecret?: string;
  // Auto-update sale record
  saleId?: string;
  companyId?: string;
}

function getBaseUrl(environment: string): string {
  switch (environment) {
    case 'sandbox': return ZATCA_SANDBOX_URL;
    case 'simulation': return ZATCA_SIMULATION_URL;
    case 'production': return ZATCA_PRODUCTION_URL;
    default: throw new Error(`Unknown environment: ${environment}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT Authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'غير مصرح - يرجى تسجيل الدخول' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'جلسة غير صالحة' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: ZatcaRequest = await req.json();
    const { action, environment } = body;
    const baseUrl = getBaseUrl(environment);

    let result: any;

    switch (action) {
      case 'get-csid': {
        if (!body.csr || !body.otp) throw new Error('CSR و OTP مطلوبان');

        console.log('ZATCA get-csid:', { env: environment, csrLen: body.csr.length });

        const response = await fetch(`${baseUrl}/compliance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept-Version': 'V2', 'OTP': body.otp },
          body: JSON.stringify({ csr: body.csr }),
        });

        const responseText = await response.text();
        console.log('ZATCA response:', response.status);

        if (!response.ok) throw new Error(`خطأ ZATCA [${response.status}]: ${responseText}`);
        result = JSON.parse(responseText);

        // Auto-save CSID to zatca_config if companyId provided
        if (body.companyId && result.binarySecurityToken && result.secret) {
          const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
          await serviceClient.from('zatca_config').upsert({
            company_id: body.companyId,
            compliance_csid: result.binarySecurityToken,
            compliance_secret: result.secret,
            compliance_request_id: result.requestID,
            environment,
            onboarding_status: 'compliance_csid_obtained',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'company_id' });
        }
        break;
      }

      case 'compliance': {
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID والسر والفاتورة والهاش و UUID مطلوبون');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);
        const response = await fetch(`${baseUrl}/compliance/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Accept-Version': 'V2',
            'Accept-Language': 'ar', 'Authorization': `Basic ${authToken}`,
          },
          body: JSON.stringify({ invoiceHash: body.invoiceHash, uuid: body.uuid, invoice: body.invoice }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطأ فحص الامتثال [${response.status}]: ${errorText}`);
        }
        result = await response.json();
        break;
      }

      case 'reporting': {
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID والسر والفاتورة والهاش و UUID مطلوبون');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);
        const response = await fetch(`${baseUrl}/invoices/reporting/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Accept-Version': 'V2',
            'Accept-Language': 'ar', 'Authorization': `Basic ${authToken}`,
            'Clearance-Status': '0',
          },
          body: JSON.stringify({ invoiceHash: body.invoiceHash, uuid: body.uuid, invoice: body.invoice }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطأ الإبلاغ [${response.status}]: ${errorText}`);
        }
        result = await response.json();

        // Auto-update invoice/sale record with ZATCA status and official QR
        if (body.saleId && result.reportingStatus === 'REPORTED') {
          const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
          const officialQr = extractOfficialQrFromZatcaResponse(result);

          const invoiceUpdate = await serviceClient.from('invoices').update({
            zatca_status: 'reported',
            zatca_uuid: body.uuid,
            zatca_invoice_hash: body.invoiceHash,
            zatca_qr: officialQr,
          }).eq('id', body.saleId);

          if (invoiceUpdate.error) {
            await serviceClient.from('sales').update({
              zatca_status: 'reported',
              zatca_uuid: body.uuid,
              zatca_invoice_hash: body.invoiceHash,
              zatca_qr: officialQr,
            }).eq('id', body.saleId);
          }
        }
        break;
      }

      case 'clearance': {
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID والسر والفاتورة والهاش و UUID مطلوبون');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);
        const response = await fetch(`${baseUrl}/invoices/clearance/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Accept-Version': 'V2',
            'Accept-Language': 'ar', 'Authorization': `Basic ${authToken}`,
            'Clearance-Status': '1',
          },
          body: JSON.stringify({ invoiceHash: body.invoiceHash, uuid: body.uuid, invoice: body.invoice }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطأ الاعتماد [${response.status}]: ${errorText}`);
        }
        result = await response.json();

        // Auto-update invoice/sale record with cleared status and official QR
        if (body.saleId && result.clearanceStatus === 'CLEARED') {
          const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
          const officialQr = extractOfficialQrFromZatcaResponse(result);

          const invoiceUpdate = await serviceClient.from('invoices').update({
            zatca_status: 'cleared',
            zatca_uuid: body.uuid,
            zatca_invoice_hash: body.invoiceHash,
            zatca_qr: officialQr,
          }).eq('id', body.saleId);

          if (invoiceUpdate.error) {
            await serviceClient.from('sales').update({
              zatca_status: 'cleared',
              zatca_uuid: body.uuid,
              zatca_invoice_hash: body.invoiceHash,
              zatca_qr: officialQr,
            }).eq('id', body.saleId);
          }
        }
        break;
      }

      case 'renew-csid': {
        if (!body.csid || !body.csidSecret || !body.csr) {
          throw new Error('CSID الامتثال والسر و CSR مطلوبون');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);
        const response = await fetch(`${baseUrl}/production/csids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Accept-Version': 'V2',
            'Authorization': `Basic ${authToken}`,
          },
          body: JSON.stringify({ csr: body.csr }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`خطأ CSID الإنتاج [${response.status}]: ${errorText}`);
        }
        result = await response.json();

        // Auto-save production CSID
        if (body.companyId && result.binarySecurityToken && result.secret) {
          const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
          await serviceClient.from('zatca_config').upsert({
            company_id: body.companyId,
            production_csid: result.binarySecurityToken,
            production_secret: result.secret,
            production_request_id: result.requestID,
            onboarding_status: 'production_ready',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'company_id' });
        }
        break;
      }

      default:
        throw new Error(`إجراء غير معروف: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true, data: result, environment, action,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('ZATCA API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';

    return new Response(JSON.stringify({
      success: false, error: errorMessage, timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
