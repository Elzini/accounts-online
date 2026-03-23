import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ReturnItem } from '../hooks/useSalesReturns';

interface Props {
  items: ReturnItem[];
  language: string;
  formatCurrency: (v: number) => string;
  updateItem: (index: number, field: keyof ReturnItem, value: string | number) => void;
}

export function ReturnItemsTable({ items, language, formatCurrency, updateItem }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border-b-2 border-rose-200 dark:border-rose-800">
            <TableHead className="text-right text-[11px] font-bold w-8 text-rose-700 dark:text-rose-400">#</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[120px] text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
            <TableHead className="text-right text-[11px] font-bold min-w-[160px] text-rose-700 dark:text-rose-400">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'صادرة' : 'Issued'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'مرتجعة' : 'Returned'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-16 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-14 text-rose-700 dark:text-rose-400">% {language === 'ar' ? 'خصم' : 'Disc'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الخصم' : 'Discount'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الصافي' : 'Net'}</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">VAT</TableHead>
            <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الإجمالي' : 'Grand'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border-b transition-colors">
              <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{idx + 1}</TableCell>
              <TableCell className="text-xs py-2 font-medium">{item.description.split(' - ')[0]}</TableCell>
              <TableCell className="text-xs py-2 text-muted-foreground">{item.description}</TableCell>
              <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
              <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
              <TableCell className="py-1">
                <Input type="number" className="h-7 text-xs w-16 text-center border-0 border-b border-border rounded-none bg-transparent" value={item.returnedQty || ''} onChange={e => updateItem(idx, 'returnedQty', Math.min(Number(e.target.value), item.quantity))} max={item.quantity} min={0} />
              </TableCell>
              <TableCell className="text-center text-xs py-2">{item.unit}</TableCell>
              <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.total)}</TableCell>
              <TableCell className="py-1">
                <Input type="number" className="h-7 text-xs w-14 text-center border-0 border-b border-border rounded-none bg-transparent" value={item.discountPercent || ''} onChange={e => updateItem(idx, 'discountPercent', Number(e.target.value))} min={0} max={100} />
              </TableCell>
              <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.discount)}</TableCell>
              <TableCell className="text-center text-xs py-2 font-mono font-semibold">{formatCurrency(item.net)}</TableCell>
              <TableCell className="text-center text-xs py-2 font-mono text-warning">{formatCurrency(item.vat)}</TableCell>
              <TableCell className="text-center text-xs py-2 font-mono font-bold">{formatCurrency(item.grandTotal)}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={14} className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 text-muted-foreground/30" />
                  <span className="text-sm">{language === 'ar' ? 'أدخل رقم فاتورة البيع للبحث عنها' : 'Enter sale invoice number to search'}</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
