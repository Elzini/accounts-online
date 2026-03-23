// محرك التسوية التلقائي
import { supabase } from '@/hooks/modules/useMiscServices';
import { AccountingCheckResult } from './types';

export async function checkCustomerReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('customer_id, total, amount_paid, status')
      .eq('company_id', companyId)
      .in('customer_id', customerIds)
      .in('status', ['issued', 'partially_paid']);

    const invoicesByCustomer = new Map<string, typeof allInvoices>();
    for (const inv of allInvoices || []) {
      const arr = invoicesByCustomer.get(inv.customer_id!) || [];
      arr.push(inv);
      invoicesByCustomer.set(inv.customer_id!, arr);
    }

    for (const customer of customers as any[]) {
      const invoices = invoicesByCustomer.get(customer.id) || [];
      const balance = invoices.reduce((s: number, i: any) =>
        s + ((Number(i.total) || 0) - (Number(i.amount_paid) || 0)), 0);
      if (Math.abs(balance) > 1) {
        discrepancies.push({
          customerName: customer.name,
          outstandingBalance: Math.round(balance * 100) / 100,
          invoicesCount: invoices.length,
        });
      }
    }
  }

  return {
    checkId: 'customer_reconciliation',
    checkName: 'تسوية أرصدة العملاء',
    category: 'reconciliation',
    status: 'pass',
    severity: 'low',
    summary: `${customers?.length || 0} عميل | ${discrepancies.length} بأرصدة مستحقة`,
    details: { totalCustomers: customers?.length || 0, withBalances: discrepancies },
    issuesCount: 0,
    recommendations: discrepancies.length > 3
      ? ['متابعة تحصيل الأرصدة المستحقة من العملاء']
      : [],
  };
}

export async function checkSupplierReconciliation(companyId: string): Promise<AccountingCheckResult> {
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('company_id', companyId)
    .limit(100);

  const discrepancies: any[] = [];

  if (suppliers && suppliers.length > 0) {
    const supplierIds = suppliers.map(s => s.id);
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('supplier_id, total, amount_paid, status')
      .eq('company_id', companyId)
      .in('supplier_id', supplierIds)
      .in('status', ['issued', 'partially_paid']);

    const invoicesBySupplier = new Map<string, typeof allInvoices>();
    for (const inv of allInvoices || []) {
      const arr = invoicesBySupplier.get(inv.supplier_id!) || [];
      arr.push(inv);
      invoicesBySupplier.set(inv.supplier_id!, arr);
    }

    for (const supplier of suppliers as any[]) {
      const invoices = invoicesBySupplier.get(supplier.id) || [];
      const balance = invoices.reduce((s: number, i: any) =>
        s + ((Number(i.total) || 0) - (Number(i.amount_paid) || 0)), 0);
      if (Math.abs(balance) > 1) {
        discrepancies.push({
          supplierName: supplier.name,
          outstandingBalance: Math.round(balance * 100) / 100,
          invoicesCount: invoices.length,
        });
      }
    }
  }

  return {
    checkId: 'supplier_reconciliation',
    checkName: 'تسوية أرصدة الموردين',
    category: 'reconciliation',
    status: 'pass',
    severity: 'low',
    summary: `${suppliers?.length || 0} مورد | ${discrepancies.length} بأرصدة مستحقة`,
    details: { totalSuppliers: suppliers?.length || 0, withBalances: discrepancies },
    issuesCount: 0,
    recommendations: discrepancies.length > 3
      ? ['متابعة سداد الأرصدة المستحقة للموردين']
      : [],
  };
}
