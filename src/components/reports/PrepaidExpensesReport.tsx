import { useState, useMemo } from 'react';
import { format, addMonths, isBefore, startOfMonth } from 'date-fns';
import { FileText, Printer, Clock, CheckCircle, Play, AlertCircle, Banknote, BarChart3, ChevronDown, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePrepaidExpenses } from '@/hooks/usePrepaidExpenses';
import { useLanguage } from '@/contexts/LanguageContext';

function generateMonthlySchedule(exp: any) {
  if (!exp.start_date || !exp.number_of_months || !exp.monthly_amount) return [];
  const months = [];
  const startDate = new Date(exp.start_date);
  const now = startOfMonth(new Date());
  let balance = exp.total_amount || 0;

  for (let i = 0; i < exp.number_of_months; i++) {
    const monthDate = addMonths(startDate, i);
    const isPast = isBefore(monthDate, addMonths(now, 1));
    const amount = exp.monthly_amount;
    if (isPast) balance -= amount;
    months.push({
      number: i + 1,
      date: monthDate,
      amount,
      balance: isPast ? balance : balance,
      status: isPast ? 'consumed' : 'upcoming',
    });
    if (!isPast) balance -= amount;
  }
  return months;
}

export function PrepaidExpensesReport() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { data: prepaidExpenses = [], isLoading } = usePrepaidExpenses();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredExpenses = useMemo(() => {
    return prepaidExpenses.filter((exp: any) => {
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (searchQuery) {
        return exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [prepaidExpenses, statusFilter, searchQuery]);

  const totalAmount = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.total_amount || 0), 0);
  const totalAmortized = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amortized_amount || 0), 0);
  const totalRemaining = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.remaining_amount || 0), 0);
  const activeCount = filteredExpenses.filter((e: any) => e.status === 'active').length;

  const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Play className="h-3 w-3 me-1" />{isAr ? 'نشط' : 'Active'}</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle className="h-3 w-3 me-1" />{isAr ? 'مكتمل' : 'Completed'}</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 me-1" />{isAr ? 'معلق' : 'Pending'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMonthStatusBadge = (status: string) => {
    if (status === 'consumed') return <Badge className="bg-emerald-500 text-white gap-1"><CheckCircle className="h-3 w-3" />{isAr ? 'مستهلك' : 'Consumed'}</Badge>;
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{isAr ? 'قادم' : 'Upcoming'}</Badge>;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('prepaid-report-print');
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html dir="rtl"><head><title>تقرير المصروفات المقدمة</title>
      <style>
        body{font-family:sans-serif;padding:20px;font-size:11px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:11px}
        th{background:#f0f0f0;font-weight:bold}
        h1{font-size:18px;margin-bottom:4px;text-align:center}
        .main-row{background:#f8f9fa;font-weight:bold}
        .month-row td{font-size:10px;background:#fff}
        .consumed{background:#f0fdf4 !important}
        .total-row{background:#e5e7eb;font-weight:bold}
        .text-green{color:#059669}.text-amber{color:#d97706}.text-red{color:#dc2626}
        .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px}
        .badge-green{background:#d1fae5;color:#065f46}
        .badge-gray{background:#f3f4f6;color:#6b7280}
        @media print{body{padding:10px}table{page-break-inside:auto}tr{page-break-inside:avoid}}
      </style></head><body>`);
    
    win.document.write(`<h1>تقرير المصروفات المقدمة - جدول الاستهلاك الشهري</h1>`);
    win.document.write(`<table>`);
    win.document.write(`<thead><tr>
      <th>#</th><th>الوصف</th><th>التاريخ</th>
      <th>مدين</th><th>دائن</th><th>الرصيد</th><th>الحالة</th>
    </tr></thead><tbody>`);

    filteredExpenses.forEach((exp: any, idx: number) => {
      const schedule = generateMonthlySchedule(exp);
      // Main row
      win!.document.write(`<tr class="main-row">
        <td>${idx + 1}</td>
        <td style="text-align:right">${exp.description || ''}</td>
        <td>${format(new Date(exp.start_date), 'yyyy/MM/dd')}</td>
        <td class="text-green">${formatNumber(exp.total_amount)}</td>
        <td>-</td>
        <td>${formatNumber(exp.total_amount)}</td>
        <td>${exp.status === 'active' ? 'نشط' : exp.status === 'completed' ? 'مكتمل' : 'معلق'}</td>
      </tr>`);
      // Monthly rows
      schedule.forEach((month) => {
        const statusClass = month.status === 'consumed' ? 'consumed' : '';
        const badgeClass = month.status === 'consumed' ? 'badge-green' : 'badge-gray';
        const statusText = month.status === 'consumed' ? 'مستهلك' : 'قادم';
        win!.document.write(`<tr class="month-row ${statusClass}">
          <td>${month.number}</td>
          <td style="text-align:right">الشهر ${month.number}</td>
          <td>${format(month.date, 'yyyy/MM/dd')}</td>
          <td>-</td>
          <td class="text-red">${formatNumber(month.amount)}</td>
          <td class="${Math.max(0, month.balance) <= 0 ? 'text-green' : 'text-amber'}">${formatNumber(Math.max(0, month.balance))}</td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
        </tr>`);
      });
    });

    // Total row
    win.document.write(`<tr class="total-row">
      <td colspan="2" style="text-align:right">الإجمالي</td>
      <td>-</td>
      <td class="text-green">${formatNumber(totalAmount)}</td>
      <td class="text-red">${formatNumber(totalAmortized)}</td>
      <td class="text-amber">${formatNumber(totalRemaining)}</td>
      <td>-</td>
    </tr>`);

    win.document.write(`</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{isAr ? 'تقرير المصروفات المقدمة' : 'Prepaid Expenses Report'}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 me-1" />{isAr ? 'طباعة' : 'Print'}</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'الحالة' : 'Status'}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="active">{isAr ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="completed">{isAr ? 'مكتمل' : 'Completed'}</SelectItem>
                  <SelectItem value="pending">{isAr ? 'معلق' : 'Pending'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'بحث' : 'Search'}</label>
              <Input placeholder={isAr ? 'بحث بالوصف...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Banknote className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المبالغ' : 'Total Amount'}</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatNumber(totalAmount)} {isAr ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'المستهلك' : 'Amortized'}</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(totalAmortized)} {isAr ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'المتبقي' : 'Remaining'}</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatNumber(totalRemaining)} {isAr ? 'ر.س' : 'SAR'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isAr ? 'نشط' : 'Active'}</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div id="prepaid-report-print">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-10"></TableHead>
                  <TableHead className="text-center w-12">#</TableHead>
                  <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'مدين' : 'Debit'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'دائن' : 'Credit'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'الرصيد' : 'Balance'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'نسبة الاستهلاك' : 'Progress'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'الحالة' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isAr ? 'لا توجد مصروفات مقدمة' : 'No prepaid expenses'}</TableCell></TableRow>
                ) : (
                  filteredExpenses.map((exp: any, idx: number) => {
                    const progress = exp.total_amount > 0 ? (exp.amortized_amount / exp.total_amount) * 100 : 0;
                    const isExpanded = expandedRows.has(exp.id);
                    const schedule = isExpanded ? generateMonthlySchedule(exp) : [];
                    return (
                      <>
                        <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50 bg-primary/5 font-semibold" onClick={() => toggleRow(exp.id)}>
                          <TableCell className="text-center">
                            {isExpanded 
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
                              : <ChevronLeft className="h-4 w-4 text-muted-foreground mx-auto" />
                            }
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-bold">{exp.description}</TableCell>
                          <TableCell className="text-center">{format(new Date(exp.start_date), 'yyyy/MM/dd')}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-bold">{formatNumber(exp.total_amount)}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center font-bold">{formatNumber(exp.total_amount)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-10">{progress.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(exp.status)}</TableCell>
                        </TableRow>
                        {isExpanded && schedule.map((month) => (
                          <TableRow key={`${exp.id}-m-${month.number}`} className={month.status === 'consumed' ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-muted/20'}>
                            <TableCell></TableCell>
                            <TableCell className="text-center text-muted-foreground text-xs">{month.number}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{isAr ? `الشهر ${month.number}` : `Month ${month.number}`}</TableCell>
                            <TableCell className="text-center text-sm">{format(month.date, 'yyyy/MM/dd')}</TableCell>
                            <TableCell className="text-center text-sm">-</TableCell>
                            <TableCell className="text-center text-sm text-red-600 font-medium">{formatNumber(month.amount)}</TableCell>
                            <TableCell className="text-center text-sm font-semibold">
                              <span className={Math.max(0, month.balance) <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                {formatNumber(Math.max(0, month.balance))}
                              </span>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center">{getMonthStatusBadge(month.status)}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })
                )}
                {filteredExpenses.length > 0 && (
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell></TableCell>
                    <TableCell colSpan={3} className="text-start">{isAr ? 'الإجمالي' : 'Total'}</TableCell>
                    <TableCell className="text-center text-emerald-700">{formatNumber(totalAmount)}</TableCell>
                    <TableCell className="text-center text-red-700">{formatNumber(totalAmortized)}</TableCell>
                    <TableCell className="text-center text-amber-700">{formatNumber(totalRemaining)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
