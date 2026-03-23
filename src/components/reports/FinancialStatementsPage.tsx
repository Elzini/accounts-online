/**
 * Financial Statements Page - Slim Orchestrator
 * Delegates to modular sub-components and hooks.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  FileSpreadsheet, Upload, CalendarIcon, Building2, Calculator,
  TrendingUp, Scale, Wallet, Loader2, Database,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useNumberFormat } from '@/hooks/useNumberFormat';

import { useFinancialData } from './financial-statements/useFinancialData';
import { createExportFunctions } from './financial-statements/exportHelpers';
import { BalanceSheetTab } from './financial-statements/tabs/BalanceSheetTab';
import { IncomeStatementTab } from './financial-statements/tabs/IncomeStatementTab';
import { EquityChangesTab } from './financial-statements/tabs/EquityChangesTab';
import { CashFlowTab } from './financial-statements/tabs/CashFlowTab';
import { ZakatTab } from './financial-statements/tabs/ZakatTab';

export function FinancialStatementsPage() {
  const { decimals: numDecimals } = useNumberFormat();
  const {
    data, setData, isLoading, dataSource, fileName,
    editMode, setEditMode, dateRange, setDateRange,
    fileInputRef, parseExcelFile, loadSystemData,
  } = useFinancialData();

  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: numDecimals, maximumFractionDigits: numDecimals }).format(numDecimals === 0 ? Math.round(num) : num);
  };

  const exports = createExportFunctions(data, { printReport, exportToExcel, exportToPdf, formatNumber });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">القوائم المالية الشاملة</h1>
          <p className="text-muted-foreground">قائمة المركز المالي، قائمة الدخل، التغيرات في حقوق الملكية، التدفقات النقدية</p>
        </div>
        <div className="flex items-center gap-2">
          {dataSource !== 'none' && (
            <Badge variant={dataSource === 'excel' ? 'default' : 'secondary'}>
              {dataSource === 'excel' ? <><FileSpreadsheet className="w-3 h-3 mr-1" /> {fileName}</> : <><Database className="w-3 h-3 mr-1" /> بيانات النظام</>}
            </Badge>
          )}
        </div>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> مصدر البيانات</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn("border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50", dataSource === 'excel' ? 'border-primary bg-primary/5' : 'border-border')} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) parseExcelFile(file); }} />
              <div className="flex flex-col items-center gap-2 text-center">
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <p className="font-medium">رفع ملف Excel</p>
                <p className="text-sm text-muted-foreground">قوائم مالية من ملف Excel</p>
              </div>
            </div>
            <div className={cn("border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50", dataSource === 'system' ? 'border-primary bg-primary/5' : 'border-border')} onClick={loadSystemData}>
              <div className="flex flex-col items-center gap-2 text-center">
                <Database className="w-10 h-10 text-muted-foreground" />
                <p className="font-medium">من بيانات النظام</p>
                <p className="text-sm text-muted-foreground">المبيعات والمشتريات والمصروفات</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Label>الفترة:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("justify-start text-right font-normal gap-2")}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (dateRange.to ? <>{format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}</> : format(dateRange.from, "yyyy/MM/dd")) : <span>اختر الفترة</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
            {dataSource !== 'none' && (
              <div className="flex items-center gap-2 mr-auto">
                <Label htmlFor="edit-mode">وضع التعديل</Label>
                <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

      {!isLoading && dataSource !== 'none' && (
        <Tabs defaultValue="balance-sheet" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 p-1">
              <TabsTrigger value="balance-sheet" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Building2 className="w-4 h-4" /> قائمة المركز المالي</TabsTrigger>
              <TabsTrigger value="income" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><TrendingUp className="w-4 h-4" /> قائمة الدخل الشامل</TabsTrigger>
              <TabsTrigger value="equity" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Scale className="w-4 h-4" /> التغير في حقوق الملكية</TabsTrigger>
              <TabsTrigger value="cash-flow" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Wallet className="w-4 h-4" /> التدفق النقدي</TabsTrigger>
              <TabsTrigger value="zakat" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Calculator className="w-4 h-4" /> حساب الزكاة</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="balance-sheet"><BalanceSheetTab data={data} setData={setData} editMode={editMode} formatNumber={formatNumber} onExport={exports.exportBalanceSheet} /></TabsContent>
          <TabsContent value="income"><IncomeStatementTab data={data} setData={setData} editMode={editMode} formatNumber={formatNumber} onExport={exports.exportIncomeStatement} /></TabsContent>
          <TabsContent value="equity"><EquityChangesTab data={data} formatNumber={formatNumber} onExport={exports.exportEquityChanges} /></TabsContent>
          <TabsContent value="cash-flow"><CashFlowTab data={data} formatNumber={formatNumber} onExport={exports.exportCashFlow} /></TabsContent>
          <TabsContent value="zakat"><ZakatTab data={data} setData={setData} editMode={editMode} formatNumber={formatNumber} onExport={exports.exportZakatCalculation} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
