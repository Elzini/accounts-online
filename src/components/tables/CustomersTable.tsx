import { useState, useMemo } from 'react';
import { UserPlus, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { CustomerActions } from '@/components/actions/CustomerActions';
import { ActivePage } from '@/types';
import { useCustomers } from '@/hooks/useDatabase';

interface CustomersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function CustomersTable({ setActivePage }: CustomersTableProps) {
  const { data: customers = [], isLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.id_number?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

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
          <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات العملاء</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-customer')}
          className="gradient-primary hover:opacity-90"
        >
          <UserPlus className="w-5 h-5 ml-2" />
          إضافة عميل
        </Button>
      </div>

      {/* Search */}
      <SearchFilter
        searchPlaceholder="البحث بالاسم، الهاتف، الهوية..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">#</TableHead>
              <TableHead className="text-right font-bold">اسم العميل</TableHead>
              <TableHead className="text-right font-bold">رقم الهوية</TableHead>
              <TableHead className="text-right font-bold">رقم الهاتف</TableHead>
              <TableHead className="text-right font-bold">العنوان</TableHead>
              <TableHead className="text-right font-bold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer, index) => (
              <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-semibold text-foreground">{customer.name}</TableCell>
                <TableCell dir="ltr" className="text-right">{customer.id_number || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.address || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <CustomerActions customer={customer} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {customers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد عملاء حتى الآن</p>
            <Button 
              onClick={() => setActivePage('add-customer')}
              className="mt-4 gradient-primary"
            >
              إضافة أول عميل
            </Button>
          </div>
        )}

        {customers.length > 0 && filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
