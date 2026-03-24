/**
 * Supplier Report Data Hook - Extracted from SuppliersReport.tsx
 */
import { useState, useMemo } from 'react';
import { useSuppliers, useCars } from '@/hooks/useDatabase';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useReportsServices';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

export function useSupplierReportData() {
  const { companyId } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: cars, isLoading: carsLoading } = useCars();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');

  const { data: purchaseInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['suppliers-report-invoices', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invoices').select('*, invoice_items(*)').eq('company_id', companyId!)
        .eq('invoice_type', 'purchase').gte('total', 0).order('invoice_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(() => {
    if (isCarDealership) {
      return (cars || []).map(car => ({
        id: car.id, supplier_id: car.supplier_id, date: car.purchase_date,
        amount: Number(car.purchase_price), taxable_amount: Number(car.purchase_price), vat_amount: 0,
        status: car.status, name: car.name, model: car.model || '-',
        reference: String(car.inventory_number), chassis: car.chassis_number,
      }));
    }
    return purchaseInvoices.map((inv: any) => ({
      id: inv.id, supplier_id: inv.supplier_id, date: inv.invoice_date,
      amount: Number(inv.total || 0), taxable_amount: Number(inv.taxable_amount || 0),
      vat_amount: Number(inv.vat_amount || 0), status: inv.status || 'draft',
      name: inv.customer_name || '-', model: inv.invoice_number || '-',
      reference: inv.supplier_invoice_number || inv.invoice_number || '-', chassis: '',
    }));
  }, [isCarDealership, cars, purchaseInvoices]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedSupplier !== 'all' && item.supplier_id !== selectedSupplier) return false;
      return true;
    });
  }, [items, startDate, endDate, selectedSupplier]);

  const supplierStats = useMemo(() => {
    if (!suppliers) return [];
    const relevantItems = items.filter(item => {
      const itemDate = new Date(item.date);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
    return suppliers.map(supplier => {
      const supplierItems = relevantItems.filter(item => item.supplier_id === supplier.id);
      const totalPurchases = supplierItems.reduce((sum, item) => sum + item.amount, 0);
      let availableCount = 0, soldCount = 0;
      if (isCarDealership) {
        availableCount = supplierItems.filter(item => item.status === 'available').length;
        soldCount = supplierItems.filter(item => item.status === 'sold').length;
      } else {
        availableCount = supplierItems.filter(item => ['issued', 'approved', 'معتمدة', 'معتمد'].includes(item.status.toLowerCase())).length;
        soldCount = supplierItems.filter(item => ['draft', 'مسودة'].includes(item.status.toLowerCase())).length;
      }
      return {
        ...supplier, carsCount: supplierItems.length, availableCars: availableCount,
        soldCars: soldCount, totalPurchases,
        lastPurchaseDate: supplierItems.length > 0
          ? supplierItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null,
      };
    }).filter(s => selectedSupplier === 'all' || s.id === selectedSupplier);
  }, [suppliers, items, startDate, endDate, selectedSupplier, isCarDealership]);

  const isLoading = suppliersLoading || (isCarDealership ? carsLoading : invoicesLoading);
  const selectedSupplierData = selectedSupplier !== 'all' ? supplierStats[0] : null;
  const totalSuppliers = selectedSupplier === 'all' ? supplierStats.length : 1;
  const activeSuppliers = supplierStats.filter(s => s.carsCount > 0).length;
  const totalPurchasesAmount = supplierStats.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalCarsCount = supplierStats.reduce((sum, s) => sum + s.carsCount, 0);
  const sortedSuppliers = [...supplierStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return {
    suppliers, isCarDealership, isLoading,
    startDate, setStartDate, endDate, setEndDate, selectedSupplier, setSelectedSupplier,
    items, filteredItems, supplierStats, sortedSuppliers,
    selectedSupplierData, totalSuppliers, activeSuppliers, totalPurchasesAmount, totalCarsCount,
  };
}
