import { supabase } from '@/integrations/supabase/client';
import { BatchParsedResult } from '../PurchaseInvoiceAIImport';
import { getNextInvoiceNumber } from '@/utils/invoiceNumberGenerator';
import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';

interface BatchImportParams {
  results: BatchParsedResult[];
  costCenterId?: string | null;
  companyId: string;
  suppliers: any[];
  taxSettings: any;
  selectedFiscalYear: any;
  invoiceProjectId: string | null;
  queryClient: QueryClient;
}

export async function handleBatchImport({
  results,
  companyId,
  suppliers,
  taxSettings,
  selectedFiscalYear,
  invoiceProjectId,
  queryClient,
}: BatchImportParams) {
  if (!companyId) {
    toast.error('لم يتم تحديد الشركة');
    return;
  }

  const expectedCount = results.length;
  let successCount = 0;
  let failCount = 0;
  const importedInvoiceIds: string[] = [];

  // Auto-detect project and payment account
  let autoProjectId: string | null = null;
  let autoPaymentAccountId: string | null = null;

  try {
    const { data: projectRows } = await supabase
      .from('re_projects')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', '%جوهر%')
      .limit(1);
    if (projectRows && projectRows.length > 0) {
      autoProjectId = projectRows[0].id;
    }
  } catch {}

  try {
    const { data: accountRows } = await supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .or('name.ilike.%جاري الشريك ماطر%,name.ilike.%جاري الشريك%')
      .order('code', { ascending: true })
      .limit(1);
    if (accountRows && accountRows.length > 0) {
      autoPaymentAccountId = accountRows[0].id;
    }
  } catch {}

  toast.info(`بدء استيراد ${expectedCount} فاتورة...`);

  for (const result of results) {
    try {
      const data = result.data;
      
      // Find or create supplier
      let supplierId = '';
      const existingSupplier = suppliers.find(s => 
        s.name === data.supplier_name || 
        (data.supplier_tax_number && (s as any).id_number === data.supplier_tax_number)
      );

      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else {
        const { data: newSupplier, error } = await supabase
          .from('suppliers')
          .insert({
            name: data.supplier_name,
            id_number: data.supplier_tax_number || null,
            phone: data.supplier_phone ? data.supplier_phone.split(/[-–،,\s]+/).filter((p: string) => p.match(/^\d{7,15}$/))[0] || data.supplier_phone.substring(0, 20) : null,
            address: data.supplier_address || null,
            company_id: companyId,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating supplier:', error);
          failCount++;
          continue;
        }
        supplierId = newSupplier.id;
      }

      // Calculate amounts
      const vatRate = taxSettings?.tax_rate || 15;
      let subtotal = data.subtotal || 0;
      let vatAmount = data.vat_amount || 0;
      let total = data.total_amount || 0;
      const discountAmount = data.discount || 0;
      const priceIncludesTax = data.price_includes_tax ?? false;

      if (!subtotal && total) {
        if (priceIncludesTax) {
          subtotal = total / (1 + vatRate / 100);
          vatAmount = total - subtotal;
        } else {
          subtotal = total - vatAmount;
          if (vatAmount === 0) {
            vatAmount = subtotal * (vatRate / 100);
            total = subtotal + vatAmount;
          }
        }
      }

      // Create invoice
      const supplierInvNumber = data.invoice_number || '';
      const invoiceNumber = await getNextInvoiceNumber(companyId, 'purchase');
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          invoice_number: invoiceNumber,
          supplier_invoice_number: supplierInvNumber || null,
          invoice_type: 'purchase',
          supplier_id: supplierId,
          customer_name: data.supplier_name,
          invoice_date: data.invoice_date,
          due_date: data.due_date || data.invoice_date,
          subtotal: subtotal - discountAmount,
          taxable_amount: subtotal - discountAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total: total,
          discount_amount: discountAmount,
          amount_paid: total,
          payment_status: 'paid',
          payment_account_id: autoPaymentAccountId || null,
          status: 'draft',
          fiscal_year_id: selectedFiscalYear?.id || null,
          notes: data.notes || null,
          project_id: autoProjectId || invoiceProjectId || null,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        failCount++;
        continue;
      }

      importedInvoiceIds.push(invoice.id);

      // Upload PDF file to storage if available
      if (result.fileObject) {
        try {
          const filePath = `${companyId}/${invoice.id}/${result.fileObject.name}`;
          const { error: uploadError } = await supabase.storage
            .from('invoice-files')
            .upload(filePath, result.fileObject, { upsert: true });
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('invoice-files')
              .getPublicUrl(filePath);
            
            await supabase.from('invoices')
              .update({ file_url: urlData.publicUrl })
              .eq('id', invoice.id);
          }
        } catch (fileErr) {
          console.error('File upload error:', fileErr);
        }
      }

      // Create invoice items
      if (data.items && data.items.length > 0) {
        const invoiceItems = data.items.map(item => ({
          invoice_id: invoice.id,
          item_description: item.description,
          item_code: '',
          quantity: item.quantity,
          unit: 'قطعة',
          unit_price: item.unit_price,
          taxable_amount: item.total,
          vat_rate: vatRate,
          vat_amount: item.total * (vatRate / 100),
          total: item.total * (1 + vatRate / 100),
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
        }
      }

      successCount++;
    } catch (error) {
      console.error(`Error importing invoice ${result.index}:`, error);
      failCount++;
    }
  }

  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
  queryClient.invalidateQueries({ queryKey: ['purchase-invoices-nav', companyId] });
  queryClient.invalidateQueries({ queryKey: ['invoices'] });
  queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
  queryClient.invalidateQueries({ queryKey: ['stats'] });

  // Post-import verification
  if (successCount > 0) {
    toast.success(`تم استيراد ${successCount} من ${expectedCount} فاتورة`);

    if (successCount !== expectedCount) {
      toast.warning(`تحذير: تم استيراد ${successCount} فقط من أصل ${expectedCount} فاتورة مطلوبة`);
    }

    try {
      const { data: verifyInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, supplier_invoice_number, customer_name, invoice_date, subtotal, vat_amount, total, payment_status, project_id, payment_account_id')
        .in('id', importedInvoiceIds);

      if (verifyInvoices) {
        const mismatches: string[] = [];
        const toHalalah = (v: number) => Math.round(v * 100);

        for (const result of results) {
          if (!result.success) continue;
          const parsed = result.data;
          const matched = verifyInvoices.find(inv => inv.supplier_invoice_number === parsed.invoice_number);

          if (!matched) {
            mismatches.push(`❌ فاتورة ${parsed.invoice_number} - لم يتم العثور عليها في النظام`);
            continue;
          }

          const expectedTotal = toHalalah(parsed.total_amount);
          const actualTotal = toHalalah(matched.total || 0);
          if (expectedTotal !== actualTotal) {
            mismatches.push(`⚠️ فاتورة ${parsed.invoice_number}: الإجمالي المتوقع ${parsed.total_amount} ≠ المسجل ${matched.total}`);
          }

          if (parsed.vat_amount != null) {
            const expectedVat = toHalalah(parsed.vat_amount);
            const actualVat = toHalalah(matched.vat_amount || 0);
            if (expectedVat !== actualVat) {
              mismatches.push(`⚠️ فاتورة ${parsed.invoice_number}: الضريبة المتوقعة ${parsed.vat_amount} ≠ المسجلة ${matched.vat_amount}`);
            }
          }

          if (matched.payment_status !== 'paid') {
            mismatches.push(`⚠️ فاتورة ${parsed.invoice_number}: الحالة ليست مدفوعة`);
          }

          if (autoProjectId && matched.project_id !== autoProjectId) {
            mismatches.push(`⚠️ فاتورة ${parsed.invoice_number}: لم يتم ربطها بالمشروع`);
          }

          const { count: itemsCount } = await supabase
            .from('invoice_items')
            .select('id', { count: 'exact', head: true })
            .eq('invoice_id', matched.id);

          if ((itemsCount || 0) !== (parsed.items?.length || 0)) {
            mismatches.push(`⚠️ فاتورة ${parsed.invoice_number}: عدد الأصناف المتوقع ${parsed.items?.length || 0} ≠ المسجل ${itemsCount || 0}`);
          }
        }

        if (mismatches.length === 0) {
          toast.success(`✅ التحقق تم بنجاح: جميع ${successCount} فاتورة مطابقة تماماً (الأصناف، المبالغ، الضريبة، المشروع، الحالة)`, { duration: 8000 });
        } else {
          toast.warning(
            `تم اكتشاف ${mismatches.length} تباين:\n${mismatches.slice(0, 5).join('\n')}`,
            { duration: 12000 }
          );
          console.warn('Import verification mismatches:', mismatches);
        }
      }
    } catch (verifyErr) {
      console.error('Post-import verification error:', verifyErr);
    }
  }

  if (failCount > 0 && successCount === 0) {
    toast.error(`فشل استيراد جميع الفواتير (${failCount})`);
  }
}
