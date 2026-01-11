import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sale, ActivePage } from '@/types';

interface SalesTableProps {
  sales: Sale[];
  setActivePage: (page: ActivePage) => void;
}

export function SalesTable({ sales, setActivePage }: SalesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المبيعات</h1>
          <p className="text-muted-foreground mt-1">سجل عمليات البيع</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-sale')}
          className="gradient-success hover:opacity-90"
        >
          <DollarSign className="w-5 h-5 ml-2" />
          تسجيل بيع
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم البيع</TableHead>
              <TableHead className="text-right font-bold">العميل</TableHead>
              <TableHead className="text-right font-bold">السيارة</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">سعر البيع</TableHead>
              <TableHead className="text-right font-bold">الربح</TableHead>
              <TableHead className="text-right font-bold">تاريخ البيع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{sale.id}</TableCell>
                <TableCell className="font-semibold">{sale.customerName}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{sale.carName}</p>
                    <p className="text-sm text-muted-foreground">{sale.model} - {sale.color}</p>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(sale.purchasePrice)} ريال</TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(sale.salePrice)} ريال</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${sale.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                    <span className={`font-bold ${sale.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(sale.profit)} ريال
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(sale.saleDate)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {sales.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد عمليات بيع حتى الآن</p>
            <Button 
              onClick={() => setActivePage('add-sale')}
              className="mt-4 gradient-success"
            >
              تسجيل أول عملية بيع
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
