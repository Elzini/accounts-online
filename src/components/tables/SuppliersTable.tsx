import { Truck, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivePage } from '@/types';
import { useSuppliers } from '@/hooks/useDatabase';

interface SuppliersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SuppliersTable({ setActivePage }: SuppliersTableProps) {
  const { data: suppliers = [], isLoading } = useSuppliers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الموردين</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات الموردين</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-supplier')}
          className="gradient-warning hover:opacity-90"
        >
          <Truck className="w-5 h-5 ml-2" />
          إضافة مورد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم المورد</TableHead>
              <TableHead className="text-right font-bold">رقم السجل</TableHead>
              <TableHead className="text-right font-bold">رقم الهاتف</TableHead>
              <TableHead className="text-right font-bold">العنوان</TableHead>
              <TableHead className="text-right font-bold">ملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier, index) => (
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
      </div>
    </div>
  );
}
