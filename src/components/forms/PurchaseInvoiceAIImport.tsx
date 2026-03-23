import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, AlertCircle, X, Files, ArrowLeftRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useCompanyId } from '@/hooks/useCompanyId';
import { InvoiceReconciliation, matchInvoices, ReconciliationResult, ExistingInvoice } from './InvoiceReconciliation';

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
  fileObject?: File;
  thumbnailUrl?: string;
}

interface PurchaseInvoiceAIImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ParsedInvoiceData) => void;
  onBatchImport?: (results: BatchParsedResult[], costCenterId?: string | null) => void;
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
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationResult[] | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const { data: costCenters = [] } = useCostCenters();
  const companyId = useCompanyId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const batchFilesRef = useRef<File[]>([]);

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

    // No file size limit

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
    const validFiles = fileArray.filter(f => {
      if (!f.type.startsWith('image/') && !f.name.toLowerCase().endsWith('.pdf')) {
        toast.error(`الملف ${f.name} غير مدعوم`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Store files for later upload
    batchFilesRef.current = validFiles;

    setIsBatchMode(true);
    setIsLoading(true);
    setBatchResults([]);
    setBatchErrors([]);
    setTotalFiles(validFiles.length);
    setProgress(0);

    try {
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
          // Attach file objects and generate thumbnails for images
          const resultsWithFiles = await Promise.all(data.results.map(async (r: BatchParsedResult) => {
            const globalIdx = i + (r.index - (data.results.indexOf(r) > 0 ? 0 : 0));
            const fileIdx = r.index;
            const file = validFiles[fileIdx];
            let thumbnailUrl: string | undefined;
            
            if (file && file.type.startsWith('image/')) {
              thumbnailUrl = URL.createObjectURL(file);
            } else if (file && file.name.toLowerCase().endsWith('.pdf')) {
              // For PDFs, create a data URL for the file icon placeholder
              thumbnailUrl = undefined; // Will show PDF icon
            }

            return { ...r, fileObject: file, thumbnailUrl };
          }));
          allResults.push(...resultsWithFiles);
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
    setSelectedCostCenterId(null);
    setReconciliationResults(null);
    setIsReconciling(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    onOpenChange(false);
  };

  const handleReconcile = async () => {
    if (!companyId || batchResults.length === 0) return;
    setIsReconciling(true);
    try {
      // Fetch all existing purchase invoices for this company
      const { data: existingInvoices, error } = await (supabase as any)
        .from('invoices')
        .select('id, invoice_number, supplier_invoice_number, supplier_id, customer_name, invoice_date, subtotal, total, vat_amount, status, payment_status')
        .eq('company_id', companyId)
        .eq('invoice_type', 'purchase')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const results = matchInvoices(batchResults, existingInvoices || []);
      setReconciliationResults(results);

      const matched = results.filter(r => r.matchType === 'exact').length;
      const partial = results.filter(r => r.matchType === 'partial' || r.matchType === 'amount_only').length;
      const unmatched = results.filter(r => r.matchType === 'none').length;
      
      toast.success(`تمت المطابقة: ${matched} مطابقة تامة، ${partial} جزئية، ${unmatched} غير موجودة`);
    } catch (error: any) {
      console.error('Reconciliation error:', error);
      toast.error('حدث خطأ أثناء المطابقة');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleImportFromReconciliation = (selected: BatchParsedResult[]) => {
    if (onBatchImport) {
      onBatchImport(selected, selectedCostCenterId);
    }
    handleClose();
  };

  const handleUpdateExisting = async (result: ReconciliationResult) => {
    if (!result.matchedInvoice || !companyId) return;
    const data = result.parsed.data;

    // Protected invoices cannot be edited directly
    if (['issued', 'approved', 'posted'].includes(result.matchedInvoice.status)) {
      toast.error('لا يمكن تعديل فاتورة معتمدة مباشرة، استخدم إشعار دائن للتصحيح');
      return;
    }

    try {
      const headerUpdate: Record<string, any> = {
        supplier_invoice_number: data.invoice_number || result.matchedInvoice.supplier_invoice_number,
        invoice_date: data.invoice_date || result.matchedInvoice.invoice_date,
        customer_name: data.supplier_name || result.matchedInvoice.customer_name,
        subtotal: data.subtotal ?? (data.total_amount - (data.vat_amount ?? 0)),
        vat_amount: data.vat_amount,
        total: data.total_amount,
      };

      const { error: headerError } = await (supabase as any)
        .from('invoices')
        .update(headerUpdate)
        .eq('id', result.matchedInvoice.id);

      if (headerError) throw headerError;

      if (data.items && data.items.length > 0) {
        await (supabase as any)
          .from('invoice_items')
          .delete()
          .eq('invoice_id', result.matchedInvoice.id);

        const newItems = data.items.map((item: any) => ({
          invoice_id: result.matchedInvoice!.id,
          company_id: companyId,
          description: item.description || 'بند',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          taxable_amount: item.taxable_amount || (item.quantity || 1) * (item.unit_price || 0),
          vat_rate: item.vat_rate ?? 15,
          vat_amount: item.vat_amount || 0,
          total: item.total || 0,
        }));

        const { error: itemsError } = await (supabase as any)
          .from('invoice_items')
          .insert(newItems);

        if (itemsError) throw itemsError;
      }

      if (reconciliationResults) {
        setReconciliationResults(prev => prev?.map(r =>
          r.parsed.index === result.parsed.index
            ? { ...r, matchType: 'exact' as const, matchScore: 100, differences: [] }
            : r
        ) || null);
      }

      toast.success(`تم تحديث الفاتورة ${result.matchedInvoice.invoice_number} بالبيانات المستوردة بنجاح`);
    } catch (error: any) {
      console.error('Update error:', error);
      const message = String(error?.message || 'حدث خطأ غير متوقع');
      if (message.includes('Cannot modify financial data of approved invoice')) {
        toast.error('لا يمكن تعديل فاتورة معتمدة مباشرة، استخدم إشعار دائن للتصحيح');
      } else {
        toast.error(`فشل تحديث الفاتورة: ${message}`);
      }
    }
  };

  const formatCurrency = (val: number) => val.toFixed(2);

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

          {/* Reconciliation View */}
          {reconciliationResults && !selectedBatchResult && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setReconciliationResults(null)} className="gap-1">
                ← العودة لنتائج التحليل
              </Button>
              
              {/* Cost Center Selector */}
              {costCenters.filter(cc => cc.is_active).length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                  <Label className="text-sm font-medium whitespace-nowrap">مركز التكلفة:</Label>
                  <Select value={selectedCostCenterId || 'none'} onValueChange={(v) => setSelectedCostCenterId(v === 'none' ? null : v)}>
                    <SelectTrigger className="h-9 text-xs max-w-[250px]">
                      <SelectValue placeholder="اختر مركز التكلفة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مركز تكلفة</SelectItem>
                      {costCenters.filter(cc => cc.is_active).map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <InvoiceReconciliation
                results={reconciliationResults}
                formatCurrency={formatCurrency}
                onImportSelected={handleImportFromReconciliation}
                onViewDetails={(result) => setSelectedBatchIndex(result.index)}
                onUpdateExisting={handleUpdateExisting}
                onClose={handleClose}
              />
            </div>
          )}

          {/* Batch results - detailed card view */}
          {!isLoading && isBatchMode && batchResults.length > 0 && !selectedBatchResult && !reconciliationResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  تم تحليل {batchResults.filter(r => r.success).length} فاتورة بنجاح
                  {batchErrors.length > 0 && ` | فشل ${batchErrors.length}`}
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                {batchResults.filter(r => r.success).map((result) => (
                  <BatchInvoiceCard
                    key={result.index}
                    result={result}
                    formatCurrency={formatCurrency}
                    onPreview={() => setSelectedBatchIndex(result.index)}
                    onImportSingle={() => handleImportSingleFromBatch(result)}
                  />
                ))}
                {batchErrors.map((err) => (
                  <div key={`err-${err.index}`} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex items-center gap-3">
                    <Badge variant="destructive" className="text-xs shrink-0">
                      <X className="w-3 h-3 ml-1" />فشل
                    </Badge>
                    <span className="text-xs truncate">{err.fileName}</span>
                    <span className="text-xs text-destructive">{err.error}</span>
                  </div>
                ))}
              </div>

              {/* Cost Center Selector */}
              {costCenters.filter(cc => cc.is_active).length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                  <Label className="text-sm font-medium whitespace-nowrap">مركز التكلفة:</Label>
                  <Select value={selectedCostCenterId || 'none'} onValueChange={(v) => setSelectedCostCenterId(v === 'none' ? null : v)}>
                    <SelectTrigger className="h-9 text-xs max-w-[250px]">
                      <SelectValue placeholder="اختر مركز التكلفة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مركز تكلفة</SelectItem>
                      {costCenters.filter(cc => cc.is_active).map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={handleClose}>إغلاق</Button>
                <Button 
                  variant="secondary" 
                  onClick={handleReconcile} 
                  disabled={isReconciling}
                  className="gap-2"
                >
                  {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  مطابقة مع فواتير النظام
                </Button>
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

function BatchInvoiceCard({
  result,
  formatCurrency,
  onPreview,
  onImportSingle,
}: {
  result: BatchParsedResult;
  formatCurrency: (val: number) => string;
  onPreview: () => void;
  onImportSingle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const data = result.data;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="w-12 h-16 rounded border bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
          {result.thumbnailUrl ? (
            <img src={result.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">#{result.index + 1}</span>
            <span className="text-sm font-bold truncate">{data.supplier_name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{data.invoice_number}</span>
            <span>{data.invoice_date}</span>
            <span>{data.items?.length || 0} أصناف</span>
          </div>
        </div>

        {/* Amounts */}
        <div className="text-left shrink-0 space-y-0.5">
          <div className="text-[10px] text-muted-foreground">
            صافي: <span className="font-mono">{formatCurrency(data.subtotal || (data.total_amount - (data.vat_amount || 0)))}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            ضريبة: <span className="font-mono">{formatCurrency(data.vat_amount || 0)}</span>
          </div>
          <div className="text-sm font-bold font-mono text-primary">
            {formatCurrency(data.total_amount)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onPreview}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={onImportSingle}>
            استيراد
          </Button>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && data.items && data.items.length > 0 && (
        <div className="border-t bg-muted/10 p-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-right p-1 font-medium">#</th>
                <th className="text-right p-1 font-medium">الوصف</th>
                <th className="text-center p-1 font-medium">الكمية</th>
                <th className="text-left p-1 font-medium">السعر</th>
                <th className="text-left p-1 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="p-1 text-right text-muted-foreground">{i + 1}</td>
                  <td className="p-1 text-right">{item.description}</td>
                  <td className="p-1 text-center">{item.quantity}</td>
                  <td className="p-1 text-left font-mono">{formatCurrency(item.unit_price)}</td>
                  <td className="p-1 text-left font-mono font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
