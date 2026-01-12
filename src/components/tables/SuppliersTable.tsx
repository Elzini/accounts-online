import { useState, useMemo } from 'react';
import { Truck, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SupplierActions } from '@/components/actions/SupplierActions';
import { ActivePage } from '@/types';
import { useSuppliers } from '@/hooks/useDatabase';

interface SuppliersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SuppliersTable({ setActivePage }: SuppliersTableProps) {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    
    const query = searchQuery.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(query) ||
      supplier.phone.includes(query) ||
      supplier.registration_number?.toLowerCase().includes(query) ||
      supplier.address?.toLowerCase().includes(query) ||
      supplier.notes?.toLowerCase().includes(query)
    );
  }, [suppliers, searchQuery]);

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">الموردين</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة بيانات الموردين</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-supplier')}
          className="gradient-warning hover:opacity-90 w-full sm:w-auto"
        >
          <Truck className="w-5 h-5 ml-2" />
          إضافة مورد
        </Button>
      </div>

      {/* Search */}
      <SearchFilter
        searchPlaceholder="البحث بالاسم، الهاتف، السجل..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم المورد</TableHead>
              <TableHead className="text-right font-bold">رقم السجل</TableHead>
              <TableHead className="text-right font-bold">رقم الهاتف</TableHead>
              <TableHead className="text-right font-bold">العنوان</TableHead>
              <TableHead className="text-right font-bold">ملاحظات</TableHead>
              <TableHead className="text-right font-bold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier, index) => (
              <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-semibold text-foreground">{supplier.name}</TableCell>
                <TableCell dir="ltr" className="text-right">{supplier.registration_number || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{supplier.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{supplier.address || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{supplier.notes || '-'}</TableCell>
                <TableCell>
                  <SupplierActions supplier={supplier} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {suppliers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد موردين حتى الآن</p>
            <Button 
              onClick={() => setActivePage('add-supplier')}
              className="mt-4 gradient-warning"
            >
              إضافة أول مورد
            </Button>
          </div>
        )}

        {suppliers.length > 0 && filteredSuppliers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
