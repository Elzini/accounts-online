import { useState, useMemo } from 'react';
import { ShoppingCart, Car, Calendar, Wallet, Building2, CreditCard, Banknote, Hash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/ui/search-filter';
import { CarActions } from '@/components/actions/CarActions';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { ActivePage } from '@/types';
import { useCars } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PurchasesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ setActivePage }: PurchasesTableProps) {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { data: cars = [], isLoading, refetch } = useCars();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    await refetch();
    setIsRefreshing(false);
  };

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings.tax_rate || 15) : 0;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = language === 'ar' ? 'ريال' : 'SAR';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  };

  const calculateTaxDetails = (purchasePrice: number) => {
    const baseAmount = purchasePrice;
    const taxAmount = purchasePrice * (taxRate / 100);
    const totalWithTax = purchasePrice + taxAmount;
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
      case '2101': return { label: t.payment_deferred, icon: Wallet, color: 'text-orange-600' };
      case '2102': return { label: t.payment_check, icon: Wallet, color: 'text-amber-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-success hover:bg-success/90 text-xs">{t.status_available}</Badge>;
      case 'transferred':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">{t.status_transferred}</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="text-xs">{t.status_sold}</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const filteredCars = useMemo(() => {
    let result = cars;

    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);

      result = result.filter((car) => {
        const purchaseDate = new Date(car.purchase_date);
        return purchaseDate >= fyStart && purchaseDate <= fyEnd;
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car =>
        car.name.toLowerCase().includes(query) ||
        car.model?.toLowerCase().includes(query) ||
        car.color?.toLowerCase().includes(query) ||
        car.chassis_number.toLowerCase().includes(query) ||
        car.inventory_number.toString().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(car => car.status === statusFilter);
    }
    
    return result;
  }, [cars, searchQuery, statusFilter, selectedFiscalYear]);

  const totals = useMemo(() => {
    return filteredCars.reduce(
      (acc, car) => {
        const details = calculateTaxDetails(Number(car.purchase_price));
        return {
          baseAmount: acc.baseAmount + details.baseAmount,
          taxAmount: acc.taxAmount + details.taxAmount,
          totalWithTax: acc.totalWithTax + details.totalWithTax,
        };
      },
      { baseAmount: 0, taxAmount: 0, totalWithTax: 0 }
    );
  }, [filteredCars, taxRate]);

  const filterOptions = [
    { value: 'available', label: t.status_available },
    { value: 'sold', label: t.status_sold },
  ];

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_purchases}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.subtitle_manage_inventory}</p>
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
            onClick={() => setActivePage('add-purchase')}
            className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11"
          >
            <ShoppingCart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t.btn_add_car}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchPlaceholder={t.search_purchases}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder={t.filter_status}
      />

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredCars.map((car) => {
            const taxDetails = calculateTaxDetails(Number(car.purchase_price));
            const paymentAccount = (car as any).payment_account;
            const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
            
            return (
              <MobileCard key={car.id}>
                <MobileCardHeader
                  title={car.name}
                  subtitle={`${car.model || ''} ${car.color ? `- ${car.color}` : ''}`}
                  badge={getStatusBadge(car.status)}
                  actions={<CarActions car={car} />}
                />
                <div className="space-y-1">
                  <MobileCardRow 
                    label={t.th_inventory_number} 
                    value={car.inventory_number}
                    icon={<Hash className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label={t.th_chassis_number} 
                    value={<span dir="ltr" className="font-mono text-xs">{car.chassis_number}</span>}
                    icon={<Car className="w-3.5 h-3.5" />}
                  />
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
                    label={t.th_purchase_date} 
                    value={formatDate(car.purchase_date)}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label={t.th_payment_method} 
                    value={<span className={paymentInfo.color}>{paymentInfo.label}</span>}
                  />
                </div>
              </MobileCard>
            );
          })}
          
          {/* Summary Cards */}
          {filteredCars.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_base_amount}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} {currency}</p>
              </div>
              {taxRate > 0 && (
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} {currency}</p>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_purchases_with_tax}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
              </div>
            </div>
          )}

          {cars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_cars_in_stock}</p>
              <Button 
                onClick={() => setActivePage('add-purchase')}
                className="gradient-primary"
              >
                {t.add_first_car}
              </Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.th_inventory_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_car_name}</TableHead>
                <TableHead className="text-right font-bold">{t.th_model}</TableHead>
                <TableHead className="text-right font-bold">{t.th_color}</TableHead>
                <TableHead className="text-right font-bold">{t.th_chassis_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
                <TableHead className="text-right font-bold">{t.th_payment_method}</TableHead>
                <TableHead className="text-right font-bold">{t.th_purchase_date}</TableHead>
                <TableHead className="text-right font-bold">{t.th_status}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => {
                const taxDetails = calculateTaxDetails(Number(car.purchase_price));
                const paymentAccount = (car as any).payment_account;
                const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
                const PaymentIcon = paymentInfo.icon;
                return (
                <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{car.inventory_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{car.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{car.model || '-'}</TableCell>
                  <TableCell>{car.color || '-'}</TableCell>
                  <TableCell dir="ltr" className="text-right font-mono text-sm">{car.chassis_number}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} {currency}</TableCell>
                  <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} {currency}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} {currency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                      <span className={paymentInfo.color}>{paymentInfo.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(car.purchase_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(car.status)}
                  </TableCell>
                  <TableCell>
                    <CarActions car={car} />
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>

          {/* Tax Summary */}
          {filteredCars.length > 0 && (
            <div className="border-t bg-muted/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_base_amount}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_purchases_with_tax}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
                </div>
              </div>
            </div>
          )}
          
          {cars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_cars_in_stock}</p>
              <Button 
                onClick={() => setActivePage('add-purchase')}
                className="mt-4 gradient-primary"
              >
                {t.add_first_car}
              </Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
