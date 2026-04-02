import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Printer, FileSpreadsheet } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { fetchWarehouseCarInventory } from '@/services/carDealership/warehouseInventory';
import { usePrintReport } from '@/hooks/usePrintReport';
import { toast } from 'sonner';

function getBuyerName(notes: string | null): string {
  const match = notes?.match(/المشتري:\s*(.+?)(?:\s*\||$)/);
  return match ? match[1].trim() : '-';
}

export function WarehouseDailyReport() {
  const companyId = useCompanyId();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { printReport } = usePrintReport();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['warehouse-car-inventory', companyId],
    queryFn: () => fetchWarehouseCarInventory(companyId!),
    enabled: !!companyId,
  });

  const { enteredToday, exitedToday } = useMemo(() => {
    const entered = entries.filter(e => e.entry_date === selectedDate);
    const exited = entries.filter(e => e.exit_date === selectedDate);
    return { enteredToday: entered, exitedToday: exited };
  }, [entries, selectedDate]);

  const dateLabel = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return isValid(d) ? format(d, 'EEEE، d MMMM yyyy', { locale: ar }) : selectedDate;
    } catch { return selectedDate; }
  }, [selectedDate]);

  async function handleExportExcel() {
    const { createSimpleExcel, downloadExcelBuffer } = await import('@/lib/excelUtils');
    const rows: any[][] = [
      ['التقرير اليومي - ' + dateLabel],
      [],
      ['السيارات التي دخلت المستودع'],
      ['#', 'نوع السيارة', 'اللون', 'رقم الهيكل', 'المكان'],
      ...enteredToday.map((e, i) => [
        i + 1, e.car_type, e.car_color || '-', e.chassis_number,
        e.location === 'warehouse' || !e.location ? 'المستودع' : e.location,
      ]),
      [],
      ['السيارات التي خرجت من المستودع'],
      ['#', 'نوع السيارة', 'اللون', 'رقم الهيكل', 'اسم المشتري'],
      ...exitedToday.map((e, i) => [
        i + 1, e.car_type, e.car_color || '-', e.chassis_number, getBuyerName(e.notes),
      ]),
    ];
    const buffer = await createSimpleExcel('التقرير اليومي', rows, { rtl: true, columnWidths: [6, 20, 12, 25, 20] });
    downloadExcelBuffer(buffer, `تقرير_يومي_${selectedDate}.xlsx`);
    toast.success('تم تصدير التقرير');
  }

  function handlePrint() {
    const allData = [
      ...enteredToday.map((e, i) => ({
        index: i + 1, car_type: e.car_type, car_color: e.car_color || '-',
        chassis_number: e.chassis_number, date: e.entry_date,
        location: e.location === 'warehouse' || !e.location ? 'المستودع' : e.location,
        buyer: '-', type: 'دخول',
      })),
      ...exitedToday.map((e, i) => ({
        index: enteredToday.length + i + 1, car_type: e.car_type, car_color: e.car_color || '-',
        chassis_number: e.chassis_number, date: e.exit_date || '-',
        location: e.location === 'warehouse' || !e.location ? 'المستودع' : e.location,
        buyer: getBuyerName(e.notes), type: 'خروج',
      })),
    ];
    printReport({
      title: `التقرير اليومي للمستودع - ${dateLabel}`,
      subtitle: `دخول: ${enteredToday.length} سيارة | خروج: ${exitedToday.length} سيارة`,
      columns: [
        { header: '#', key: 'index' },
        { header: 'الحركة', key: 'type' },
        { header: 'نوع السيارة', key: 'car_type' },
        { header: 'اللون', key: 'car_color' },
        { header: 'رقم الهيكل', key: 'chassis_number' },
        { header: 'المكان', key: 'location' },
        { header: 'المشتري', key: 'buyer' },
      ],
      data: allData,
      summaryCards: [
        { label: 'دخول', value: String(enteredToday.length) },
        { label: 'خروج', value: String(exitedToday.length) },
      ],
    });
  }

  return (
    <div className="space-y-6">
      {/* Date picker + actions */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-sm font-medium">اختر التاريخ</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
        </div>
        <p className="text-sm text-muted-foreground pb-2">{dateLabel}</p>
        <div className="flex gap-2 mr-auto">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExportExcel} disabled={enteredToday.length === 0 && exitedToday.length === 0}>
            <FileSpreadsheet className="w-4 h-4" />Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint} disabled={enteredToday.length === 0 && exitedToday.length === 0}>
            <Printer className="w-4 h-4" />طباعة
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <ArrowDownCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{enteredToday.length}</div>
            <p className="text-sm text-muted-foreground">دخلت المستودع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ArrowUpCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <div className="text-2xl font-bold">{exitedToday.length}</div>
            <p className="text-sm text-muted-foreground">خرجت من المستودع</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
      ) : (
        <>
          {/* Entered cars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-green-500" />
                السيارات التي دخلت المستودع ({enteredToday.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enteredToday.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">لا توجد سيارات دخلت في هذا اليوم</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>نوع السيارة</TableHead>
                      <TableHead>اللون</TableHead>
                      <TableHead>رقم الهيكل</TableHead>
                      <TableHead>المكان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enteredToday.map((e, i) => (
                      <TableRow key={e.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{e.car_type}</TableCell>
                        <TableCell>{e.car_color || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{e.chassis_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.location === 'warehouse' || !e.location ? 'المستودع' : e.location}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Exited cars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-destructive" />
                السيارات التي خرجت من المستودع ({exitedToday.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exitedToday.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">لا توجد سيارات خرجت في هذا اليوم</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>نوع السيارة</TableHead>
                      <TableHead>اللون</TableHead>
                      <TableHead>رقم الهيكل</TableHead>
                      <TableHead>المكان</TableHead>
                      <TableHead>اسم المشتري</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exitedToday.map((e, i) => (
                      <TableRow key={e.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{e.car_type}</TableCell>
                        <TableCell>{e.car_color || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{e.chassis_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.location === 'warehouse' || !e.location ? 'المستودع' : e.location}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{getBuyerName(e.notes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
