import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Users, Truck, DollarSign, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedadImport } from './hooks/useMedadImport';

export function MedadImportPage() {
  const { t, direction } = useLanguage();
  const {
    activeTab, setActiveTab, isProcessing, progress, parsedData,
    importResults, fileName, fileInputRef,
    parseExcelFile, executeImport, resetAll,
  } = useMedadImport();

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.medad_title}</h1>
          <p className="text-muted-foreground">{t.medad_subtitle}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload" disabled={isProcessing}>{t.medad_upload_btn}</TabsTrigger>
              <TabsTrigger value="preview" disabled={!fileName || isProcessing}>{t.medad_preview}</TabsTrigger>
              <TabsTrigger value="results" disabled={importResults.length === 0 || isProcessing}>{t.medad_results}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) parseExcelFile(file); }}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t.medad_drag_drop}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.medad_supported_formats}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50/50 border-blue-100"><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" /><span className="font-medium">{t.medad_customers}</span></CardContent></Card>
                <Card className="bg-green-50/50 border-green-100"><CardContent className="p-4 flex items-center gap-3"><Truck className="w-8 h-8 text-green-600" /><span className="font-medium">{t.medad_suppliers}</span></CardContent></Card>
                <Card className="bg-purple-50/50 border-purple-100"><CardContent className="p-4 flex items-center gap-3"><FileSpreadsheet className="w-8 h-8 text-purple-600" /><span className="font-medium">{t.medad_accounts}</span></CardContent></Card>
                <Card className="bg-orange-50/50 border-orange-100"><CardContent className="p-4 flex items-center gap-3"><DollarSign className="w-8 h-8 text-orange-600" /><span className="font-medium">{t.medad_expenses}</span></CardContent></Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" />{t.medad_tips}</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>{t.medad_tip_1}</li><li>{t.medad_tip_2}</li><li>{t.medad_tip_3}</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{fileName}</h3>
                  <Button onClick={executeImport} disabled={isProcessing}>
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 ml-2" />}
                    {t.medad_upload_btn}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-card"><p className="text-sm text-muted-foreground">{t.medad_customers}</p><p className="text-2xl font-bold">{parsedData.customers.length}</p></div>
                  <div className="p-4 border rounded-lg bg-card"><p className="text-sm text-muted-foreground">{t.medad_suppliers}</p><p className="text-2xl font-bold">{parsedData.suppliers.length}</p></div>
                  <div className="p-4 border rounded-lg bg-card"><p className="text-sm text-muted-foreground">{t.medad_accounts}</p><p className="text-2xl font-bold">{parsedData.accounts.length}</p></div>
                  <div className="p-4 border rounded-lg bg-card"><p className="text-sm text-muted-foreground">{t.medad_expenses}</p><p className="text-2xl font-bold">{parsedData.expenses.length}</p></div>
                </div>
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>جاري المعالجة...</span><span>{Math.round(progress)}%</span></div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results">
              <div className="space-y-6">
                {importResults.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{result.type}</span>
                        <Badge variant={result.failed > 0 ? 'destructive' : 'default'}>{result.failed > 0 ? 'مكتمل مع أخطاء' : 'ناجح'}</Badge>
                      </CardTitle>
                      <CardDescription>إجمالي: {result.total} | نجاح: {result.success} | فشل: {result.failed}</CardDescription>
                    </CardHeader>
                    {result.errors.length > 0 && (
                      <CardContent>
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm max-h-40 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-1">{result.errors.map((error, i) => <li key={i}>{error}</li>)}</ul>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={resetAll}>استيراد ملف آخر</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
