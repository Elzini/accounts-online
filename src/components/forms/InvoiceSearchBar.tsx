import { useState, useMemo } from 'react';
import { Search, FileText, User, Truck, Car, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type SearchType = 'invoice' | 'customer' | 'supplier' | 'car';

interface SearchResult {
  id: string;
  type: SearchType;
  label: string;
  sublabel?: string;
  data: any;
}

interface InvoiceSearchBarProps {
  mode: 'sales' | 'purchases';
  sales?: any[];
  purchases?: any[];
  customers?: any[];
  suppliers?: any[];
  onSelectResult: (result: SearchResult) => void;
}

export function InvoiceSearchBar({ 
  mode, 
  sales = [], 
  purchases = [],
  customers = [],
  suppliers = [],
  onSelectResult 
}: InvoiceSearchBarProps) {
  const [searchType, setSearchType] = useState<SearchType>(mode === 'sales' ? 'customer' : 'supplier');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    if (searchType === 'invoice') {
      // Search by invoice number
      if (mode === 'sales') {
        sales.forEach(sale => {
          const invoiceNum = String(sale.sale_number || '');
          if (invoiceNum.includes(query)) {
            results.push({
              id: sale.id,
              type: 'invoice',
              label: `فاتورة رقم ${invoiceNum}`,
              sublabel: sale.customer?.name || 'عميل غير محدد',
              data: sale,
            });
          }
        });
      } else {
        purchases.forEach(car => {
          const invoiceNum = String(car.inventory_number || '');
          if (invoiceNum.includes(query)) {
            results.push({
              id: car.id,
              type: 'invoice',
              label: `فاتورة رقم ${invoiceNum}`,
              sublabel: car.name,
              data: car,
            });
          }
        });
      }
    } else if (searchType === 'customer' && mode === 'sales') {
      // Search by customer name
      customers.forEach(customer => {
        if (customer.name.toLowerCase().includes(query)) {
          const customerSales = sales.filter(s => s.customer_id === customer.id);
          results.push({
            id: customer.id,
            type: 'customer',
            label: customer.name,
            sublabel: `${customerSales.length} فاتورة - ${customer.phone || ''}`,
            data: { customer, sales: customerSales },
          });
        }
      });
    } else if (searchType === 'supplier' && mode === 'purchases') {
      // Search by supplier name
      suppliers.forEach(supplier => {
        if (supplier.name.toLowerCase().includes(query)) {
          const supplierPurchases = purchases.filter(p => p.supplier_id === supplier.id);
          results.push({
            id: supplier.id,
            type: 'supplier',
            label: supplier.name,
            sublabel: `${supplierPurchases.length} سيارة - ${supplier.phone || ''}`,
            data: { supplier, purchases: supplierPurchases },
          });
        }
      });
    } else if (searchType === 'car') {
      // Search by car name or chassis
      if (mode === 'sales') {
        sales.forEach(sale => {
          const carName = (sale.car?.name || '').toLowerCase();
          const chassis = (sale.car?.chassis_number || '').toLowerCase();
          if (carName.includes(query) || chassis.includes(query)) {
            results.push({
              id: sale.id,
              type: 'car',
              label: sale.car?.name || 'سيارة',
              sublabel: `شاسيه: ${sale.car?.chassis_number || '-'}`,
              data: sale,
            });
          }
        });
      } else {
        purchases.forEach(car => {
          const carName = (car.name || '').toLowerCase();
          const chassis = (car.chassis_number || '').toLowerCase();
          if (carName.includes(query) || chassis.includes(query)) {
            results.push({
              id: car.id,
              type: 'car',
              label: car.name,
              sublabel: `شاسيه: ${car.chassis_number}`,
              data: car,
            });
          }
        });
      }
    }

    return results.slice(0, 10);
  }, [searchQuery, searchType, mode, sales, purchases, customers, suppliers]);

  const handleSelect = (result: SearchResult) => {
    onSelectResult(result);
    setSearchQuery('');
    setIsOpen(false);
  };

  const getSearchTypeIcon = (type: SearchType) => {
    switch (type) {
      case 'invoice': return <FileText className="w-4 h-4" />;
      case 'customer': return <User className="w-4 h-4" />;
      case 'supplier': return <Truck className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
    }
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'invoice': return 'ابحث برقم الفاتورة...';
      case 'customer': return 'ابحث باسم العميل...';
      case 'supplier': return 'ابحث باسم المورد...';
      case 'car': return 'ابحث باسم السيارة أو رقم الشاسيه...';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-background rounded-lg border p-1">
        <Select 
          value={searchType} 
          onValueChange={(v) => setSearchType(v as SearchType)}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoice">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                رقم الفاتورة
              </div>
            </SelectItem>
            {mode === 'sales' && (
              <SelectItem value="customer">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  العميل
                </div>
              </SelectItem>
            )}
            {mode === 'purchases' && (
              <SelectItem value="supplier">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" />
                  المورد
                </div>
              </SelectItem>
            )}
            <SelectItem value="car">
              <div className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5" />
                السيارة
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="relative flex-1">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={getSearchPlaceholder()}
            className="h-8 text-sm pr-8 border-0 bg-transparent focus-visible:ring-0"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-right border-b last:border-0"
              onClick={() => handleSelect(result)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {getSearchTypeIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{result.label}</p>
                {result.sublabel && (
                  <p className="text-xs text-muted-foreground truncate">{result.sublabel}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {result.type === 'invoice' ? 'فاتورة' : 
                 result.type === 'customer' ? 'عميل' : 
                 result.type === 'supplier' ? 'مورد' : 'سيارة'}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground text-sm">
          لا توجد نتائج للبحث
        </div>
      )}
    </div>
  );
}
