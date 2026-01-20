import { useState, useMemo } from 'react';
import { ShoppingCart, Car, Calendar, Wallet, Building2, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/ui/search-filter';
import { CarActions } from '@/components/actions/CarActions';
import { ActivePage } from '@/types';
import { useCars } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';

interface PurchasesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ setActivePage }: PurchasesTableProps) {
  const { data: cars = [], isLoading } = useCars();
  const { data: taxSettings } = useTaxSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings.tax_rate || 15) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  // Calculate tax details for each purchase
  const calculateTaxDetails = (purchasePrice: number) => {
    const baseAmount = purchasePrice / (1 + taxRate / 100);
    const taxAmount = purchasePrice - baseAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: purchasePrice,
    };
  };

  // Get payment method label and icon
  const getPaymentMethodInfo = (code?: string) => {
    switch (code) {
      case '1101': return { label: 'نقداً', icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: 'تحويل بنكي', icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: 'نقاط البيع', icon: CreditCard, color: 'text-purple-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };

  const filteredCars = useMemo(() => {
    let result = cars;
    
    // Apply search filter
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
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(car => car.status === statusFilter);
    }
    
    return result;
  }, [cars, searchQuery, statusFilter]);

  // Calculate totals for summary
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
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">المشتريات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة مخزون السيارات</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-purchase')}
          className="gradient-primary hover:opacity-90 w-full sm:w-auto"
        >
          <ShoppingCart className="w-5 h-5 ml-2" />
          إضافة سيارة
        </Button>
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

      {/* Table */}
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
                  <Badge variant={car.status === 'available' ? 'default' : car.status === 'transferred' ? 'default' : 'secondary'} 
                    className={car.status === 'available' ? 'bg-success hover:bg-success/90' : car.status === 'transferred' ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                    {car.status === 'available' ? 'متاحة' : car.status === 'transferred' ? 'محولة' : 'مباعة'}
                  </Badge>
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
            <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
