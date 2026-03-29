import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertTriangle, Printer, Search, Package } from 'lucide-react';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useCars } from '@/hooks/useCarDatabase';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { fetchWarehouseCarInventory, WarehouseCarEntry } from '@/services/carDealership/warehouseInventory';

type ReconciliationStatus = 'matched' | 'missing_from_warehouse' | 'extra_in_warehouse';

interface ReconciliationRow {
  chassis_number: string;
  status: ReconciliationStatus;
  // from cars table
  inv_name?: string;
  inv_model?: string;
  inv_status?: string;
  inv_price?: number;
  // from warehouse
  wh_car_type?: string;
  wh_car_color?: string;
  wh_entry_date?: string;
  wh_exit_date?: string | null;
  wh_price?: number | null;
}

export function WarehouseReconciliation() {
  const companyId = useCompanyId();
  const { data: cars = [] } = useCars();
  const { data: warehouseEntries = [], isLoading } = useQuery({
    queryKey: ['warehouse-car-inventory', companyId],
    queryFn: () => fetchWarehouseCarInventory(companyId!),
    enabled: !!companyId,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { printReport } = usePrintReport();

  const reconciliation = useMemo(() => {
    const warehouseMap = new Map<string, WarehouseCarEntry>();
    // Only compare warehouse cars still in stock (no exit_date)
    const inStockWarehouse = warehouseEntries.filter(e => !e.exit_date);
    inStockWarehouse.forEach(e => warehouseMap.set(e.chassis_number.trim().toUpperCase(), e));

    // Only compare available cars (exclude sold/transferred)
    const availableCars = cars.filter(c => c.status === 'available');

    const rows: ReconciliationRow[] = [];
    const processed = new Set<string>();

    // Cars in inventory (available only)
    availableCars.forEach(car => {
      const key = car.chassis_number.trim().toUpperCase();
      if (processed.has(key)) return;
      processed.add(key);

      const wh = warehouseMap.get(key);
      rows.push({
        chassis_number: car.chassis_number,
        status: wh ? 'matched' : 'missing_from_warehouse',
        inv_name: car.name,
        inv_model: car.model || undefined,
        inv_status: car.status,
        inv_price: Number(car.purchase_price),
        wh_car_type: wh?.car_type,
        wh_car_color: wh?.car_color || undefined,
        wh_entry_date: wh?.entry_date,
        wh_exit_date: wh?.exit_date,
        wh_price: wh?.price,
      });
    });

    // Extra in warehouse (not in cars table)
    inStockWarehouse.forEach(wh => {
      const key = wh.chassis_number.trim().toUpperCase();
      if (processed.has(key)) return;
      processed.add(key);

      rows.push({
        chassis_number: wh.chassis_number,
        status: 'extra_in_warehouse',
        wh_car_type: wh.car_type,
        wh_car_color: wh.car_color || undefined,
        wh_entry_date: wh.entry_date,
        wh_exit_date: wh.exit_date,
        wh_price: wh.price,
      });
    });

    return rows;
  }, [cars, warehouseEntries]);

  const filtered = useMemo(() => {
    return reconciliation.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = r.chassis_number.toLowerCase().includes(q) ||
          r.inv_name?.toLowerCase().includes(q) ||
          r.wh_car_type?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reconciliation, statusFilter, searchQuery]);

  const matched = reconciliation.filter(r => r.status === 'matched').length;
  const missing = reconciliation.filter(r => r.status === 'missing_from_warehouse').length;
  const extra = reconciliation.filter(r => r.status === 'extra_in_warehouse').length;

  const statusLabel = (s: ReconciliationStatus) => {
    if (s === 'matched') return 'مطابق';
    if (s === 'missing_from_warehouse') return 'غير موجود بالمستودع';
    return 'زائد بالمستودع';
  };

  const statusVariant = (s: ReconciliationStatus) => {
    if (s === 'matched') return 'default';
    if (s === 'missing_from_warehouse') return 'destructive';
    return 'secondary';
  };

  const fmtCur = (v?: number | null) => v ? new Intl.NumberFormat('en-SA').format(v) : '-';

  function handlePrint() {
    printReport({
      title: 'تقرير مطابقة المخزون مع المستودع',
      subtitle: `مطابق: ${matched} | غير موجود بالمستودع: ${missing} | زائد بالمستودع: ${extra}`,
      columns: [
        { header: '#', key: 'index' },
        { header: 'رقم الهيكل', key: 'chassis_number' },
        { header: 'اسم السيارة (المخزون)', key: 'inv_name' },
        { header: 'نوع السيارة (المستودع)', key: 'wh_car_type' },
        { header: 'سعر المخزون', key: 'inv_price' },
        { header: 'سعر المستودع', key: 'wh_price' },
        { header: 'الحالة', key: 'status' },
      ],
      data: filtered.map((r, i) => ({
        index: i + 1,
        chassis_number: r.chassis_number,
        inv_name: r.inv_name || '-',
        wh_car_type: r.wh_car_type || '-',
        inv_price: fmtCur(r.inv_price),
        wh_price: fmtCur(r.wh_price),
        status: statusLabel(r.status),
      })),
      summaryCards: [
        { label: 'إجمالي السجلات', value: String(reconciliation.length) },
        { label: 'مطابق', value: String(matched) },
        { label: 'غير موجود بالمستودع', value: String(missing) },
        { label: 'زائد بالمستودع', value: String(extra) },
      ],
    });
  }

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">تقرير مطابقة المخزون مع المستودع</h2>
          <p className="text-sm text-muted-foreground">مقارنة سيارات المخزون الرئيسي مع جرد المستودع الفعلي</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث برقم الهيكل أو الاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 w-[220px]" />
          </div>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="matched">مطابق</option>
            <option value="missing_from_warehouse">غير موجود بالمستودع</option>
            <option value="extra_in_warehouse">زائد بالمستودع</option>
          </select>
          <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />طباعة التقرير</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{reconciliation.length}</div><p className="text-sm text-muted-foreground">إجمالي السجلات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold text-green-600">{matched}</div><p className="text-sm text-muted-foreground">مطابق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold text-destructive">{missing}</div><p className="text-sm text-muted-foreground">غير موجود بالمستودع</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" /><div className="text-2xl font-bold text-orange-500">{extra}</div><p className="text-sm text-muted-foreground">زائد بالمستودع</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card><CardContent className="pt-6">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">لا توجد نتائج</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">#</TableHead>
                  <TableHead className="text-right font-bold">رقم الهيكل</TableHead>
                  <TableHead className="text-right font-bold">اسم السيارة (المخزون)</TableHead>
                  <TableHead className="text-right font-bold">الموديل</TableHead>
                  <TableHead className="text-right font-bold">نوع السيارة (المستودع)</TableHead>
                  <TableHead className="text-right font-bold">اللون</TableHead>
                  <TableHead className="text-right font-bold">سعر المخزون</TableHead>
                  <TableHead className="text-right font-bold">سعر المستودع</TableHead>
                  <TableHead className="text-right font-bold">حالة المخزون</TableHead>
                  <TableHead className="text-right font-bold">حالة المطابقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={r.chassis_number + i} className={
                    r.status === 'missing_from_warehouse' ? 'bg-destructive/5' :
                    r.status === 'extra_in_warehouse' ? 'bg-orange-500/5' : ''
                  }>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{r.chassis_number}</TableCell>
                    <TableCell className="font-medium">{r.inv_name || '-'}</TableCell>
                    <TableCell>{r.inv_model || '-'}</TableCell>
                    <TableCell>{r.wh_car_type || '-'}</TableCell>
                    <TableCell>{r.wh_car_color || '-'}</TableCell>
                    <TableCell>{fmtCur(r.inv_price)}</TableCell>
                    <TableCell>{fmtCur(r.wh_price)}</TableCell>
                    <TableCell>
                      {r.inv_status ? (
                        <Badge variant={r.inv_status === 'available' ? 'default' : 'secondary'}>
                          {r.inv_status === 'available' ? 'متاحة' : r.inv_status === 'sold' ? 'مباعة' : 'محولة'}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status) as any}>
                        {statusLabel(r.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
