import { useState, useMemo } from 'react';
import { UserPlus, Phone, MapPin, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { CustomerActions } from '@/components/actions/CustomerActions';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { ActivePage } from '@/types';
import { useCustomers } from '@/hooks/useDatabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function CustomersTable({ setActivePage }: CustomersTableProps) {
  const { data: customers = [], isLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const { t, isRTL } = useLanguage();

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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.customers_page_title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.customers_page_subtitle}</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-customer')}
          className="gradient-primary hover:opacity-90 w-full sm:w-auto h-10 sm:h-11"
        >
          <UserPlus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t.btn_add_customer}
        </Button>
      </div>

      <SearchFilter
        searchPlaceholder={t.search_customers}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isMobile ? (
        <div className="space-y-3">
          {filteredCustomers.map((customer, index) => (
            <MobileCard key={customer.id}>
              <MobileCardHeader
                title={customer.name}
                subtitle={`${t.th_number} ${index + 1}`}
                actions={<CustomerActions customer={{ ...customer, credit_limit: (customer as any).credit_limit ?? 0 }} />}
              />
              <div className="space-y-1">
                <MobileCardRow label={t.th_id_number} value={customer.id_number || '-'} icon={<IdCard className="w-3.5 h-3.5" />} />
                <MobileCardRow label={t.th_phone} value={<span dir="ltr">{customer.phone}</span>} icon={<Phone className="w-3.5 h-3.5" />} />
                <MobileCardRow label={t.th_address} value={customer.address || '-'} icon={<MapPin className="w-3.5 h-3.5" />} />
                <MobileCardRow label={t.th_tax_number} value={<span dir="ltr">{customer.registration_number || '-'}</span>} />
              </div>
            </MobileCard>
          ))}
          
          {customers.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_customers_yet}</p>
              <Button onClick={() => setActivePage('add-customer')} className="gradient-primary">{t.add_first_customer}</Button>
            </div>
          )}
          {customers.length > 0 && filteredCustomers.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.th_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_customer_name}</TableHead>
                <TableHead className="text-right font-bold">{t.th_id_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_phone}</TableHead>
                <TableHead className="text-right font-bold">{t.th_address}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
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
                  <TableCell dir="ltr" className="text-right">{customer.registration_number || '-'}</TableCell>
                  <TableCell>
                    <CustomerActions customer={{ ...customer, credit_limit: (customer as any).credit_limit ?? 0 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {customers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_customers_yet}</p>
              <Button onClick={() => setActivePage('add-customer')} className="mt-4 gradient-primary">{t.add_first_customer}</Button>
            </div>
          )}
          {customers.length > 0 && filteredCustomers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
