import { useState, useMemo } from 'react';
import { DollarSign, Calendar, TrendingUp, Wallet, Building2, CreditCard, Banknote, User, Car, Hash, RefreshCw } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useRecalculateCompanyProfits } from '@/hooks/useProfitRecalculation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface SalesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SalesTable({ setActivePage }: SalesTableProps) {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { data: sales = [], isLoading, refetch } = useSales();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const recalcProfits = useRecalculateCompanyProfits();
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
    await queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    await queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
    await queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    await refetch();
    setIsRefreshing(false);
  };

  const handleRecalculateProfits = async () => {
    try {
      const res = await recalcProfits.mutateAsync();
      toast.success(`${t.recalculate_success} (${res.salesUpdated} / ${res.itemsUpdated})`);
    } catch (e: any) {
      console.error(e);
      toast.error(t.recalculate_error);
    }
  };

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_sales ? (taxSettings.tax_rate || 15) : 0;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = language === 'ar' ? 'ريال' : 'SAR';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
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
      case '1101': return { label: t.payment_cash, icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: t.payment_bank_transfer, icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: t.payment_pos, icon: CreditCard, color: 'text-purple-600' };
      case '1201': return { label: t.payment_deferred, icon: User, color: 'text-orange-600' };
      case '1202': return { label: t.payment_check, icon: Wallet, color: 'text-amber-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };

  const filteredSales = useMemo(() => {
    let result = sales;
    
    if (selectedFiscalYear) {
      result = result.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const startDate = new Date(selectedFiscalYear.start_date);
        const endDate = new Date(selectedFiscalYear.end_date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_sales}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.subtitle_sales_log}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 sm:h-11"
          >
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.btn_refresh}
          </Button>
          <Button
            variant="outline"
            onClick={handleRecalculateProfits}
            disabled={recalcProfits.isPending}
            className="h-10 sm:h-11"
          >
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${recalcProfits.isPending ? 'animate-spin' : ''}`} />
            {t.btn_recalculate_profits}
          </Button>
          <Button 
            onClick={() => setActivePage('add-sale')}
            className="gradient-success hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11"
          >
            <DollarSign className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t.btn_record_sale}
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchFilter
        searchPlaceholder={t.search_sales}
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
                  title={`${t.th_sale_number} ${sale.sale_number}`}
                  subtitle={sale.customer?.name || t.unspecified_customer}
                  actions={<SaleActions sale={sale} />}
                />
                <div className="space-y-1">
                  <MobileCardRow 
                    label={t.th_car} 
                    value={isMultiCar ? `${carCount} ${t.cars_count}` : (sale.car?.name || '-')}
                    icon={<Car className="w-3.5 h-3.5" />}
                  />
                  {!isMultiCar && sale.car?.model && (
                    <MobileCardRow 
                      label={t.th_model} 
                      value={`${sale.car.model} ${sale.car.color ? `- ${sale.car.color}` : ''}`}
                    />
                  )}
                  <MobileCardRow 
                    label={t.th_base_amount} 
                    value={`${formatCurrency(taxDetails.baseAmount)} ${currency}`}
                    icon={<Wallet className="w-3.5 h-3.5" />}
                  />
                  {taxRate > 0 && (
                    <MobileCardRow 
                      label={`${t.th_tax} (${taxRate}%)`}
                      value={<span className="text-orange-600">{formatCurrency(taxDetails.taxAmount)} {currency}</span>}
                    />
                  )}
                  <MobileCardRow 
                    label={t.th_total_with_tax} 
                    value={<span className="text-primary font-bold">{formatCurrency(taxDetails.totalWithTax)} {currency}</span>}
                  />
                  <MobileCardRow 
                    label={t.th_profit} 
                    value={
                      <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)} {currency}
                      </span>
                    }
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label={t.th_sale_date} 
                    value={formatDate(sale.sale_date)}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label={t.th_receipt_method} 
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
                <p className="text-xs text-muted-foreground">{t.total_sales_with_tax}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
              </div>
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_profits}</p>
                <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.round(totals.profit))} {currency}
                </p>
              </div>
            </div>
          )}

          {sales.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_sales_yet}</p>
              <Button 
                onClick={() => setActivePage('add-sale')}
                className="gradient-success"
              >
                {t.record_first_sale}
              </Button>
            </div>
          )}

          {sales.length > 0 && filteredSales.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.th_sale_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_customer}</TableHead>
                <TableHead className="text-right font-bold">{t.th_car}</TableHead>
                <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
                <TableHead className="text-right font-bold">{t.th_profit}</TableHead>
                <TableHead className="text-right font-bold">{t.th_receipt_method}</TableHead>
                <TableHead className="text-right font-bold">{t.th_sale_date}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
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
                        <p className="font-medium text-primary">{carCount} {t.cars_count}</p>
                        <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                          {saleItems.map((item: any, idx: number) => (
                            <p key={item.id || idx}>{item.car?.name || t.th_car} - {item.car?.model || ''}</p>
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
                  <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} {currency}</TableCell>
                  <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} {currency}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} {currency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${Number(sale.profit) >= 0 ? 'text-success' : 'text-destructive'}`} />
                      <span className={`font-bold ${Number(sale.profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(Number(sale.profit))} {currency}
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
                  <p className="text-sm text-muted-foreground">{t.total_base_amount}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_sales_with_tax}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_profits}</p>
                  <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(Math.round(totals.profit))} {currency}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {sales.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_sales_yet}</p>
              <Button 
                onClick={() => setActivePage('add-sale')}
                className="mt-4 gradient-success"
              >
                {t.record_first_sale}
              </Button>
            </div>
          )}

          {sales.length > 0 && filteredSales.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
