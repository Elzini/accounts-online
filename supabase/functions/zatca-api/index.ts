import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ZATCA API endpoints
const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
const ZATCA_SIMULATION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const ZATCA_PRODUCTION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core';

interface ZatcaRequest {
  action: 'compliance' | 'reporting' | 'clearance' | 'get-csid' | 'renew-csid';
  environment: 'sandbox' | 'simulation' | 'production';
  // For get-csid
  csr?: string;
  otp?: string;
  // For reporting/clearance
  invoiceHash?: string;
  uuid?: string;
  invoice?: string; // Base64 encoded XML
  // Auth
  csid?: string;
  csidSecret?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ZatcaRequest = await req.json();
    const { action, environment } = body;

    // Select base URL based on environment
    let baseUrl: string;
    switch (environment) {
      case 'sandbox':
        baseUrl = ZATCA_SANDBOX_URL;
        break;
      case 'simulation':
        baseUrl = ZATCA_SIMULATION_URL;
        break;
      case 'production':
        baseUrl = ZATCA_PRODUCTION_URL;
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

    let result: any;

    switch (action) {
      case 'get-csid': {
        // Step 1: Get Compliance CSID using CSR and OTP
        if (!body.csr || !body.otp) {
          throw new Error('CSR and OTP are required for get-csid action');
        }

        const complianceResponse = await fetch(`${baseUrl}/compliance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'OTP': body.otp,
          },
          body: JSON.stringify({
            csr: body.csr,
          }),
        });

        if (!complianceResponse.ok) {
          const errorText = await complianceResponse.text();
          throw new Error(`ZATCA Compliance API error [${complianceResponse.status}]: ${errorText}`);
        }

        result = await complianceResponse.json();
        break;
      }

      case 'compliance': {
        // Step 2: Submit invoice for compliance check
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID, secret, invoice, hash, and UUID are required for compliance check');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);

        const complianceCheckResponse = await fetch(`${baseUrl}/compliance/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Authorization': `Basic ${authToken}`,
          },
          body: JSON.stringify({
            invoiceHash: body.invoiceHash,
            uuid: body.uuid,
            invoice: body.invoice,
          }),
        });

        if (!complianceCheckResponse.ok) {
          const errorText = await complianceCheckResponse.text();
          throw new Error(`ZATCA Compliance Check error [${complianceCheckResponse.status}]: ${errorText}`);
        }

        result = await complianceCheckResponse.json();
        break;
      }

      case 'reporting': {
        // Step 3: Report simplified invoice (B2C)
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID, secret, invoice, hash, and UUID are required for reporting');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);

        const reportingResponse = await fetch(`${baseUrl}/invoices/reporting/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Authorization': `Basic ${authToken}`,
            'Clearance-Status': '0',
          },
          body: JSON.stringify({
            invoiceHash: body.invoiceHash,
            uuid: body.uuid,
            invoice: body.invoice,
          }),
        });

        if (!reportingResponse.ok) {
          const errorText = await reportingResponse.text();
          throw new Error(`ZATCA Reporting error [${reportingResponse.status}]: ${errorText}`);
        }

        result = await reportingResponse.json();
        break;
      }

      case 'clearance': {
        // Step 4: Clear standard invoice (B2B)
        if (!body.csid || !body.csidSecret || !body.invoice || !body.invoiceHash || !body.uuid) {
          throw new Error('CSID, secret, invoice, hash, and UUID are required for clearance');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);

        const clearanceResponse = await fetch(`${baseUrl}/invoices/clearance/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Authorization': `Basic ${authToken}`,
            'Clearance-Status': '1',
          },
          body: JSON.stringify({
            invoiceHash: body.invoiceHash,
            uuid: body.uuid,
            invoice: body.invoice,
          }),
        });

        if (!clearanceResponse.ok) {
          const errorText = await clearanceResponse.text();
          throw new Error(`ZATCA Clearance error [${clearanceResponse.status}]: ${errorText}`);
        }

        result = await clearanceResponse.json();
        break;
      }

      case 'renew-csid': {
        // Step 5: Get Production CSID
        if (!body.csid || !body.csidSecret || !body.csr) {
          throw new Error('Compliance CSID, secret, and CSR are required for production CSID');
        }

        const authToken = btoa(`${body.csid}:${body.csidSecret}`);

        const productionResponse = await fetch(`${baseUrl}/production/csids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Authorization': `Basic ${authToken}`,
          },
          body: JSON.stringify({
            csr: body.csr,
          }),
        });

        if (!productionResponse.ok) {
          const errorText = await productionResponse.text();
          throw new Error(`ZATCA Production CSID error [${productionResponse.status}]: ${errorText}`);
        }

        result = await productionResponse.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      environment,
      action,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('ZATCA API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
