import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Users, Truck, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useLanguage } from '@/contexts/LanguageContext';

interface AgingEntry {
  id: string;
  name: string;
  phone: string;
  total: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
}

export function AgingReportPage() {
  const { t, language, direction } = useLanguage();
  const [tab, setTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');
  const companyId = useCompanyId();
  const { selectedFiscalYear } = useFiscalYear();
  const { exportToExcel } = useExcelExport();

  const { data: customerAging = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customer-aging', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data: sales } = await supabase
        .from('sales' as any)
        .select(`
          id, sale_date, sale_price, due_date, payment_status,
          customers!inner(id, name, phone)
        `)
        .eq('company_id', companyId)
        .or('payment_status.eq.deferred,payment_status.eq.pending');

      if (!sales?.length) return [];

      const now = new Date();
      const grouped: Record<string, AgingEntry> = {};

      for (const sale of (sales as any[])) {
        const customer = sale.customers;
        if (!customer) continue;

        const key = customer.id;
        if (!grouped[key]) {
          grouped[key] = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || '',
            total: 0, current: 0, days30: 0, days60: 0, days90: 0, over90: 0
          };
        }

        const dueDate = new Date(sale.due_date || sale.sale_date);
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(sale.sale_price) || 0;

        grouped[key].total += amount;
        if (daysDiff <= 0) grouped[key].current += amount;
        else if (daysDiff <= 30) grouped[key].days30 += amount;
        else if (daysDiff <= 60) grouped[key].days60 += amount;
        else if (daysDiff <= 90) grouped[key].days90 += amount;
        else grouped[key].over90 += amount;
      }

      return Object.values(grouped);
    },
    enabled: !!companyId,
  });

  const { data: supplierAging = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['supplier-aging', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!companyId) return [];
      // Simplified: return empty for now until we have proper payables tracking
      return [];
    },
    enabled: !!companyId,
  });

  const data = tab === 'customers' ? customerAging : supplierAging;
  const isLoading = tab === 'customers' ? loadingCustomers : loadingSuppliers;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(e => e.name.toLowerCase().includes(q) || e.phone.includes(q));
  }, [data, search]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, e) => ({
      total: acc.total + e.total,
      current: acc.current + e.current,
      days30: acc.days30 + e.days30,
      days60: acc.days60 + e.days60,
      days90: acc.days90 + e.days90,
      over90: acc.over90 + e.over90,
    }), { total: 0, current: 0, days30: 0, days60: 0, days90: 0, over90: 0 });
  }, [filtered]);

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExport = () => {
    const columns = [
      { header: t.aging_col_name, key: 'name' },
      { header: t.aging_col_phone, key: 'phone' },
      { header: t.aging_total, key: 'total' },
      { header: t.aging_current, key: 'current' },
      { header: t.aging_days_1_30, key: 'days30' },
      { header: t.aging_days_31_60, key: 'days60' },
      { header: t.aging_days_61_90, key: 'days90' },
      { header: t.aging_over_90, key: 'over90' },
    ];
    exportToExcel({
      title: `${t.aging_title} - ${tab === 'customers' ? t.aging_customers : t.aging_suppliers}`,
      columns,
      data: filtered,
      fileName: `aging-report-${tab}`,
    });
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.aging_title}</h1>
          <p className="text-muted-foreground">{t.aging_subtitle}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 ml-2" />
          {t.aging_export}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_total}</p>
            <p className="text-lg font-bold">{fmt(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_current}</p>
            <p className="text-lg font-bold text-green-600">{fmt(totals.current)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_days_1_30}</p>
            <p className="text-lg font-bold text-yellow-600">{fmt(totals.days30)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_days_31_60}</p>
            <p className="text-lg font-bold text-orange-600">{fmt(totals.days60)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_days_61_90}</p>
            <p className="text-lg font-bold text-red-500">{fmt(totals.days90)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t.aging_over_90}</p>
            <p className="text-lg font-bold text-red-700">{fmt(totals.over90)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" /> {t.aging_customers}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Truck className="w-4 h-4" /> {t.aging_suppliers}
            </TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.aging_search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">{t.aging_col_name}</TableHead>
                    <TableHead className="text-right">{t.aging_col_phone}</TableHead>
                    <TableHead className="text-right">{t.aging_total}</TableHead>
                    <TableHead className="text-right">{t.aging_current}</TableHead>
                    <TableHead className="text-right">{t.aging_days_1_30}</TableHead>
                    <TableHead className="text-right">{t.aging_days_31_60}</TableHead>
                    <TableHead className="text-right">{t.aging_days_61_90}</TableHead>
                    <TableHead className="text-right">{t.aging_over_90}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {t.aging_loading}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {t.aging_no_data}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filtered.map((entry, i) => (
                        <TableRow key={entry.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell dir="ltr" className="text-right">{entry.phone}</TableCell>
                          <TableCell className="font-bold">{fmt(entry.total)}</TableCell>
                          <TableCell className="text-green-600">{fmt(entry.current)}</TableCell>
                          <TableCell className="text-yellow-600">{fmt(entry.days30)}</TableCell>
                          <TableCell className="text-orange-600">{fmt(entry.days60)}</TableCell>
                          <TableCell className="text-red-500">{fmt(entry.days90)}</TableCell>
                          <TableCell>
                            {entry.over90 > 0 ? (
                              <Badge variant="destructive">{fmt(entry.over90)}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0.00</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>{t.aging_total}</TableCell>
                        <TableCell>{fmt(totals.total)}</TableCell>
                        <TableCell className="text-green-600">{fmt(totals.current)}</TableCell>
                        <TableCell className="text-yellow-600">{fmt(totals.days30)}</TableCell>
                        <TableCell className="text-orange-600">{fmt(totals.days60)}</TableCell>
                        <TableCell className="text-red-500">{fmt(totals.days90)}</TableCell>
                        <TableCell className="text-red-700">{fmt(totals.over90)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}