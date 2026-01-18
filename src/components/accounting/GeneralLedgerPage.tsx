import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { Loader2, BookOpen, CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function GeneralLedgerPage() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const { data: ledger, isLoading: isLoadingLedger } = useGeneralLedger(
    selectedAccountId,
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  const getReferenceTypeBadge = (type: string | null) => {
    switch (type) {
      case 'sale':
        return <Badge variant="default" className="bg-green-500">مبيعات</Badge>;
      case 'purchase':
        return <Badge variant="default" className="bg-blue-500">مشتريات</Badge>;
      case 'manual':
        return <Badge variant="secondary">يدوي</Badge>;
      default:
        return <Badge variant="outline">عام</Badge>;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assets: 'أصول',
      liabilities: 'خصوم',
      equity: 'حقوق الملكية',
      revenue: 'إيرادات',
      expenses: 'مصروفات',
    };
    return types[type] || type;
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">دفتر الأستاذ العام</h1>
        <p className="text-muted-foreground">عرض حركة كل حساب بالتفصيل</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            اختيار الحساب والفترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <Select
                value={selectedAccountId || ''}
                onValueChange={(value) => setSelectedAccountId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <span className="font-mono ml-2">{account.code}</span>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : "إلى"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Content */}
      {!selectedAccountId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>اختر حساباً لعرض حركته</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingLedger ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : ledger ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-mono">{ledger.account.code}</span>
                  {ledger.account.name}
                </CardTitle>
                <CardDescription>
                  {getAccountTypeLabel(ledger.account.type)}
                  {ledger.account.description && ` - ${ledger.account.description}`}
                </CardDescription>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">الرصيد الختامي</p>
                <p className={cn(
                  "text-2xl font-bold",
                  ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {ledger.closingBalance.toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ledger.entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد حركات في هذه الفترة</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">التاريخ</TableHead>
                      <TableHead className="w-20">رقم القيد</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead className="w-20">النوع</TableHead>
                      <TableHead className="w-28 text-left">مدين</TableHead>
                      <TableHead className="w-28 text-left">دائن</TableHead>
                      <TableHead className="w-32 text-left">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Opening Balance Row */}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={4} className="font-medium">رصيد أول المدة</TableCell>
                      <TableCell className="text-left">-</TableCell>
                      <TableCell className="text-left">-</TableCell>
                      <TableCell className="text-left font-medium">
                        {ledger.openingBalance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    
                    {ledger.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), "yyyy/MM/dd")}</TableCell>
                        <TableCell className="font-mono">{entry.entry_number}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{getReferenceTypeBadge(entry.reference_type)}</TableCell>
                        <TableCell className="text-left">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-left">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-left font-medium",
                          entry.balance >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {entry.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>الإجمالي</TableCell>
                      <TableCell className="text-left">{ledger.totalDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-left">{ledger.totalCredit.toLocaleString()}</TableCell>
                      <TableCell className={cn(
                        "text-left",
                        ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {ledger.closingBalance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-600">إجمالي المدين</p>
                    <p className="text-xl font-bold text-blue-700">{ledger.totalDebit.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm text-orange-600">إجمالي الدائن</p>
                    <p className="text-xl font-bold text-orange-700">{ledger.totalCredit.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-600">عدد الحركات</p>
                    <p className="text-xl font-bold text-purple-700">{ledger.entries.length}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-lg border",
                    ledger.closingBalance >= 0 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  )}>
                    <p className={cn(
                      "text-sm",
                      ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                    )}>الرصيد الختامي</p>
                    <p className={cn(
                      "text-xl font-bold",
                      ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700"
                    )}>{ledger.closingBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
