import { useMemo, forwardRef } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSales } from '@/hooks/useDatabase';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { supabase } from '@/integrations/supabase/client';
import { ActivePage } from '@/types';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

interface RecentInvoicesCardProps {
  setActivePage: (page: ActivePage) => void;
}

type DashboardInvoiceRow = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  date: string;
  total: number;
  status: string;
  targetPage: ActivePage;
};

export const RecentInvoicesCard = forwardRef<HTMLDivElement, RecentInvoicesCardProps>(function RecentInvoicesCard({ setActivePage }, ref) {
  const { companyId, company } = useCompany();
  const isCarDealership = company?.company_type === 'car_dealership';
  const { selectedFiscalYear } = useFiscalYear();
  const { data: sales = [] } = useSales();
  // For non-car companies, sales hook returns data but we ignore it
  const { data: invoices = [] } = useQuery({
    queryKey: ['dashboard-recent-invoices', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from('invoices')
        .select('id, invoice_number, invoice_type, invoice_date, total, payment_status, customer_name, supplier:suppliers!invoices_supplier_id_fkey(name)')
        .eq('company_id', companyId!)
        .in('invoice_type', ['sales', 'purchase'])
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (selectedFiscalYear) {
        query = query.eq('fiscal_year_id', selectedFiscalYear.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
  });

  const recentInvoices = useMemo<DashboardInvoiceRow[]>(() => {
    if (isCarDealership) {
      return [...sales]
        .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
        .slice(0, 5)
        .map((sale: any) => ({
          id: sale.id,
          invoiceNumber: `#${sale.id.slice(0, 6)}`,
          partyName: sale.customer?.name || 'عميل غير محدد',
          date: sale.sale_date,
          total: Number(sale.sale_price || 0),
          status: 'paid',
          targetPage: 'sales',
        }));
    }

    return invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number || `#${invoice.id.slice(0, 6)}`,
      partyName: invoice.invoice_type === 'purchase'
        ? (invoice.supplier?.name || invoice.customer_name || 'مورد غير محدد')
        : (invoice.customer_name || 'عميل غير محدد'),
      date: invoice.invoice_date,
      total: Number(invoice.total || 0),
      status: invoice.payment_status || 'unpaid',
      targetPage: invoice.invoice_type === 'purchase' ? 'purchases' : 'sales',
    }));
  }, [isCarDealership, sales, invoices]);

  const formatCurrency = (value: number) => {
    return `${Math.round(value)} ر.س`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">مدفوع</Badge>;
    }
    if (status === 'partial') {
      return <Badge variant="outline">جزئي</Badge>;
    }
    return <Badge variant="outline">غير مدفوع</Badge>;
  };

  const allInvoicesPage: ActivePage = isCarDealership ? 'sales' : 'purchases';

  return (
    <Card className="relative overflow-hidden border-border/60">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: 'hsl(217 91% 60%)' }} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(217 91% 60% / 0.12)' }}>
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'hsl(217 91% 60%)' }} />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">أحدث الفواتير</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">آخر الفواتير المسجلة</p>
          </div>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => setActivePage(allInvoicesPage)}
          className="text-primary gap-1"
        >
          عرض الكل
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p>لا توجد فواتير في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">رقم الفاتورة</TableHead>
                  <TableHead className="text-right font-semibold">الطرف</TableHead>
                  <TableHead className="text-right font-semibold">التاريخ</TableHead>
                  <TableHead className="text-right font-semibold">الإجمالي</TableHead>
                  <TableHead className="text-right font-semibold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setActivePage(invoice.targetPage)}
                  >
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.partyName}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
