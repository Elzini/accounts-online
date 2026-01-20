import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTrialBalance, useIncomeStatement, useAccountBalances } from '@/hooks/useAccounting';
import { Loader2, FileText, TrendingUp, Scale, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of year
    to: new Date(),
  });

  const { data: trialBalance, isLoading: isLoadingTrial } = useTrialBalance();
  const { data: incomeStatement, isLoading: isLoadingIncome } = useIncomeStatement(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );
  const { data: accountBalances = [], isLoading: isLoadingBalances } = useAccountBalances();

  const isLoading = isLoadingTrial || isLoadingIncome || isLoadingBalances;

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
        <p className="text-muted-foreground">عرض التقارير المالية للشركة</p>
      </div>

      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance" className="gap-2">
            <Scale className="w-4 h-4" />
            ميزان المراجعة
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            قائمة الدخل
          </TabsTrigger>
          <TabsTrigger value="account-balances" className="gap-2">
            <FileText className="w-4 h-4" />
            أرصدة الحسابات
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                ميزان المراجعة
              </CardTitle>
              <CardDescription>
                ملخص أرصدة جميع الحسابات المدينة والدائنة
              </CardDescription>
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
                  <CardDescription>
                    ملخص الإيرادات والمصروفات وصافي الربح
                  </CardDescription>
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

        {/* Account Balances */}
        <TabsContent value="account-balances">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                أرصدة الحسابات
              </CardTitle>
              <CardDescription>
                عرض أرصدة جميع الحسابات في الدفتر
              </CardDescription>
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
                    {accountBalances.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{getTypeLabel(account.type)}</TableCell>
                        <TableCell className="text-left">{(account.total_debit ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-left">{(account.total_credit ?? 0).toLocaleString()}</TableCell>
                        <TableCell className={cn(
                          "text-left font-medium",
                          (account.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {(account.balance ?? 0).toLocaleString()}
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
