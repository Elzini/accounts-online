import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Users,
  Car,
  DollarSign,
  ShoppingCart,
  FileText,
  Package,
  Printer,
  Download,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyFullStats {
  company_id: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
  users_count: number;
  cars_count: number;
  available_cars: number;
  sold_cars: number;
  sales_count: number;
  total_sales: number;
  total_profit: number;
  customers_count: number;
  suppliers_count: number;
  quotations_count: number;
  expenses_total: number;
  vouchers_count: number;
  journal_entries_count: number;
}

export function CompaniesReport() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['companies-full-report'],
    queryFn: async () => {
      // Get all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true });

      if (companiesError) throw companiesError;

      const stats: CompanyFullStats[] = [];

      for (const company of companies || []) {
        const [
          usersRes,
          carsRes,
          availableCarsRes,
          soldCarsRes,
          salesRes,
          customersRes,
          suppliersRes,
          quotationsRes,
          expensesRes,
          vouchersRes,
          journalRes
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'available'),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'sold'),
          supabase.from('sales').select('sale_price, profit').eq('company_id', company.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('expenses').select('amount').eq('company_id', company.id),
          supabase.from('vouchers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        ]);

        const salesData = salesRes.data || [];
        const expensesData = expensesRes.data || [];

        stats.push({
          company_id: company.id,
          company_name: company.name,
          is_active: company.is_active,
          created_at: company.created_at,
          users_count: usersRes.count || 0,
          cars_count: carsRes.count || 0,
          available_cars: availableCarsRes.count || 0,
          sold_cars: soldCarsRes.count || 0,
          sales_count: salesData.length,
          total_sales: salesData.reduce((sum, s) => sum + (s.sale_price || 0), 0),
          total_profit: salesData.reduce((sum, s) => sum + (s.profit || 0), 0),
          customers_count: customersRes.count || 0,
          suppliers_count: suppliersRes.count || 0,
          quotations_count: quotationsRes.count || 0,
          expenses_total: expensesData.reduce((sum, e) => sum + (e.amount || 0), 0),
          vouchers_count: vouchersRes.count || 0,
          journal_entries_count: journalRes.count || 0,
        });
      }

      return stats;
    },
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totals = report?.reduce(
    (acc, r) => ({
      users: acc.users + r.users_count,
      cars: acc.cars + r.cars_count,
      available: acc.available + r.available_cars,
      sold: acc.sold + r.sold_cars,
      sales: acc.sales + r.sales_count,
      salesTotal: acc.salesTotal + r.total_sales,
      profit: acc.profit + r.total_profit,
      customers: acc.customers + r.customers_count,
      suppliers: acc.suppliers + r.suppliers_count,
      quotations: acc.quotations + r.quotations_count,
      expenses: acc.expenses + r.expenses_total,
      vouchers: acc.vouchers + r.vouchers_count,
      journals: acc.journals + r.journal_entries_count,
    }),
    {
      users: 0,
      cars: 0,
      available: 0,
      sold: 0,
      sales: 0,
      salesTotal: 0,
      profit: 0,
      customers: 0,
      suppliers: 0,
      quotations: 0,
      expenses: 0,
      vouchers: 0,
      journals: 0,
    }
  ) || {
    users: 0,
    cars: 0,
    available: 0,
    sold: 0,
    sales: 0,
    salesTotal: 0,
    profit: 0,
    customers: 0,
    suppliers: 0,
    quotations: 0,
    expenses: 0,
    vouchers: 0,
    journals: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            تقرير شامل للشركات
          </h2>
          <p className="text-muted-foreground mt-1">
            إحصائيات تفصيلية لجميع الشركات في النظام
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          طباعة التقرير
        </Button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">تقرير شامل للشركات</h1>
        <p className="text-sm text-muted-foreground">
          تاريخ التقرير: {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 print:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              الشركات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{report?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(totals.users)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Car className="w-3 h-3" />
              السيارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(totals.cars)}</div>
            <div className="text-[10px] text-muted-foreground">
              {totals.available} متاح | {totals.sold} مباع
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(totals.sales)}</div>
            <div className="text-[10px] text-muted-foreground">{formatCurrency(totals.salesTotal)}</div>
          </CardContent>
        </Card>

        <Card className="bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              إجمالي الأرباح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">{formatCurrency(totals.profit)}</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-destructive flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              إجمالي المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatCurrency(totals.expenses)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل الشركات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold text-xs">#</TableHead>
                  <TableHead className="text-right font-bold text-xs">الشركة</TableHead>
                  <TableHead className="text-center font-bold text-xs">الحالة</TableHead>
                  <TableHead className="text-center font-bold text-xs">المستخدمين</TableHead>
                  <TableHead className="text-center font-bold text-xs">السيارات</TableHead>
                  <TableHead className="text-center font-bold text-xs">المتاح</TableHead>
                  <TableHead className="text-center font-bold text-xs">المباع</TableHead>
                  <TableHead className="text-center font-bold text-xs">العملاء</TableHead>
                  <TableHead className="text-center font-bold text-xs">الموردين</TableHead>
                  <TableHead className="text-center font-bold text-xs">المبيعات</TableHead>
                  <TableHead className="text-center font-bold text-xs">إجمالي المبيعات</TableHead>
                  <TableHead className="text-center font-bold text-xs">الأرباح</TableHead>
                  <TableHead className="text-center font-bold text-xs">المصروفات</TableHead>
                  <TableHead className="text-center font-bold text-xs">العروض</TableHead>
                  <TableHead className="text-center font-bold text-xs">السندات</TableHead>
                  <TableHead className="text-center font-bold text-xs">القيود</TableHead>
                  <TableHead className="text-right font-bold text-xs">تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.map((company, index) => (
                  <TableRow key={company.company_id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-xs">{index + 1}</TableCell>
                    <TableCell className="text-xs font-semibold">{company.company_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={company.is_active ? 'default' : 'secondary'}
                        className={company.is_active ? 'bg-success/10 text-success text-[10px]' : 'text-[10px]'}
                      >
                        {company.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs">{company.users_count}</TableCell>
                    <TableCell className="text-center text-xs">{company.cars_count}</TableCell>
                    <TableCell className="text-center text-xs text-success">{company.available_cars}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{company.sold_cars}</TableCell>
                    <TableCell className="text-center text-xs">{company.customers_count}</TableCell>
                    <TableCell className="text-center text-xs">{company.suppliers_count}</TableCell>
                    <TableCell className="text-center text-xs">{company.sales_count}</TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      {formatCurrency(company.total_sales)}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium text-success">
                      {formatCurrency(company.total_profit)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-destructive">
                      {formatCurrency(company.expenses_total)}
                    </TableCell>
                    <TableCell className="text-center text-xs">{company.quotations_count}</TableCell>
                    <TableCell className="text-center text-xs">{company.vouchers_count}</TableCell>
                    <TableCell className="text-center text-xs">{company.journal_entries_count}</TableCell>
                    <TableCell className="text-xs">{formatDate(company.created_at)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/80 font-bold">
                  <TableCell className="text-xs" colSpan={2}>الإجمالي</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center text-xs">{totals.users}</TableCell>
                  <TableCell className="text-center text-xs">{totals.cars}</TableCell>
                  <TableCell className="text-center text-xs text-success">{totals.available}</TableCell>
                  <TableCell className="text-center text-xs">{totals.sold}</TableCell>
                  <TableCell className="text-center text-xs">{totals.customers}</TableCell>
                  <TableCell className="text-center text-xs">{totals.suppliers}</TableCell>
                  <TableCell className="text-center text-xs">{totals.sales}</TableCell>
                  <TableCell className="text-center text-xs">{formatCurrency(totals.salesTotal)}</TableCell>
                  <TableCell className="text-center text-xs text-success">{formatCurrency(totals.profit)}</TableCell>
                  <TableCell className="text-center text-xs text-destructive">{formatCurrency(totals.expenses)}</TableCell>
                  <TableCell className="text-center text-xs">{totals.quotations}</TableCell>
                  <TableCell className="text-center text-xs">{totals.vouchers}</TableCell>
                  <TableCell className="text-center text-xs">{totals.journals}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">صافي الربح (الأرباح - المصروفات)</p>
              <p className={`text-3xl font-bold ${totals.profit - totals.expenses >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totals.profit - totals.expenses)}
              </p>
            </div>
            <div className="text-6xl opacity-10">
              {totals.profit - totals.expenses >= 0 ? <TrendingUp /> : <Wallet />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
