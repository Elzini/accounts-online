import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, AlertCircle, X, Files } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCostCenters } from '@/hooks/useCostCenters';

export interface ParsedInvoiceData {
  supplier_name: string;
  supplier_tax_number?: string;
  supplier_phone?: string;
  supplier_address?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal?: number;
  vat_amount?: number;
  vat_rate?: number;
  total_amount: number;
  discount?: number;
  notes?: string;
  price_includes_tax?: boolean;
}

export interface BatchParsedResult {
  index: number;
  fileName: string;
  data: ParsedInvoiceData;
  success: boolean;
}

interface PurchaseInvoiceAIImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ParsedInvoiceData) => void;
  onBatchImport?: (results: BatchParsedResult[]) => void;
}

export function PurchaseInvoiceAIImport({ open, onOpenChange, onImport, onBatchImport }: PurchaseInvoiceAIImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [batchResults, setBatchResults] = useState<BatchParsedResult[]>([]);
  const [batchErrors, setBatchErrors] = useState<Array<{ index: number; fileName: string; error: string }>>([]);
  const [fileName, setFileName] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(null);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string | null>(null);
  const { data: costCenters = [] } = useCostCenters();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    return `data:${mimeType};base64,${base64}`;
  };

  const handleSingleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10MB)');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setParsedData(null);
    setIsBatchMode(false);

    try {
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو صورة');
        setIsLoading(false);
        return;
      }

      const fileContent = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('parse-purchase-invoice', {
        body: { fileContent, fileName: file.name },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      setParsedData(data as ParsedInvoiceData);
      toast.success('تم تحليل الفاتورة بنجاح');
    } catch (error: any) {
      console.error('Error parsing invoice:', error);
      toast.error('حدث خطأ أثناء تحليل الفاتورة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024;

    // Validate files
    const validFiles = fileArray.filter(f => {
      if (f.size > maxSize) {
        toast.error(`الملف ${f.name} كبير جداً`);
        return false;
      }
      if (!f.type.startsWith('image/') && !f.name.toLowerCase().endsWith('.pdf')) {
        toast.error(`الملف ${f.name} غير مدعوم`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsBatchMode(true);
    setIsLoading(true);
    setBatchResults([]);
    setBatchErrors([]);
    setTotalFiles(validFiles.length);
    setProgress(0);

    try {
      // Process in chunks of 5 to avoid rate limits
      const chunkSize = 5;
      const allResults: BatchParsedResult[] = [];
      const allErrors: Array<{ index: number; fileName: string; error: string }> = [];

      for (let i = 0; i < validFiles.length; i += chunkSize) {
        const chunk = validFiles.slice(i, i + chunkSize);
        
        const batchFiles = await Promise.all(
          chunk.map(async (file) => ({
            fileContent: await fileToBase64(file),
            fileName: file.name,
          }))
        );

        const { data, error } = await supabase.functions.invoke('parse-purchase-invoice', {
          body: { batchFiles },
        });

        if (error) throw error;

        if (data?.results) {
          allResults.push(...data.results);
        }
        if (data?.errors) {
          allErrors.push(...data.errors);
        }

        setProgress(Math.min(i + chunkSize, validFiles.length));
        setBatchResults([...allResults]);
        setBatchErrors([...allErrors]);
      }

      const successCount = allResults.filter(r => r.success).length;
      toast.success(`تم تحليل ${successCount} من ${validFiles.length} فاتورة بنجاح`);
      if (allErrors.length > 0) {
        toast.error(`فشل تحليل ${allErrors.length} فاتورة`);
      }
    } catch (error: any) {
      console.error('Batch parsing error:', error);
      toast.error('حدث خطأ أثناء تحليل الفواتير');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;
    onImport(parsedData);
    handleClose();
  };

  const handleConfirmBatchImport = () => {
    if (batchResults.length === 0) return;
    const successResults = batchResults.filter(r => r.success);
    if (onBatchImport) {
      onBatchImport(successResults, selectedCostCenterId);
    }
    handleClose();
  };

  const handleImportSingleFromBatch = (result: BatchParsedResult) => {
    onImport(result.data);
    handleClose();
  };

  const handleClose = () => {
    setParsedData(null);
    setBatchResults([]);
    setBatchErrors([]);
    setFileName('');
    setIsLoading(false);
    setIsBatchMode(false);
    setProgress(0);
    setTotalFiles(0);
    setSelectedBatchIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    onOpenChange(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const selectedBatchResult = selectedBatchIndex !== null ? batchResults.find(r => r.index === selectedBatchIndex) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            استيراد فواتير مشتريات بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            ارفع فاتورة واحدة أو عدة فواتير (حتى 40+) وسيتم استخراج البيانات تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          {!parsedData && batchResults.length === 0 && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Single file upload */}
              <div
                className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleSingleFileSelect}
                  className="hidden"
                />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">رفع فاتورة واحدة</p>
                <p className="text-xs text-muted-foreground mt-1">PDF أو صورة</p>
              </div>

              {/* Batch file upload */}
              <div
                className="border-2 border-dashed border-accent/50 rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                onClick={() => batchFileInputRef.current?.click()}
              >
                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleBatchFileSelect}
                  className="hidden"
                />
                <Files className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">رفع عدة فواتير دفعة واحدة</p>
                <p className="text-xs text-muted-foreground mt-1">اختر عدة ملفات PDF أو صور</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              {isBatchMode ? (
                <>
                  <p className="text-sm font-medium">جاري تحليل الفواتير بالذكاء الاصطناعي...</p>
                  <div className="max-w-xs mx-auto space-y-2">
                    <Progress value={(progress / totalFiles) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{progress} من {totalFiles} فاتورة</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">جاري تحليل الفاتورة بالذكاء الاصطناعي...</p>
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                </>
              )}
            </div>
          )}

          {/* Single parsed result */}
          {parsedData && !isBatchMode && (
            <SingleInvoicePreview
              data={parsedData}
              formatCurrency={formatCurrency}
              onReset={() => { setParsedData(null); setFileName(''); }}
              onConfirm={handleConfirmImport}
            />
          )}

          {/* Batch results */}
          {!isLoading && isBatchMode && batchResults.length > 0 && !selectedBatchResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  تم تحليل {batchResults.filter(r => r.success).length} فاتورة بنجاح
                  {batchErrors.length > 0 && ` | فشل ${batchErrors.length}`}
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-right w-10">#</TableHead>
                      <TableHead className="text-right">الملف</TableHead>
                      <TableHead className="text-right">المورد</TableHead>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-left">الإجمالي</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchResults.filter(r => r.success).map((result) => (
                      <TableRow key={result.index} className="hover:bg-muted/20">
                        <TableCell className="text-right text-muted-foreground">{result.index + 1}</TableCell>
                        <TableCell className="text-right text-xs truncate max-w-[120px]">{result.fileName}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{result.data.supplier_name}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{result.data.invoice_number}</TableCell>
                        <TableCell className="text-right text-sm">{result.data.invoice_date}</TableCell>
                        <TableCell className="text-left font-mono text-sm">{formatCurrency(result.data.total_amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            نجح
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBatchIndex(result.index)}
                              className="text-xs h-7 px-2"
                            >
                              معاينة
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportSingleFromBatch(result)}
                              className="text-xs h-7 px-2"
                            >
                              استيراد
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {batchErrors.map((err) => (
                      <TableRow key={`err-${err.index}`} className="bg-destructive/5">
                        <TableCell className="text-right text-muted-foreground">{err.index + 1}</TableCell>
                        <TableCell className="text-right text-xs truncate max-w-[120px]">{err.fileName}</TableCell>
                        <TableCell colSpan={4} className="text-right text-sm text-destructive">{err.error}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="text-xs">
                            <X className="w-3 h-3 ml-1" />
                            فشل
                          </Badge>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={handleClose}>إغلاق</Button>
                {onBatchImport && (
                  <Button onClick={handleConfirmBatchImport} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    استيراد الكل ({batchResults.filter(r => r.success).length} فاتورة)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Batch single preview */}
          {selectedBatchResult && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedBatchIndex(null)} className="gap-1">
                ← العودة للقائمة
              </Button>
              <SingleInvoicePreview
                data={selectedBatchResult.data}
                formatCurrency={formatCurrency}
                onReset={() => setSelectedBatchIndex(null)}
                onConfirm={() => handleImportSingleFromBatch(selectedBatchResult)}
                confirmLabel="استيراد هذه الفاتورة"
                resetLabel="العودة للقائمة"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SingleInvoicePreview({
  data,
  formatCurrency,
  onReset,
  onConfirm,
  confirmLabel = 'اعتماد وتعبئة النموذج',
  resetLabel = 'رفع فاتورة أخرى',
}: {
  data: ParsedInvoiceData;
  formatCurrency: (val: number) => string;
  onReset: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  resetLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">تم استخراج البيانات بنجاح - يرجى المراجعة قبل الاعتماد</span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
        <div>
          <p className="text-xs text-muted-foreground">المورد</p>
          <p className="font-bold text-sm">{data.supplier_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">رقم الفاتورة</p>
          <p className="font-bold text-sm">{data.invoice_number}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">التاريخ</p>
          <p className="text-sm">{data.invoice_date}</p>
        </div>
        {data.supplier_tax_number && (
          <div>
            <p className="text-xs text-muted-foreground">الرقم الضريبي</p>
            <p className="text-sm font-mono">{data.supplier_tax_number}</p>
          </div>
        )}
        {data.supplier_phone && (
          <div>
            <p className="text-xs text-muted-foreground">الهاتف</p>
            <p className="text-sm">{data.supplier_phone}</p>
          </div>
        )}
        {data.supplier_address && (
          <div>
            <p className="text-xs text-muted-foreground">العنوان</p>
            <p className="text-sm">{data.supplier_address}</p>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-center">الكمية</TableHead>
              <TableHead className="text-left">سعر الوحدة</TableHead>
              <TableHead className="text-left">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-right text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="text-right">{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-left font-mono">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell className="text-left font-mono font-medium">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-start gap-1 p-4 bg-muted/30 rounded-lg border">
        {data.subtotal != null && (
          <div className="flex justify-between w-full text-sm">
            <span>المجموع قبل الضريبة:</span>
            <span className="font-mono">{formatCurrency(data.subtotal)}</span>
          </div>
        )}
        {data.discount != null && data.discount > 0 && (
          <div className="flex justify-between w-full text-sm text-red-600">
            <span>خصم:</span>
            <span className="font-mono">-{formatCurrency(data.discount)}</span>
          </div>
        )}
        {data.vat_amount != null && (
          <div className="flex justify-between w-full text-sm">
            <span>ضريبة القيمة المضافة ({data.vat_rate || 15}%):</span>
            <span className="font-mono">{formatCurrency(data.vat_amount)}</span>
          </div>
        )}
        <div className="flex justify-between w-full text-base font-bold border-t pt-2 mt-1">
          <span>الإجمالي:</span>
          <span className="font-mono">{formatCurrency(data.total_amount)}</span>
        </div>
      </div>

      {data.notes && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">ملاحظات</span>
          </div>
          <p className="text-sm">{data.notes}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onReset}>
          {resetLabel}
        </Button>
        <Button onClick={onConfirm} className="gap-2">
          <CheckCircle className="w-4 h-4" />
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
