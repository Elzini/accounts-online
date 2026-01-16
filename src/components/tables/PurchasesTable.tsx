import { useState, useMemo } from 'react';
import { ShoppingCart, Car, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/ui/search-filter';
import { CarActions } from '@/components/actions/CarActions';
import { ActivePage } from '@/types';
import { useCars } from '@/hooks/useDatabase';

interface PurchasesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ setActivePage }: PurchasesTableProps) {
  const { data: cars = [], isLoading } = useCars();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
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
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم المخزون</TableHead>
              <TableHead className="text-right font-bold">اسم السيارة</TableHead>
              <TableHead className="text-right font-bold">الموديل</TableHead>
              <TableHead className="text-right font-bold">اللون</TableHead>
              <TableHead className="text-right font-bold">رقم الهيكل</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">تاريخ الشراء</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
              <TableHead className="text-right font-bold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCars.map((car) => (
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
                <TableCell className="font-semibold text-primary">{formatCurrency(Number(car.purchase_price))} ريال</TableCell>
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
            ))}
          </TableBody>
        </Table>
        
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
