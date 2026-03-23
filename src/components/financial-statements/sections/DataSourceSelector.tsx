/**
 * Financial Statements - Data Source Selector
 * Shows when no data is loaded, allows user to pick source.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Database, Upload, FileUp, Loader2 } from 'lucide-react';
import type { useFinancialStatements } from '../hooks/useFinancialStatements';

type Hook = ReturnType<typeof useFinancialStatements>;

interface Props {
  hook: Hook;
}

export function DataSourceSelector({ hook }: Props) {
  const { isLoading, fileInputRef, selectedFiscalYear, handleCalculateFromSystem, handleFileUpload, setShowTBImport } = hook;

  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">إنشاء القوائم المالية</h3>
            <p className="text-muted-foreground">اختر مصدر البيانات لإنشاء القوائم المالية الشاملة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Card className="p-4 hover:border-primary cursor-pointer transition-colors" onClick={handleCalculateFromSystem}>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold">حساب من النظام</h4>
                <p className="text-xs text-muted-foreground">احسب القوائم المالية تلقائياً من قيود اليومية</p>
                <Button className="w-full" variant="outline" disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleCalculateFromSystem(); }}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري الحساب...</> : <><Database className="w-4 h-4 mr-2" /> حساب تلقائي</>}
                </Button>
              </div>
            </Card>

            <Card className="p-4 hover:border-primary cursor-pointer transition-colors border-primary/30" onClick={() => setShowTBImport(true)}>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <FileUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <h4 className="font-semibold">استيراد ميزان المراجعة</h4>
                <p className="text-xs text-muted-foreground">رفع ملف Excel/CSV مع ربط تلقائي للحسابات</p>
                <Button className="w-full" variant="default" onClick={(e) => { e.stopPropagation(); setShowTBImport(true); }}>
                  <FileUp className="w-4 h-4 mr-2" /> استيراد ميزان
                </Button>
              </div>
            </Card>

            <Card className="p-4 hover:border-primary cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-semibold">استيراد من مداد</h4>
                <p className="text-xs text-muted-foreground">رفع ملف Excel المصدّر من نظام مداد ERP</p>
                <Button className="w-full" variant="outline" disabled={isLoading} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري التحميل...</> : <><Upload className="w-4 h-4 mr-2" /> رفع ملف مداد</>}
                </Button>
              </div>
            </Card>
          </div>

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

          {selectedFiscalYear && (
            <p className="text-sm text-muted-foreground">
              السنة المالية المحددة: <span className="font-semibold">{selectedFiscalYear.name}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
