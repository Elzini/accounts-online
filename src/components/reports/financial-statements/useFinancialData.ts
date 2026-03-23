/**
 * Financial Statements - Data Loading Hook
 * Handles loading data from system (Supabase) and Excel files.
 */

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/hooks/modules/useReportsServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { toast } from 'sonner';
import { readExcelFile } from '@/lib/excelUtils';
import { FinancialData, emptyFinancialData } from './types';
import { parseFinancialStatements } from './excelParser';

export function useFinancialData() {
  const { companyId, company } = useCompany();
  const { hasCarInventory } = useIndustryFeatures();
  const [data, setData] = useState<FinancialData>(emptyFinancialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'none' | 'excel' | 'system'>('none');
  const [fileName, setFileName] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelFile = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) { toast.error('الملف فارغ'); setIsLoading(false); return; }
      const workbook = await readExcelFile(arrayBuffer);
      if (workbook.SheetNames.length === 0) { toast.error('الملف لا يحتوي على أي صفحات'); setIsLoading(false); return; }
      const parsedData = parseFinancialStatements(workbook);
      const hasData = parsedData.balanceSheet.currentAssets.length > 0 || parsedData.balanceSheet.fixedAssets.length > 0 || parsedData.balanceSheet.totalAssets > 0 || parsedData.incomeStatement.revenue > 0 || parsedData.incomeStatement.netProfit !== 0;
      if (!hasData) toast.warning('لم يتم العثور على بيانات مالية في الملف');
      setData(parsedData);
      setFileName(file.name);
      setDataSource('excel');
      toast.success(`تم تحليل الملف بنجاح (${workbook.SheetNames.length} صفحة)`);
    } catch (error) {
      toast.error('خطأ في تحليل الملف: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemData = async () => {
    if (!companyId) { toast.error('يرجى تسجيل الدخول أولاً'); return; }
    setIsLoading(true);
    try {
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

      let revenue = 0, costOfSales = 0;

      if (hasCarInventory) {
        const { data: salesData } = await supabase.from('sales').select(`sale_price, car:cars(purchase_price), sale_items:sale_items(sale_price, car:cars(purchase_price))`).eq('company_id', companyId).gte('sale_date', startDate!).lte('sale_date', endDate!);
        (salesData || []).forEach((sale: any) => {
          if (sale.sale_items && sale.sale_items.length > 0) { sale.sale_items.forEach((item: any) => { revenue += Number(item.sale_price) || 0; costOfSales += Number(item.car?.purchase_price) || 0; }); }
          else { revenue += Number(sale.sale_price) || 0; costOfSales += Number(sale.car?.purchase_price) || 0; }
        });
      } else {
        const { data: salesInvoices } = await supabase.from('invoices').select('subtotal, total').eq('company_id', companyId).eq('invoice_type', 'sales').gte('invoice_date', startDate!).lte('invoice_date', endDate!);
        const { data: purchaseInvoices } = await supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'purchase').gte('invoice_date', startDate!).lte('invoice_date', endDate!);
        revenue = (salesInvoices || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
        costOfSales = (purchaseInvoices || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);
      }

      const { data: expensesData } = await supabase.from('expenses').select(`amount, description, category:expense_categories(name)`).eq('company_id', companyId).gte('expense_date', startDate!).lte('expense_date', endDate!);
      const expensesByCategory: { [key: string]: number } = {};
      (expensesData || []).forEach((expense: any) => { const category = expense.category?.name || 'مصروفات أخرى'; expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(expense.amount); });
      const operatingExpenses = Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount }));
      const totalExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

      const { data: bankData } = await supabase.from('bank_accounts').select('current_balance').eq('company_id', companyId);
      const totalCash = (bankData || []).reduce((sum: number, b: any) => sum + (Number(b.current_balance) || 0), 0);

      let inventoryValue = 0;
      if (hasCarInventory) {
        const { data: carsData } = await supabase.from('cars').select('purchase_price').eq('company_id', companyId).eq('status', 'available');
        inventoryValue = (carsData || []).reduce((sum: number, c: any) => sum + (Number(c.purchase_price) || 0), 0);
      }

      const grossProfit = revenue - costOfSales;
      const operatingProfit = grossProfit - totalExpenses;
      const zakat = Math.max(0, operatingProfit * 0.025);
      const netProfit = operatingProfit - zakat;

      const inventoryLabel = hasCarInventory ? 'مخزون السيارات' : 'المخزون';

      setData({
        companyName: company?.name || '',
        period: { from: startDate || '', to: endDate || '' },
        balanceSheet: {
          currentAssets: [{ name: 'النقد وأرصدة لدى البنوك', amount: totalCash }, ...(inventoryValue > 0 ? [{ name: inventoryLabel, amount: inventoryValue }] : [])],
          fixedAssets: [], totalAssets: totalCash + inventoryValue,
          currentLiabilities: [], longTermLiabilities: [], totalLiabilities: 0,
          equity: [{ name: 'رأس المال', amount: 0 }, { name: 'الأرباح المحتجزة', amount: netProfit }], totalEquity: netProfit,
        },
        incomeStatement: { revenue, costOfRevenue: costOfSales, grossProfit, operatingExpenses, totalOperatingExpenses: totalExpenses, operatingProfit, otherIncome: 0, otherExpenses: 0, profitBeforeZakat: operatingProfit, zakat, netProfit },
        equityChanges: {
          items: [
            { description: 'الرصيد الافتتاحي', capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
            { description: 'صافي الربح للفترة', capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
            { description: 'الرصيد الختامي', capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
          ],
          openingBalance: { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 },
          closingBalance: { capital: 0, reserves: 0, retainedEarnings: netProfit, total: netProfit },
        },
        cashFlow: { operating: [{ name: 'صافي الربح', amount: netProfit }], totalOperating: netProfit, investing: [], totalInvesting: 0, financing: [], totalFinancing: 0, netChange: netProfit, openingCash: 0, closingCash: totalCash },
        zakatCalculation: {
          profitBeforeZakat: operatingProfit, adjustmentsOnNetIncome: 0, adjustedNetProfit: operatingProfit, zakatOnAdjustedProfit: operatingProfit * 0.025,
          capital: 0, partnersCurrentAccount: 0, statutoryReserve: 0, employeeBenefitsLiabilities: 0, zakatBaseTotal: 0,
          fixedAssets: 0, intangibleAssets: 0, otherDeductions: 0, totalDeductions: 0,
          zakatBase: operatingProfit, zakatOnBase: operatingProfit * 0.025, totalZakat: zakat,
          openingBalance: 0, provisionAdded: zakat, paidDuringYear: 0, closingBalance: zakat,
        },
      });
      setDataSource('system');
      toast.success('تم تحميل البيانات من النظام');
    } catch (error) {
      console.error('Error loading system data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data, setData,
    isLoading, dataSource,
    fileName, editMode, setEditMode,
    dateRange, setDateRange,
    fileInputRef,
    parseExcelFile, loadSystemData,
  };
}
