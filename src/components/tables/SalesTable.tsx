import { useState, useMemo } from 'react';
import { DollarSign, Calendar, TrendingUp, Wallet, Building2, CreditCard, Banknote, User, Car, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { ActivePage } from '@/types';
import { useSales } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { SaleActions } from '@/components/actions/SaleActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface SalesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SalesTable({ setActivePage }: SalesTableProps) {
  const { data: sales = [], isLoading } = useSales();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings.tax_rate || 15) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  const calculateTaxDetails = (salePrice: number) => {
    const baseAmount = salePrice;
    const taxAmount = salePrice * (taxRate / 100);
    const totalWithTax = salePrice + taxAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: Math.round(totalWithTax * 100) / 100,
    };
  };

  const getPaymentMethodInfo = (code?: string) => {
    switch (code) {
      case '1101': return { label: 'نقداً', icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: 'تحويل بنكي', icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: 'نقاط البيع', icon: CreditCard, color: 'text-purple-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };

  const filteredSales = useMemo(() => {
    let result = sales;
    
    // Filter by fiscal year
    if (selectedFiscalYear) {
      result = result.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const startDate = new Date(selectedFiscalYear.start_date);
        const endDate = new Date(selectedFiscalYear.end_date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sale =>
        sale.customer?.name?.toLowerCase().includes(query) ||
        sale.car?.name?.toLowerCase().includes(query) ||
        sale.car?.model?.toLowerCase().includes(query) ||
        sale.sale_number.toString().includes(query)
      );
    }
    
    return result;
  }, [sales, searchQuery, selectedFiscalYear]);

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
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">المبيعات</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">سجل عمليات البيع</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-sale')}
          className="gradient-success hover:opacity-90 w-full sm:w-auto h-10 sm:h-11"
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

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const taxDetails = calculateTaxDetails(Number(sale.sale_price));
            const saleItems = (sale as any).sale_items || [];
            const isMultiCar = saleItems.length > 1;
            const carCount = saleItems.length > 0 ? saleItems.length : 1;
            const paymentAccount = (sale as any).payment_account;
            const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
            const profit = Number(sale.profit);
            
            return (
              <MobileCard key={sale.id}>
                <MobileCardHeader
                  title={`بيع #${sale.sale_number}`}
                  subtitle={sale.customer?.name || 'عميل غير محدد'}
                  actions={<SaleActions sale={sale} />}
                />
                <div className="space-y-1">
                  <MobileCardRow 
                    label="السيارة" 
                    value={isMultiCar ? `${carCount} سيارات` : (sale.car?.name || '-')}
                    icon={<Car className="w-3.5 h-3.5" />}
                  />
                  {!isMultiCar && sale.car?.model && (
                    <MobileCardRow 
                      label="الموديل" 
                      value={`${sale.car.model} ${sale.car.color ? `- ${sale.car.color}` : ''}`}
                    />
                  )}
                  <MobileCardRow 
                    label="السعر الأصلي" 
                    value={`${formatCurrency(taxDetails.baseAmount)} ريال`}
                    icon={<Wallet className="w-3.5 h-3.5" />}
                  />
                  {taxRate > 0 && (
                    <MobileCardRow 
                      label={`الضريبة (${taxRate}%)`}
                      value={<span className="text-orange-600">{formatCurrency(taxDetails.taxAmount)} ريال</span>}
                    />
                  )}
                  <MobileCardRow 
                    label="الإجمالي" 
                    value={<span className="text-primary font-bold">{formatCurrency(taxDetails.totalWithTax)} ريال</span>}
                  />
                  <MobileCardRow 
                    label="الربح" 
                    value={
                      <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)} ريال
                      </span>
                    }
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label="تاريخ البيع" 
                    value={formatDate(sale.sale_date)}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label="طريقة الاستلام" 
                    value={<span className={paymentInfo.color}>{paymentInfo.label}</span>}
                  />
                </div>
              </MobileCard>
            );
          })}
          
          {/* Summary Cards */}
          {filteredSales.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} ريال</p>
              </div>
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
                <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.round(totals.profit))} ريال
                </p>
              </div>
            </div>
          )}

          {sales.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">لا يوجد عمليات بيع حتى الآن</p>
              <Button 
                onClick={() => setActivePage('add-sale')}
                className="gradient-success"
              >
                تسجيل أول عملية بيع
              </Button>
            </div>
          )}

          {sales.length > 0 && filteredSales.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
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
                <TableHead className="text-right font-bold">طريقة الاستلام</TableHead>
                <TableHead className="text-right font-bold">تاريخ البيع</TableHead>
                <TableHead className="text-right font-bold">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredSales.map((sale) => {
                const taxDetails = calculateTaxDetails(Number(sale.sale_price));
                const saleItems = (sale as any).sale_items || [];
                const isMultiCar = saleItems.length > 1;
                const carCount = saleItems.length > 0 ? saleItems.length : 1;
                const paymentAccount = (sale as any).payment_account;
                const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
                const PaymentIcon = paymentInfo.icon;
                
                return (
                <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{sale.sale_number}</TableCell>
                  <TableCell className="font-semibold">{sale.customer?.name || '-'}</TableCell>
                  <TableCell>
                    {isMultiCar ? (
                      <div>
                        <p className="font-medium text-primary">{carCount} سيارات</p>
                        <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                          {saleItems.map((item: any, idx: number) => (
                            <p key={item.id || idx}>{item.car?.name || 'سيارة'} - {item.car?.model || ''}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{sale.car?.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{sale.car?.model} - {sale.car?.color}</p>
                      </div>
                    )}
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
                      <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                      <span className={paymentInfo.color}>{paymentInfo.label}</span>
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
      )}
    </div>
  );
}
