import { useState, useMemo } from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { ActivePage } from '@/types';
import { useSales } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { SaleActions } from '@/components/actions/SaleActions';

interface SalesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SalesTable({ setActivePage }: SalesTableProps) {
  const { data: sales = [], isLoading } = useSales();
  const { data: taxSettings } = useTaxSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings.tax_rate || 15) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  // Calculate tax details for each sale
  const calculateTaxDetails = (salePrice: number) => {
    const baseAmount = salePrice / (1 + taxRate / 100);
    const taxAmount = salePrice - baseAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: salePrice,
    };
  };

  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    
    const query = searchQuery.toLowerCase();
    return sales.filter(sale =>
      sale.customer?.name?.toLowerCase().includes(query) ||
      sale.car?.name?.toLowerCase().includes(query) ||
      sale.car?.model?.toLowerCase().includes(query) ||
      sale.sale_number.toString().includes(query)
    );
  }, [sales, searchQuery]);

  // Calculate totals for summary
  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        const details = calculateTaxDetails(Number(sale.sale_price));
        return {
          baseAmount: acc.baseAmount + details.baseAmount,
          taxAmount: acc.taxAmount + details.taxAmount,
          totalWithTax: acc.totalWithTax + details.totalWithTax,
          profit: acc.profit + Number(sale.profit),
        };
      },
      { baseAmount: 0, taxAmount: 0, totalWithTax: 0, profit: 0 }
    );
  }, [filteredSales, taxRate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">المبيعات</h1>
          <p className="text-sm text-muted-foreground mt-1">سجل عمليات البيع</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-sale')}
          className="gradient-success hover:opacity-90 w-full sm:w-auto"
        >
          <DollarSign className="w-5 h-5 ml-2" />
          تسجيل بيع
        </Button>
      </div>

      {/* Search */}
      <SearchFilter
        searchPlaceholder="البحث بالعميل، السيارة، رقم البيع..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم البيع</TableHead>
              <TableHead className="text-right font-bold">العميل</TableHead>
              <TableHead className="text-right font-bold">السيارة</TableHead>
              <TableHead className="text-right font-bold">المبلغ الأصلي</TableHead>
              <TableHead className="text-right font-bold">الضريبة ({taxRate}%)</TableHead>
              <TableHead className="text-right font-bold">الإجمالي مع الضريبة</TableHead>
              <TableHead className="text-right font-bold">الربح</TableHead>
              <TableHead className="text-right font-bold">تاريخ البيع</TableHead>
              <TableHead className="text-right font-bold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredSales.map((sale) => {
              const taxDetails = calculateTaxDetails(Number(sale.sale_price));
              return (
              <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{sale.sale_number}</TableCell>
                <TableCell className="font-semibold">{sale.customer?.name || '-'}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{sale.car?.name || '-'}</p>
                    <p className="text-sm text-muted-foreground">{sale.car?.model} - {sale.car?.color}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} ريال</TableCell>
                <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} ريال</TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} ريال</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${Number(sale.profit) >= 0 ? 'text-success' : 'text-destructive'}`} />
                    <span className={`font-bold ${Number(sale.profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(Number(sale.profit))} ريال
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(sale.sale_date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <SaleActions sale={sale} />
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>

        {/* Tax Summary */}
        {filteredSales.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">إجمالي المبلغ الأصلي</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} ريال</p>
              </div>
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">إجمالي الضريبة ({taxRate}%)</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} ريال</p>
              </div>
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">إجمالي المبيعات مع الضريبة</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} ريال</p>
              </div>
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
                <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(Math.round(totals.profit))} ريال
                </p>
              </div>
            </div>
          </div>
        )}
        
        {sales.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد عمليات بيع حتى الآن</p>
            <Button 
              onClick={() => setActivePage('add-sale')}
              className="mt-4 gradient-success"
            >
              تسجيل أول عملية بيع
            </Button>
          </div>
        )}

        {sales.length > 0 && filteredSales.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
