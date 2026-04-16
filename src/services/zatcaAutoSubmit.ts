/**
 * Auto ZATCA Submission Service
 * Automatically submits invoices to ZATCA after approval
 * Works for all companies with active ZATCA config
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { fetchZatcaConfig, submitInvoiceToZatca } from '@/services/zatcaIntegration';
import { generateZatcaXML, generateInvoiceHashBase64, generateInvoiceUUID } from '@/lib/zatcaXML';
import { generateZatcaQRDataPhase2, formatDateTimeForZatca } from '@/lib/zatcaQR';
import type { ZatcaXMLInvoiceData, ZatcaXMLItem } from '@/lib/zatcaXML';

/**
 * Generate a local Phase 2 QR and mark the invoice as cleared
 * when no ZATCA API config exists for the company.
 */
async function localPhase2Fallback(
  invoiceId: string,
  companyId: string,
): Promise<{ submitted: boolean; error?: string }> {
  try {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .single();
    if (invError || !invoice) return { submitted: false, error: 'فاتورة غير موجودة' };

    const { data: taxSettings } = await supabase
      .from('tax_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    const sellerName = taxSettings?.company_name_ar || '';
    const vatNumber = taxSettings?.tax_number || '300000000000003';
    const invoiceDate = invoice.invoice_date || new Date().toISOString();
    const total = Number(invoice.total) || 0;
    const vatAmount = Number(invoice.vat_amount) || 0;
    const invoiceNumber = invoice.invoice_number || '';
    const uuid = invoice.zatca_uuid || generateInvoiceUUID();

    const qrData = await generateZatcaQRDataPhase2({
      sellerName,
      vatNumber,
      invoiceDateTime: invoiceDate,
      invoiceTotal: total,
      vatAmount,
      invoiceNumber,
    });

    await supabase.from('invoices').update({
      zatca_status: 'cleared',
      zatca_uuid: uuid,
      zatca_qr: qrData,
    }).eq('id', invoiceId);

    return { submitted: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[ZATCA Local Fallback] Error:', message);
    return { submitted: false, error: message };
  }
}

/**
 * Attempt to auto-submit an invoice to ZATCA after approval.
 * Silently skips if ZATCA is not configured for the company.
 * Logs errors but does NOT block the approval flow.
 */
export async function autoSubmitToZatca(
  invoiceId: string,
  companyId: string,
): Promise<{ submitted: boolean; error?: string }> {
  try {
    // Check if ZATCA config exists and is ready
    const config = await fetchZatcaConfig(companyId);
    if (!config) return localPhase2Fallback(invoiceId, companyId);

    const status = (config as any).onboarding_status || config.status;
    if (!status || status === 'not_configured' || status === 'pending') {
      return localPhase2Fallback(invoiceId, companyId);
    }

    const csid = config.production_csid || config.compliance_csid;
    if (!csid) return localPhase2Fallback(invoiceId, companyId);

    // Fetch the invoice with items and company info
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .single();
    if (invError || !invoice) return { submitted: false, error: 'فاتورة غير موجودة' };

    // Fetch tax settings for seller info
    const { data: taxSettings } = await supabase
      .from('tax_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    // Fetch customer info
    let buyerName = invoice.customer_name || '';
    let buyerTaxNumber = '';
    if (invoice.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name, registration_number, id_number, address, phone')
        .eq('id', invoice.customer_id)
        .maybeSingle();
      if (customer) {
        buyerName = customer.name || buyerName;
        buyerTaxNumber = customer.registration_number || '';
      }
    }

    // Determine invoice type for ZATCA
    const isSimplified = !buyerTaxNumber;
    const invoiceType = isSimplified ? 'simplified' : 'standard';

    // Generate UUID
    const uuid = invoice.zatca_uuid || generateInvoiceUUID();

    // Build XML data
    const items: ZatcaXMLItem[] = (invoice.invoice_items || []).map((item: any) => ({
      description: item.item_description || 'بند',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
      taxRate: Number(item.vat_rate) || 15,
      taxAmount: Number(item.vat_amount) || 0,
      total: Number(item.total) || 0,
    }));

    const xmlData: ZatcaXMLInvoiceData = {
      uuid,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date || new Date().toISOString(),
      invoiceType: 'sale',
      invoiceTypeCode: '388',
      sellerName: taxSettings?.company_name_ar || '',
      sellerTaxNumber: taxSettings?.tax_number || '',
      sellerAddress: taxSettings?.national_address || '',
      sellerCommercialRegister: taxSettings?.commercial_register || '',
      buyerName,
      buyerTaxNumber,
      items,
      subtotal: Number(invoice.subtotal) || 0,
      taxAmount: Number(invoice.vat_amount) || 0,
      total: Number(invoice.total) || 0,
      taxRate: Number(invoice.vat_rate) || 15,
    };

    // Generate XML and hash
    const xmlContent = generateZatcaXML(xmlData);
    const invoiceHash = await generateInvoiceHashBase64(xmlContent);
    const invoiceXmlBase64 = btoa(unescape(encodeURIComponent(xmlContent)));

    // Submit to ZATCA
    const result = await submitInvoiceToZatca({
      companyId,
      saleId: invoiceId,
      invoiceXmlBase64,
      invoiceHash,
      uuid,
      invoiceType,
    });

    return { submitted: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('[ZATCA Auto-Submit] Error:', message);
    return { submitted: false, error: message };
  }
}
