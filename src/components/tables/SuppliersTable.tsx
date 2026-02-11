import { useState, useMemo } from 'react';
import { Truck, Phone, MapPin, FileText, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SupplierActions } from '@/components/actions/SupplierActions';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { ActivePage } from '@/types';
import { useSuppliers } from '@/hooks/useDatabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

interface SuppliersTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function SuppliersTable({ setActivePage }: SuppliersTableProps) {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const { t, isRTL } = useLanguage();

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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.suppliers_page_title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.suppliers_page_subtitle}</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-supplier')}
          className="gradient-warning hover:opacity-90 w-full sm:w-auto h-10 sm:h-11"
        >
          <Truck className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t.btn_add_supplier}
        </Button>
      </div>

      <SearchFilter
        searchPlaceholder={t.search_suppliers}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isMobile ? (
        <div className="space-y-3">
          {filteredSuppliers.map((supplier, index) => (
            <MobileCard key={supplier.id}>
              <MobileCardHeader
                title={supplier.name}
                subtitle={`${t.th_number} ${index + 1}`}
                actions={<SupplierActions supplier={supplier} />}
              />
              <div className="space-y-1">
                <MobileCardRow label={t.th_tax_number} value={<span dir="ltr" className="font-mono">{supplier.registration_number || '-'}</span>} icon={<IdCard className="w-3.5 h-3.5" />} />
                <MobileCardRow label={t.th_phone} value={<span dir="ltr" className="font-mono">{supplier.phone}</span>} icon={<Phone className="w-3.5 h-3.5" />} />
                <MobileCardRow label={t.th_address} value={supplier.address || '-'} icon={<MapPin className="w-3.5 h-3.5" />} />
                {supplier.notes && (
                  <MobileCardRow label={t.th_notes} value={<span className="truncate max-w-[150px] inline-block">{supplier.notes}</span>} icon={<FileText className="w-3.5 h-3.5" />} />
                )}
              </div>
            </MobileCard>
          ))}
          
          {suppliers.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_suppliers_yet}</p>
              <Button onClick={() => setActivePage('add-supplier')} className="gradient-warning">{t.add_first_supplier}</Button>
            </div>
          )}
          {suppliers.length > 0 && filteredSuppliers.length === 0 && (
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
                <TableHead className="text-right font-bold">{t.th_supplier_name}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_phone}</TableHead>
                <TableHead className="text-right font-bold">{t.th_address}</TableHead>
                <TableHead className="text-right font-bold">{t.th_notes}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
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
              <p className="text-muted-foreground">{t.no_suppliers_yet}</p>
              <Button onClick={() => setActivePage('add-supplier')} className="mt-4 gradient-warning">{t.add_first_supplier}</Button>
            </div>
          )}
          {suppliers.length > 0 && filteredSuppliers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
