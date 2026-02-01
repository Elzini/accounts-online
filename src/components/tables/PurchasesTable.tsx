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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate and refetch
    await queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    await refetch();
    setIsRefreshing(false);
  };

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings.tax_rate || 15) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
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
      case '1101': return { label: 'نقداً', icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: 'تحويل بنكي', icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: 'نقاط البيع', icon: CreditCard, color: 'text-purple-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-success hover:bg-success/90 text-xs">متاحة</Badge>;
      case 'transferred':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">محولة</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="text-xs">مباعة</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const filteredCars = useMemo(() => {
    let result = cars;

    // فلترة المخزون حسب السنة المالية (بـ fiscal_year_id)
    // حتى تظهر السيارات المُرحّلة في سنة جديدة مهما كان تاريخ الشراء.
    // احتياط: لو fiscal_year_id فارغ (بيانات قديمة)، نرجع لفلترة التاريخ.
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);

      result = result.filter((car) => {
        if (car.fiscal_year_id) return car.fiscal_year_id === selectedFiscalYear.id;
        const purchaseDate = new Date(car.purchase_date);
        return purchaseDate >= fyStart && purchaseDate <= fyEnd;
      });
    }
    
    // NOTE: We do NOT filter by fiscal year here because:
    // 1. Available cars should always be visible regardless of purchase date
    // 2. A car purchased in 2025 but still not sold should appear in 2026 inventory
    // 3. Fiscal year filtering is for financial reports, not inventory management
    
    // Filter by search query
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
    
    // Filter by status
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
    { value: 'available', label: 'متاحة' },
    { value: 'sold', label: 'مباعة' },
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">المشتريات</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">إدارة مخزون السيارات</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 sm:h-11"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            onClick={() => setActivePage('add-purchase')}
            className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11"
          >
            <ShoppingCart className="w-5 h-5 ml-2" />
            إضافة سيارة
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchPlaceholder="البحث بالاسم، الموديل، الهيكل..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder="الحالة"
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
                    label="رقم المخزون" 
                    value={car.inventory_number}
                    icon={<Hash className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label="رقم الهيكل" 
                    value={<span dir="ltr" className="font-mono text-xs">{car.chassis_number}</span>}
                    icon={<Car className="w-3.5 h-3.5" />}
                  />
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
                    label="تاريخ الشراء" 
                    value={formatDate(car.purchase_date)}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  <MobileCardRow 
                    label="طريقة الدفع" 
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
                <p className="text-xs text-muted-foreground">إجمالي المبلغ الأصلي</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} ريال</p>
              </div>
              {taxRate > 0 && (
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground">إجمالي الضريبة ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} ريال</p>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">إجمالي المشتريات</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} ريال</p>
              </div>
            </div>
          )}

          {cars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">لا يوجد سيارات في المخزون</p>
              <Button 
                onClick={() => setActivePage('add-purchase')}
                className="gradient-primary"
              >
                إضافة أول سيارة
              </Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">رقم المخزون</TableHead>
                <TableHead className="text-right font-bold">اسم السيارة</TableHead>
                <TableHead className="text-right font-bold">الموديل</TableHead>
                <TableHead className="text-right font-bold">اللون</TableHead>
                <TableHead className="text-right font-bold">رقم الهيكل</TableHead>
                <TableHead className="text-right font-bold">المبلغ الأصلي</TableHead>
                <TableHead className="text-right font-bold">الضريبة ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">الإجمالي مع الضريبة</TableHead>
                <TableHead className="text-right font-bold">طريقة الدفع</TableHead>
                <TableHead className="text-right font-bold">تاريخ الشراء</TableHead>
                <TableHead className="text-right font-bold">الحالة</TableHead>
                <TableHead className="text-right font-bold">الإجراءات</TableHead>
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
                  <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} ريال</TableCell>
                  <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} ريال</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} ريال</TableCell>
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
                  <p className="text-sm text-muted-foreground">إجمالي المبلغ الأصلي</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} ريال</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">إجمالي الضريبة ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} ريال</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">إجمالي المشتريات مع الضريبة</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} ريال</p>
                </div>
              </div>
            </div>
          )}
          
          {cars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">لا يوجد سيارات في المخزون</p>
              <Button 
                onClick={() => setActivePage('add-purchase')}
                className="mt-4 gradient-primary"
              >
                إضافة أول سيارة
              </Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحض</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
