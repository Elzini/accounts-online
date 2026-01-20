import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useTrialBalance, 
  useIncomeStatement, 
  useAccountBalances, 
  useBalanceSheet,
  useJournalEntriesReport,
  useComprehensiveTrialBalance 
} from '@/hooks/useAccounting';
import { Loader2, FileText, TrendingUp, Scale, CalendarIcon, Building2, BookOpen, ClipboardList, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [referenceType, setReferenceType] = useState<string>('all');

  const { data: trialBalance, isLoading: isLoadingTrial } = useTrialBalance();
  const { data: incomeStatement, isLoading: isLoadingIncome } = useIncomeStatement(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );
  const { data: accountBalances = [], isLoading: isLoadingBalances } = useAccountBalances();
  const { data: balanceSheet, isLoading: isLoadingBalanceSheet } = useBalanceSheet();
  const { data: journalEntries = [], isLoading: isLoadingJournal } = useJournalEntriesReport(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    referenceType === 'all' ? undefined : referenceType
  );
  const { data: comprehensiveTrial, isLoading: isLoadingComprehensive } = useComprehensiveTrialBalance();

  const isLoading = isLoadingTrial || isLoadingIncome || isLoadingBalances || isLoadingBalanceSheet || isLoadingJournal || isLoadingComprehensive;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التقارير المالية</h1>
        <p className="text-muted-foreground">عرض التقارير المالية والمحاسبية للشركة</p>
      </div>

      <Tabs defaultValue="journal-entries" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max gap-1 p-1">
            <TabsTrigger value="journal-entries" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <ClipboardList className="w-4 h-4" />
              كشف القيود
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Scale className="w-4 h-4" />
              ميزان المراجعة
            </TabsTrigger>
            <TabsTrigger value="comprehensive-trial" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Scale className="w-4 h-4" />
              ميزان شامل
            </TabsTrigger>
            <TabsTrigger value="income-statement" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="w-4 h-4" />
              قائمة الدخل
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Building2 className="w-4 h-4" />
              الميزانية العمومية
            </TabsTrigger>
            <TabsTrigger value="account-balances" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <FileText className="w-4 h-4" />
              أرصدة الحسابات
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Journal Entries Report - كشف القيود */}
        <TabsContent value="journal-entries">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    كشف القيود
                  </CardTitle>
                  <CardDescription>عرض جميع القيود المحاسبية</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={referenceType} onValueChange={setReferenceType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="sale">مبيعات</SelectItem>
                      <SelectItem value="purchase">مشتريات</SelectItem>
                      <SelectItem value="expense">مصروفات</SelectItem>
                      <SelectItem value="manual">يدوي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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
                      <Button variant="outline" size="sm" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : "إلى"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {journalEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد قيود</p>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry: any) => (
                    <Card key={entry.id} className="border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-mono bg-primary/10 px-2 py-1 rounded">#{entry.entry_number}</span>
                            <span className="text-sm">{entry.entry_date}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              entry.reference_type === 'sale' && "bg-green-100 text-green-700",
                              entry.reference_type === 'purchase' && "bg-blue-100 text-blue-700",
                              entry.reference_type === 'expense' && "bg-orange-100 text-orange-700",
                              entry.reference_type === 'manual' && "bg-gray-100 text-gray-700",
                              !entry.reference_type && "bg-gray-100 text-gray-700"
                            )}>
                              {getReferenceTypeLabel(entry.reference_type)}
                            </span>
                          </div>
                          <span className="font-medium">{entry.total_debit.toLocaleString()} ر.س</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      </CardHeader>
                      <CardContent className="py-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الحساب</TableHead>
                              <TableHead className="text-center w-24">مدين</TableHead>
                              <TableHead className="text-center w-24">دائن</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.lines?.map((line: any) => (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <span className="font-mono text-xs text-muted-foreground ml-2">{line.account?.code}</span>
                                  {line.account?.name}
                                </TableCell>
                                <TableCell className="text-center text-green-600">
                                  {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                                </TableCell>
                                <TableCell className="text-center text-red-600">
                                  {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                ميزان المراجعة
              </CardTitle>
              <CardDescription>ملخص أرصدة جميع الحسابات المدينة والدائنة</CardDescription>
            </CardHeader>
            <CardContent>
              {!trialBalance || trialBalance.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الرمز</TableHead>
                        <TableHead>اسم الحساب</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead className="text-left">مدين</TableHead>
                        <TableHead className="text-left">دائن</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((item) => (
                        <TableRow key={item.account.id}>
                          <TableCell className="font-mono">{item.account.code}</TableCell>
                          <TableCell>{item.account.name}</TableCell>
                          <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                          <TableCell className="text-left">
                            {item.debit > 0 ? item.debit.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            {item.credit > 0 ? item.credit.toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>الإجمالي</TableCell>
                        <TableCell className="text-left">{trialBalance.totalDebit.toLocaleString()}</TableCell>
                        <TableCell className="text-left">{trialBalance.totalCredit.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className={cn(
                    "p-4 rounded-lg text-center font-medium",
                    trialBalance.totalDebit === trialBalance.totalCredit ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {trialBalance.totalDebit === trialBalance.totalCredit ? '✓ الميزان متوازن' : '✗ الميزان غير متوازن'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comprehensive Trial Balance - ميزان المراجعة الشامل */}
        <TabsContent value="comprehensive-trial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                ميزان المراجعة الشامل
              </CardTitle>
              <CardDescription>عرض أرصدة افتتاحية وحركة الفترة والأرصدة الختامية</CardDescription>
            </CardHeader>
            <CardContent>
              {!comprehensiveTrial || comprehensiveTrial.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2}>الرمز</TableHead>
                      <TableHead rowSpan={2}>اسم الحساب</TableHead>
                      <TableHead colSpan={2} className="text-center border-x bg-blue-50">حركة الفترة</TableHead>
                      <TableHead colSpan={2} className="text-center bg-green-50">الرصيد الختامي</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center border-r bg-blue-50">مدين</TableHead>
                      <TableHead className="text-center bg-blue-50">دائن</TableHead>
                      <TableHead className="text-center border-r bg-green-50">مدين</TableHead>
                      <TableHead className="text-center bg-green-50">دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprehensiveTrial.accounts.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell>
                        <TableCell>{item.account.name}</TableCell>
                        <TableCell className="text-center border-r">{item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center">{item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center border-r text-green-600">{item.closingDebit > 0 ? item.closingDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center text-red-600">{item.closingCredit > 0 ? item.closingCredit.toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>الإجمالي</TableCell>
                      <TableCell className="text-center border-r">{comprehensiveTrial.totals.periodDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{comprehensiveTrial.totals.periodCredit.toLocaleString()}</TableCell>
                      <TableCell className="text-center border-r text-green-600">{comprehensiveTrial.totals.closingDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center text-red-600">{comprehensiveTrial.totals.closingCredit.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    قائمة الدخل
                  </CardTitle>
                  <CardDescription>ملخص الإيرادات والمصروفات وصافي الربح</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!incomeStatement ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-green-600">الإيرادات</h3>
                    <Table>
                      <TableBody>
                      {incomeStatement.revenue.map((item) => (
                          <TableRow key={item.account.id}>
                            <TableCell>{item.account.code}</TableCell>
                            <TableCell>{item.account.name}</TableCell>
                            <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-50 font-bold">
                          <TableCell colSpan={2}>إجمالي الإيرادات</TableCell>
                          <TableCell className="text-left text-green-600">
                            {incomeStatement.totalRevenue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-red-600">المصروفات</h3>
                    <Table>
                      <TableBody>
                      {incomeStatement.expenses.map((item) => (
                          <TableRow key={item.account.id}>
                            <TableCell>{item.account.code}</TableCell>
                            <TableCell>{item.account.name}</TableCell>
                            <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-red-50 font-bold">
                          <TableCell colSpan={2}>إجمالي المصروفات</TableCell>
                          <TableCell className="text-left text-red-600">
                            {incomeStatement.totalExpenses.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className={cn(
                    "p-6 rounded-lg",
                    incomeStatement.netIncome >= 0 ? "bg-green-100" : "bg-red-100"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">صافي الربح / (الخسارة)</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        incomeStatement.netIncome >= 0 ? "text-green-700" : "text-red-700"
                      )}>
                        {incomeStatement.netIncome.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet - الميزانية العمومية */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                الميزانية العمومية
              </CardTitle>
              <CardDescription>عرض الأصول والخصوم وحقوق الملكية</CardDescription>
            </CardHeader>
            <CardContent>
              {!balanceSheet ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4 text-blue-600 border-b pb-2">الأصول</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet.assets.map((item) => (
                          <TableRow key={item.account.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                            <TableCell>{item.account.name}</TableCell>
                            <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell colSpan={2}>إجمالي الأصول</TableCell>
                          <TableCell className="text-left text-blue-600">{balanceSheet.totalAssets.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-4">
                    {/* Liabilities */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-4 text-red-600 border-b pb-2">الخصوم</h3>
                      <Table>
                        <TableBody>
                          {balanceSheet.liabilities.map((item) => (
                            <TableRow key={item.account.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                              <TableCell>{item.account.name}</TableCell>
                              <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-red-50 font-bold">
                            <TableCell colSpan={2}>إجمالي الخصوم</TableCell>
                            <TableCell className="text-left text-red-600">{balanceSheet.totalLiabilities.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Equity */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-4 text-purple-600 border-b pb-2">حقوق الملكية</h3>
                      <Table>
                        <TableBody>
                          {balanceSheet.equity.map((item) => (
                            <TableRow key={item.account.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                              <TableCell>{item.account.name}</TableCell>
                              <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {balanceSheet.retainedEarnings !== 0 && (
                            <TableRow>
                              <TableCell></TableCell>
                              <TableCell className="font-medium">الأرباح المحتجزة</TableCell>
                              <TableCell className={cn(
                                "text-left font-medium",
                                balanceSheet.retainedEarnings >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {balanceSheet.retainedEarnings.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-purple-50 font-bold">
                            <TableCell colSpan={2}>إجمالي حقوق الملكية</TableCell>
                            <TableCell className="text-left text-purple-600">{balanceSheet.totalEquity.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
              
              {balanceSheet && (
                <div className={cn(
                  "mt-6 p-4 rounded-lg text-center font-medium",
                  Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? '✓ الميزانية متوازنة (الأصول = الخصوم + حقوق الملكية)' 
                    : `✗ الميزانية غير متوازنة - فرق: ${(balanceSheet.totalAssets - balanceSheet.totalLiabilities - balanceSheet.totalEquity).toLocaleString()}`
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Balances */}
        <TabsContent value="account-balances">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                أرصدة الحسابات
              </CardTitle>
              <CardDescription>عرض أرصدة جميع الحسابات في الدفتر</CardDescription>
            </CardHeader>
            <CardContent>
              {accountBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرمز</TableHead>
                      <TableHead>اسم الحساب</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead className="text-left">إجمالي المدين</TableHead>
                      <TableHead className="text-left">إجمالي الدائن</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountBalances.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell>
                        <TableCell>{item.account.name}</TableCell>
                        <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                        <TableCell className="text-left">{(item.debit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-left">{(item.credit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className={cn(
                          "text-left font-medium",
                          (item.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {(item.balance ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    assets: 'أصول',
    liabilities: 'خصوم',
    equity: 'حقوق الملكية',
    revenue: 'إيرادات',
    expenses: 'مصروفات',
  };
  return types[type] || type;
}

function getReferenceTypeLabel(type: string | null): string {
  const types: Record<string, string> = {
    sale: 'مبيعات',
    purchase: 'مشتريات',
    expense: 'مصروفات',
    manual: 'يدوي',
    adjustment: 'تسوية',
    opening: 'افتتاحي',
  };
  return type ? types[type] || type : 'عام';
}