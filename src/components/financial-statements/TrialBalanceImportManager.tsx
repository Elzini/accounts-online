// مكون استيراد ميزان المراجعة مع ربط الحسابات ومحرك السيناريوهات
import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ArrowRight, RefreshCw, FileCheck, Edit3, Zap, Plus,
  Shield, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ImportedTrialBalance,
  TrialBalanceRow,
  AccountMappingType,
  MAPPING_TYPE_LABELS,
  parseTrialBalanceFile,
  generateFinancialStatementsFromTB,
} from '@/services/trialBalanceImport';
import {
  runScenarioEngine,
  generateMissingAccounts,
  ScenarioSummary,
} from '@/services/trialBalanceScenarioEngine';
import { ComprehensiveFinancialData } from './types';
import { ScenarioValidationDashboard } from './ScenarioValidationDashboard';

interface TrialBalanceImportManagerProps {
  companyName: string;
  reportDate: string;
  onDataGenerated: (data: ComprehensiveFinancialData, source: string) => void;
}

type ImportStep = 'upload' | 'mapping' | 'review' | 'done';

export function TrialBalanceImportManager({ companyName, reportDate, onDataGenerated }: TrialBalanceImportManagerProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [importedData, setImportedData] = useState<ImportedTrialBalance | null>(null);
  const [rows, setRows] = useState<TrialBalanceRow[]>([]);
  const [scenarioSummary, setScenarioSummary] = useState<ScenarioSummary | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [missingAccountsAdded, setMissingAccountsAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runValidation = useCallback((currentRows: TrialBalanceRow[]) => {
    const summary = runScenarioEngine(currentRows);
    setScenarioSummary(summary);
    return summary;
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await parseTrialBalanceFile(file);
      setImportedData(result);
      setRows(result.rows);
      setMissingAccountsAdded(false);
      
      // تشغيل محرك السيناريوهات تلقائياً
      const summary = runValidation(result.rows);
      setShowScenarios(true);
      
      setStep('mapping');
      toast.success(`تم تحليل ${result.rows.length} حساب | ${summary.totalScenariosTested}+ سيناريو`);
    } catch (error: any) {
      toast.error(error.message || 'فشل تحليل الملف');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMappingChange = (index: number, newType: AccountMappingType) => {
    setRows(prev => {
      const updated = prev.map((r, i) => i === index ? { ...r, mappedType: newType, isAutoMapped: false } : r);
      // إعادة تشغيل السيناريوهات بعد التعديل
      runValidation(updated);
      return updated;
    });
  };

  const handleAddMissingAccounts = () => {
    const missing = generateMissingAccounts(rows);
    if (missing.length === 0) {
      toast.info('جميع التصنيفات الأساسية موجودة');
      return;
    }
    setRows(prev => {
      const updated = [...prev, ...missing];
      runValidation(updated);
      return updated;
    });
    setMissingAccountsAdded(true);
    toast.success(`تم إضافة ${missing.length} حساب مفقود بقيمة صفر`);
  };

  const handleGenerateStatements = () => {
    const unmapped = rows.filter(r => r.mappedType === 'unmapped');
    if (unmapped.length > 0) {
      toast.warning(`لا يزال هناك ${unmapped.length} حساب غير مصنف`);
    }
    
    const data = generateFinancialStatementsFromTB(rows, companyName, reportDate);
    onDataGenerated(data as ComprehensiveFinancialData, importedData?.fileName || 'ملف مستورد');
    setStep('done');
    toast.success('تم توليد القوائم المالية بنجاح!');
  };

  const handleReset = () => {
    setStep('upload');
    setImportedData(null);
    setRows([]);
    setScenarioSummary(null);
    setShowScenarios(false);
    setMissingAccountsAdded(false);
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const mappingStats = {
    total: rows.length,
    mapped: rows.filter(r => r.mappedType !== 'unmapped').length,
    unmapped: rows.filter(r => r.mappedType === 'unmapped').length,
    autoMapped: rows.filter(r => r.isAutoMapped && r.mappedType !== 'unmapped').length,
  };

  const progressPercent = mappingStats.total > 0 ? (mappingStats.mapped / mappingStats.total) * 100 : 0;

  // Step 1: Upload
  if (step === 'upload') {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">استيراد ميزان المراجعة</h3>
              <p className="text-sm text-muted-foreground">
                ارفع ملف Excel أو CSV يحتوي على ميزان المراجعة لتوليد القوائم المالية تلقائياً
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <Shield className="w-3 h-3 inline ml-1" />
                يتم فحص البيانات عبر محرك سيناريوهات ديناميكي شامل
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {isLoading ? 'جاري التحليل...' : 'اختيار ملف'}
              </Button>
              <p className="text-xs text-muted-foreground">
                يدعم: Excel (.xlsx, .xls) و CSV (.csv)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Mapping
  if (step === 'mapping' && importedData) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  ربط الحسابات - {importedData.fileName}
                </CardTitle>
                <CardDescription>تحقق من تصنيف الحسابات وعدّل حسب الحاجة قبل توليد القوائم</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 ml-1" /> إعادة
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddMissingAccounts}
                  disabled={missingAccountsAdded}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" /> إضافة المفقودة
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowScenarios(!showScenarios)}
                  className="gap-1"
                >
                  <Shield className="w-4 h-4" />
                  {showScenarios ? 'إخفاء الفحص' : 'عرض الفحص'}
                  {scenarioSummary && (
                    <Badge variant={scenarioSummary.overallScore >= 80 ? 'default' : 'destructive'} className="mr-1 text-xs">
                      {scenarioSummary.overallScore}
                    </Badge>
                  )}
                </Button>
                <Button size="sm" onClick={handleGenerateStatements} className="gap-1">
                  <Zap className="w-4 h-4" /> توليد القوائم
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{mappingStats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الحسابات</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{mappingStats.autoMapped}</p>
                <p className="text-xs text-muted-foreground">ربط تلقائي</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{mappingStats.mapped}</p>
                <p className="text-xs text-muted-foreground">مصنف</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{mappingStats.unmapped}</p>
                <p className="text-xs text-muted-foreground">غير مصنف</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            
            {/* Scenario score bar */}
            {scenarioSummary && (
              <div className="mt-3 flex items-center gap-3 p-2 bg-muted/30 rounded-lg text-sm">
                <Activity className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  نتيجة الفحص: <strong className={scenarioSummary.overallScore >= 80 ? 'text-green-600' : scenarioSummary.overallScore >= 50 ? 'text-amber-600' : 'text-destructive'}>{scenarioSummary.overallScore}/100</strong>
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{scenarioSummary.totalScenariosTested.toLocaleString('ar-SA')}+ سيناريو</span>
                {scenarioSummary.critical > 0 && <Badge variant="destructive" className="text-xs">{scenarioSummary.critical} حرج</Badge>}
                {scenarioSummary.errors > 0 && <Badge variant="destructive" className="text-xs">{scenarioSummary.errors} خطأ</Badge>}
              </div>
            )}
            
            {/* Validation messages */}
            {importedData.validation.errors.length > 0 && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-lg text-sm">
                {importedData.validation.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-3 h-3 shrink-0" /> {err}
                  </div>
                ))}
              </div>
            )}
            {importedData.validation.warnings.length > 0 && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm">
                {importedData.validation.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}
            
            {/* Balance check */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span>مجموع المدين: <strong>{formatNumber(importedData.validation.totalDebit)}</strong></span>
              <span>مجموع الدائن: <strong>{formatNumber(importedData.validation.totalCredit)}</strong></span>
              {importedData.validation.isBalanced ? (
                <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> متوازن</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> فرق: {formatNumber(importedData.validation.difference)}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Validation Dashboard */}
        {showScenarios && scenarioSummary && (
          <ScenarioValidationDashboard summary={scenarioSummary} />
        )}

        {/* Accounts Table */}
        <Card>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right w-20">الرمز</TableHead>
                  <TableHead className="text-right">اسم الحساب</TableHead>
                  <TableHead className="text-right w-28">مدين</TableHead>
                  <TableHead className="text-right w-28">دائن</TableHead>
                  <TableHead className="text-right w-48">التصنيف</TableHead>
                  <TableHead className="text-center w-16">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index} className={row.mappedType === 'unmapped' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                    <TableCell className="font-mono text-sm">{row.code}</TableCell>
                    <TableCell className="font-medium text-sm">{row.name}</TableCell>
                    <TableCell className="text-sm tabular-nums">{row.debit > 0 ? formatNumber(row.debit) : '-'}</TableCell>
                    <TableCell className="text-sm tabular-nums">{row.credit > 0 ? formatNumber(row.credit) : '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={row.mappedType}
                        onValueChange={(val) => handleMappingChange(index, val as AccountMappingType)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MAPPING_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.mappedType === 'unmapped' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                      ) : row.isAutoMapped ? (
                        <Zap className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button size="lg" onClick={handleGenerateStatements} className="gap-2 px-8">
            <FileCheck className="w-5 h-5" />
            توليد القوائم المالية
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Done
  if (step === 'done') {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">تم توليد القوائم المالية بنجاح!</h3>
            <p className="text-sm text-muted-foreground">
              تم تحليل {rows.length} حساب وتوليد جميع القوائم المالية
            </p>
            {scenarioSummary && (
              <p className="text-xs text-muted-foreground">
                نتيجة الفحص: {scenarioSummary.overallScore}/100 | {scenarioSummary.totalScenariosTested.toLocaleString('ar-SA')}+ سيناريو
              </p>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
              <RefreshCw className="w-4 h-4" /> استيراد ميزان جديد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
