import { useState, useRef, useEffect } from 'react';
import { FileImage, Upload, X, FileSpreadsheet, Download, Trash2, Save, Database, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { toast } from 'sonner';
import { readExcelFile, utils, writeFile } from '@/lib/excelUtils';
import { parseExcelToInvoiceItems, ImportedInvoiceItem } from '@/services/importedInvoiceData';
import { useImportedInvoiceData, useSaveImportedInvoiceData, useDeleteImportedInvoiceData } from '@/hooks/useImportedInvoiceData';
import { ExcelItemsEditor } from './ExcelItemsEditor';

export function CustomInvoiceTemplateTab() {
  const { company, companyId, refreshCompany } = useCompany();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingExcelData, setSavingExcelData] = useState(false);
  const [parsedItems, setParsedItems] = useState<ImportedInvoiceItem[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Hooks for saved data
  const { data: savedTemplates = [], isLoading: loadingTemplates } = useImportedInvoiceData();
  const saveImportedData = useSaveImportedInvoiceData();
  const deleteImportedData = useDeleteImportedInvoiceData();
  
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Load existing template data
  useEffect(() => {
    if (company) {
      const companyData = company as any;
      if (companyData.invoice_settings?.custom_background_url) {
        setBackgroundUrl(companyData.invoice_settings.custom_background_url);
        setBackgroundPreview(companyData.invoice_settings.custom_background_url);
      }
    }
  }, [company]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Validate file type - accept images and PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('يرجى اختيار ملف صورة (PNG, JPG, WEBP) أو PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    try {
      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBackgroundPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDF, show a placeholder
        setBackgroundPreview('/placeholder.svg');
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-template-${companyId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('app-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('app-logos')
        .getPublicUrl(fileName);

      setBackgroundUrl(data.publicUrl);
      toast.success('تم رفع خلفية القالب بنجاح');
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('يرجى اختيار ملف Excel (XLSX, XLS) أو CSV');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = await readExcelFile(arrayBuffer);
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = worksheet.jsonData;
          
          if (jsonData.length === 0) {
            toast.error('الملف فارغ أو لا يحتوي على بيانات');
            return;
          }

          setExcelData(jsonData);
          setExcelFileName(file.name);
          toast.success(`تم استيراد ${jsonData.length} سجل من الملف`);
        } catch (parseError) {
          console.error('Error parsing Excel:', parseError);
          toast.error('حدث خطأ أثناء قراءة الملف');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('حدث خطأ أثناء قراءة الملف');
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundUrl(null);
    setBackgroundPreview(null);
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  const handleRemoveExcel = () => {
    setExcelData(null);
    setExcelFileName(null);
    setParsedItems(null);
    setIsEditing(false);
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  // Parse Excel data when loaded
  useEffect(() => {
    if (excelData && excelData.length > 0) {
      const items = parseExcelToInvoiceItems(excelData);
      setParsedItems(items);
    }
  }, [excelData]);

  const handleSaveTemplate = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      // Get existing invoice settings
      const companyData = company as any;
      const existingSettings = companyData?.invoice_settings || {};

      const updatedSettings = {
        ...existingSettings,
        custom_background_url: backgroundUrl,
        use_custom_template: !!backgroundUrl,
      };

      const { error } = await supabase
        .from('companies')
        .update({
          invoice_settings: JSON.parse(JSON.stringify(updatedSettings)),
        })
        .eq('id', companyId);

      if (error) throw error;

      await refreshCompany();
      toast.success('تم حفظ إعدادات القالب المخصص بنجاح');
    } catch (error) {
      console.error('Error saving template settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const downloadSampleExcel = async () => {
    const sampleData = [
      {
        'اسم المنتج': 'سيارة تويوتا كامري 2024',
        'الكمية': 1,
        'سعر الوحدة': 85000,
        'نسبة الضريبة': 15,
        'الإجمالي': 97750,
      },
      {
        'اسم المنتج': 'سيارة هوندا أكورد 2024',
        'الكمية': 1,
        'سعر الوحدة': 78000,
        'نسبة الضريبة': 15,
        'الإجمالي': 89700,
      },
    ];

    const worksheet = utils.json_to_sheet(sampleData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'بيانات الفاتورة');
    await writeFile(workbook, 'نموذج_بيانات_الفاتورة.xlsx');
    toast.success('تم تحميل النموذج بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* Custom Background/Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            قالب الفاتورة المخصص
          </CardTitle>
          <CardDescription>
            ارفع تصميم PDF أو صورة لاستخدامها كخلفية للفاتورة. سيتم وضع البيانات فوق هذا التصميم.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Background Preview */}
            <div className="relative">
              <div className="w-48 h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                {backgroundPreview ? (
                  <img 
                    src={backgroundPreview} 
                    alt="خلفية القالب" 
                    className="w-full h-full object-contain p-2"
                    onError={() => setBackgroundPreview('/placeholder.svg')}
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileImage className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">لم يتم رفع قالب بعد</p>
                  </div>
                )}
              </div>
              {backgroundPreview && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveBackground}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Upload Actions */}
            <div className="space-y-3 flex-1">
              <div>
                <Label className="text-sm font-medium">رفع تصميم القالب</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  يمكنك رفع صورة (PNG, JPG, WEBP) أو ملف PDF كخلفية للفاتورة
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 ml-2" />
                {uploading ? 'جاري الرفع...' : 'رفع تصميم'}
              </Button>
              <p className="text-xs text-muted-foreground">
                الحجم الأقصى: 5 ميجابايت
              </p>
              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleBackgroundUpload}
                className="hidden"
              />

              {backgroundUrl && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ تم رفع القالب المخصص - سيتم استخدامه كخلفية للفواتير
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excel Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            استيراد بيانات من Excel
          </CardTitle>
          <CardDescription>
            استورد بيانات المنتجات والأسعار من ملف Excel لإنشاء فواتير بسرعة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => excelInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 ml-2" />
              استيراد ملف Excel
            </Button>
            <Button
              variant="secondary"
              onClick={downloadSampleExcel}
            >
              <Download className="w-4 h-4 ml-2" />
              تحميل نموذج Excel
            </Button>
          </div>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />

          {/* Excel Data Preview */}
          {parsedItems && parsedItems.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{excelFileName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({parsedItems.length} بند)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    {isEditing ? 'إنهاء التعديل' : 'تعديل البنود'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveExcel}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Editable items table */}
              {isEditing ? (
                <ExcelItemsEditor 
                  items={parsedItems} 
                  onChange={setParsedItems} 
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-right font-medium border-b">الوصف</th>
                          <th className="p-2 text-right font-medium border-b w-20">الكمية</th>
                          <th className="p-2 text-right font-medium border-b w-28">سعر الوحدة</th>
                          <th className="p-2 text-right font-medium border-b w-20">الضريبة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.slice(0, 5).map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                            <td className="p-2 border-b">{item.description}</td>
                            <td className="p-2 border-b">{item.quantity}</td>
                            <td className="p-2 border-b">{item.unitPrice.toLocaleString()}</td>
                            <td className="p-2 border-b">{item.taxRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedItems.length > 5 && (
                    <div className="p-2 bg-muted text-center text-xs text-muted-foreground">
                      + {parsedItems.length - 5} بنود إضافية
                    </div>
                  )}
                </div>
              )}

              {/* Save Excel Data */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Input
                  placeholder="اسم القالب (مثال: أسعار 2024)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={async () => {
                    if (!templateName.trim()) {
                      toast.error('يرجى إدخال اسم للقالب');
                      return;
                    }
                    if (!parsedItems || parsedItems.length === 0) {
                      toast.error('لا توجد بنود للحفظ');
                      return;
                    }
                    setSavingExcelData(true);
                    try {
                      await saveImportedData.mutateAsync({
                        name: templateName,
                        items: parsedItems,
                        fileName: excelFileName || undefined,
                      });
                      toast.success('تم حفظ بيانات القالب بنجاح');
                      setTemplateName('');
                      handleRemoveExcel();
                    } catch (error) {
                      console.error('Error saving excel data:', error);
                      toast.error('حدث خطأ أثناء حفظ البيانات');
                    } finally {
                      setSavingExcelData(false);
                    }
                  }}
                  disabled={savingExcelData || !templateName.trim()}
                >
                  <Save className="w-4 h-4 ml-2" />
                  {savingExcelData ? 'جاري الحفظ...' : 'حفظ القالب'}
                </Button>
              </div>
            </div>
          )}

          {/* Saved Templates */}
          {savedTemplates.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <Label className="text-sm font-medium">القوالب المحفوظة</Label>
              </div>
              <div className="grid gap-3">
                {savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.data.length} بند • {template.file_name || 'بدون ملف'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteImportedData.mutateAsync(template.id);
                          toast.success('تم حذف القالب');
                        } catch (error) {
                          toast.error('حدث خطأ أثناء الحذف');
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  💡 يمكنك استخدام هذه القوالب عند إنشاء فاتورة متعددة البنود من صفحة المبيعات
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">💡 نصائح لإنشاء قالب مخصص</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• استخدم تصميم بدقة عالية (300 DPI) للحصول على جودة طباعة ممتازة</li>
            <li>• اترك مساحة فارغة في الأماكن التي ستُملأ بالبيانات (الجداول، المجاميع)</li>
            <li>• تأكد من أن حجم الورق A4 (210mm × 297mm)</li>
            <li>• لأفضل نتيجة، استخدم خلفية بألوان فاتحة لضمان وضوح النصوص</li>
          </ul>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveTemplate} disabled={saving} className="min-w-[150px]">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}
