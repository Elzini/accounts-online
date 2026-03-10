import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Users, Truck, Package, Download, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { readExcelFile, utils } from '@/lib/excelUtils';

type ImportType = 'customers' | 'suppliers' | 'items';

interface ImportRow {
  [key: string]: any;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const TEMPLATES: Record<ImportType, { headers: string[]; headersAr: string[]; example: string[][] }> = {
  customers: {
    headers: ['name', 'phone', 'id_number', 'tax_number', 'address'],
    headersAr: ['اسم العميل', 'رقم الهاتف', 'رقم الهوية', 'الرقم الضريبي', 'العنوان'],
    example: [['أحمد محمد', '0512345678', '1234567890', '300000000000003', 'الرياض']],
  },
  suppliers: {
    headers: ['name', 'phone', 'registration_number', 'address', 'contact_person'],
    headersAr: ['اسم المورد', 'رقم الهاتف', 'الرقم الضريبي', 'العنوان', 'جهة الاتصال'],
    example: [['شركة التوريد', '0551234567', '300000000000003', 'جدة', 'خالد']],
  },
  items: {
    headers: ['name', 'sku', 'category', 'unit', 'cost_price', 'selling_price', 'quantity'],
    headersAr: ['اسم الصنف', 'رمز الصنف', 'التصنيف', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'الكمية'],
    example: [['قلم جاف', 'PEN001', 'أدوات مكتبية', 'حبة', '2', '5', '100']],
  },
};

export function DataImportPage() {
  const { companyId } = useCompany();
  const [activeTab, setActiveTab] = useState<ImportType>('customers');
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = await readExcelFile(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json<ImportRow>(sheet);

      if (jsonData.length === 0) {
        toast.error('الملف فارغ');
        return;
      }

      // Map Arabic headers to English
      const template = TEMPLATES[activeTab];
      const mappedData = jsonData.map(row => {
        const mapped: ImportRow = {};
        template.headers.forEach((key, i) => {
          const arHeader = template.headersAr[i];
          mapped[key] = row[key] || row[arHeader] || row[key.toLowerCase()] || '';
        });
        return mapped;
      });

      setPreviewData(mappedData);
      setImportResult(null);
      toast.success(`تم تحميل ${mappedData.length} سجل للمعاينة`);
    } catch (error) {
      toast.error('خطأ في قراءة الملف');
      console.error(error);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!companyId || previewData.length === 0) return;
    setIsImporting(true);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      try {
        if (activeTab === 'customers') {
          if (!row.name || !row.phone) {
            result.failed++;
            result.errors.push(`سطر ${i + 1}: الاسم ورقم الهاتف مطلوبان`);
            continue;
          }
          const { error } = await supabase.from('customers').insert({
            company_id: companyId,
            name: row.name,
            phone: row.phone,
            id_number: row.id_number || null,
            tax_number: row.tax_number || null,
            address: row.address || null,
          });
          if (error) throw error;
        } else if (activeTab === 'suppliers') {
          if (!row.name || !row.phone) {
            result.failed++;
            result.errors.push(`سطر ${i + 1}: الاسم ورقم الهاتف مطلوبان`);
            continue;
          }
          const { error } = await supabase.from('suppliers').insert({
            company_id: companyId,
            name: row.name,
            phone: row.phone,
            registration_number: row.registration_number || null,
            address: row.address || null,
            contact_person: row.contact_person || null,
          });
          if (error) throw error;
        } else if (activeTab === 'items') {
          if (!row.name) {
            result.failed++;
            result.errors.push(`سطر ${i + 1}: اسم الصنف مطلوب`);
            continue;
          }
          const { error } = await supabase.from('inventory_items').insert({
            company_id: companyId,
            name: row.name,
            sku: row.sku || null,
            category: row.category || null,
            unit: row.unit || 'حبة',
            cost_price: parseFloat(row.cost_price) || 0,
            selling_price: parseFloat(row.selling_price) || 0,
            current_quantity: parseInt(row.quantity) || 0,
          });
          if (error) throw error;
        }
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`سطر ${i + 1}: ${error.message}`);
      }
    }

    setImportResult(result);
    setIsImporting(false);

    if (result.success > 0) {
      toast.success(`تم استيراد ${result.success} سجل بنجاح`);
    }
    if (result.failed > 0) {
      toast.error(`فشل استيراد ${result.failed} سجل`);
    }
  };

  const downloadTemplate = () => {
    const template = TEMPLATES[activeTab];
    const csvContent = [template.headersAr.join(','), template.example.map(r => r.join(',')).join('\n')].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تحميل القالب');
  };

  const tabConfig: { value: ImportType; label: string; icon: any }[] = [
    { value: 'customers', label: 'العملاء', icon: Users },
    { value: 'suppliers', label: 'الموردين', icon: Truck },
    { value: 'items', label: 'الأصناف', icon: Package },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          استيراد البيانات من Excel
        </h1>
        <p className="text-muted-foreground">استيراد عملاء وموردين وأصناف من ملفات Excel أو CSV</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ImportType); setPreviewData([]); setImportResult(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          {tabConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  استيراد {tab.label}
                </CardTitle>
                <CardDescription>
                  ارفع ملف Excel أو CSV يحتوي على بيانات {tab.label}. تأكد أن الأعمدة تطابق القالب.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 ml-2" />
                    تحميل القالب
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 ml-2" />
                    رفع الملف
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">الأعمدة المطلوبة:</p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES[activeTab].headersAr.map((h, i) => (
                      <Badge key={i} variant={i < 2 ? 'default' : 'secondary'}>{h} {i < 2 && '*'}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">معاينة البيانات ({previewData.length} سجل)</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setPreviewData([]); setImportResult(null); }}>
                  <Trash2 className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                  {isImporting ? 'جاري الاستيراد...' : `استيراد ${previewData.length} سجل`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    {TEMPLATES[activeTab].headersAr.map((h, i) => (
                      <TableHead key={i} className="text-right">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      {TEMPLATES[activeTab].headers.map((key, j) => (
                        <TableCell key={j}>{row[key] || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 50 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  يتم عرض أول 50 سجل من أصل {previewData.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {importResult && (
        <Card className={importResult.failed > 0 ? 'border-amber-300' : 'border-emerald-300'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-lg">نتيجة الاستيراد</p>
                <p className="text-muted-foreground">
                  نجح: {importResult.success} | فشل: {importResult.failed}
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-destructive/10 p-3 rounded-lg max-h-40 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
