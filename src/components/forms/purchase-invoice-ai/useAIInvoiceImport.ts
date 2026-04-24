/**
 * AI Invoice Import - Logic Hook
 * Extracted from PurchaseInvoiceAIImport.tsx (800 lines)
 */
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useCompanyId } from '@/hooks/useCompanyId';
import { matchInvoices, ReconciliationResult } from '../InvoiceReconciliation';
import type { ParsedInvoiceData, BatchParsedResult, BatchTimelineEntry } from './types';

interface UseAIInvoiceImportProps {
  onImport: (data: ParsedInvoiceData) => void;
  onBatchImport?: (results: BatchParsedResult[], costCenterId?: string | null) => void;
  onOpenChange: (open: boolean) => void;
}

export function useAIInvoiceImport({ onImport, onBatchImport, onOpenChange }: UseAIInvoiceImportProps) {
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
  const [batchTimeline, setBatchTimeline] = useState<BatchTimelineEntry[]>([]);
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
      if (data?.error) { toast.error(data.error); setIsLoading(false); return; }

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

    batchFilesRef.current = validFiles;
    setIsBatchMode(true);
    setIsLoading(true);
    setBatchResults([]);
    setBatchErrors([]);
    setTotalFiles(validFiles.length);
    setProgress(0);

    try {
      // ===== إعدادات الحجم التكيّفي (Adaptive Chunk Size) =====
      const INITIAL_CHUNK_SIZE = 8;     // الحجم الافتراضي
      const MIN_CHUNK_SIZE = 1;          // أدنى حد عند الفشل المتكرر
      const MAX_CHUNK_SIZE = 8;          // أقصى حد عند التعافي
      const SHRINK_FACTOR = 2;           // عند timeout: نقسم الحجم على 2 (8→4→2→1)
      const RECOVERY_THRESHOLD = 2;      // عدد الدفعات الناجحة المتتالية قبل التوسيع
      const GROW_STEP = 2;               // زيادة الحجم عند التعافي

      const MAX_RETRIES = 3;             // عدد محاولات إعادة المعالجة لنفس الدفعة
      const RETRY_BASE_DELAY_MS = 1500;  // backoff أولي

      let currentChunkSize = INITIAL_CHUNK_SIZE;
      let consecutiveSuccesses = 0;

      const allResults: BatchParsedResult[] = [];
      const allErrors: Array<{ index: number; fileName: string; error: string }> = [];

      const isRetriableError = (err: any): boolean => {
        const msg = String(err?.message || err || '').toLowerCase();
        return (
          msg.includes('timeout') ||
          msg.includes('timed out') ||
          msg.includes('network') ||
          msg.includes('fetch') ||
          msg.includes('failed to fetch') ||
          msg.includes('aborted') ||
          msg.includes('econnreset') ||
          msg.includes('503') ||
          msg.includes('504') ||
          msg.includes('429') ||
          msg.includes('rate limit')
        );
      };

      const isTimeoutError = (err: any): boolean => {
        const msg = String(err?.message || err || '').toLowerCase();
        return msg.includes('timeout') || msg.includes('timed out') || msg.includes('504') || msg.includes('aborted');
      };

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      let cursor = 0;
      let chunkNumber = 0;

      while (cursor < validFiles.length) {
        chunkNumber++;
        const chunk = validFiles.slice(cursor, cursor + currentChunkSize);
        const chunkStartIndex = cursor;
        const sizeUsedForThisChunk = chunk.length;

        let attempt = 0;
        let success = false;
        let lastError: any = null;
        let lastWasTimeout = false;

        while (attempt < MAX_RETRIES && !success) {
          attempt++;
          try {
            const batchFiles = await Promise.all(
              chunk.map(async (file) => ({ fileContent: await fileToBase64(file), fileName: file.name }))
            );

            const resp = await supabase.functions.invoke('parse-purchase-invoice', {
              body: { batchFiles },
            });

            if (resp.error) throw resp.error;
            const respData = resp.data;

            if (respData?.results) {
              const resultsWithFiles = await Promise.all(respData.results.map(async (r: BatchParsedResult) => {
                const globalIndex = chunkStartIndex + r.index;
                const file = validFiles[globalIndex];
                let thumbnailUrl: string | undefined;
                if (file && file.type.startsWith('image/')) {
                  thumbnailUrl = URL.createObjectURL(file);
                }
                return { ...r, index: globalIndex, fileObject: file, thumbnailUrl };
              }));
              allResults.push(...resultsWithFiles);
            }
            if (respData?.errors) {
              const remappedErrors = respData.errors.map((er: any) => ({
                ...er,
                index: chunkStartIndex + er.index,
                fileName: validFiles[chunkStartIndex + er.index]?.name || er.fileName,
              }));
              allErrors.push(...remappedErrors);
            }
            success = true;
            if (attempt > 1) {
              toast.success(`نجحت الدفعة ${chunkNumber} في المحاولة ${attempt}`);
            }
          } catch (chunkError: any) {
            lastError = chunkError;
            lastWasTimeout = isTimeoutError(chunkError);
            const retriable = isRetriableError(chunkError);
            console.warn(
              `Chunk ${chunkNumber} (size=${sizeUsedForThisChunk}) attempt ${attempt}/${MAX_RETRIES} failed${retriable ? ' (retriable)' : ''}:`,
              chunkError?.message || chunkError
            );

            if (retriable && attempt < MAX_RETRIES) {
              const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
              toast.info(`الدفعة ${chunkNumber} فشلت. إعادة المحاولة ${attempt + 1}/${MAX_RETRIES} بعد ${Math.round(delay / 1000)}ث...`);
              await sleep(delay);
              continue;
            }
            break;
          }
        }

        if (success) {
          // تقدّم المؤشر وحدّث منطق التعافي
          cursor += sizeUsedForThisChunk;
          consecutiveSuccesses++;

          // تعافي تدريجي: زِد الحجم بعد عدد كافٍ من النجاحات المتتالية
          if (
            consecutiveSuccesses >= RECOVERY_THRESHOLD &&
            currentChunkSize < MAX_CHUNK_SIZE
          ) {
            const newSize = Math.min(MAX_CHUNK_SIZE, currentChunkSize + GROW_STEP);
            if (newSize !== currentChunkSize) {
              console.info(`Adaptive: تعافي — رفع حجم الدفعة من ${currentChunkSize} إلى ${newSize}`);
              toast.info(`📈 تحسّن الأداء — رفع حجم الدفعة إلى ${newSize}`);
              currentChunkSize = newSize;
              consecutiveSuccesses = 0;
            }
          }
        } else {
          // فشل بعد كل المحاولات — إذا كان timeout وحجم الدفعة > MIN، قلّص وأعد المحاولة على نفس النطاق
          consecutiveSuccesses = 0;

          if (lastWasTimeout && currentChunkSize > MIN_CHUNK_SIZE) {
            const newSize = Math.max(MIN_CHUNK_SIZE, Math.floor(currentChunkSize / SHRINK_FACTOR));
            console.warn(`Adaptive: timeout — تقليص حجم الدفعة من ${currentChunkSize} إلى ${newSize} وإعادة المحاولة`);
            toast.warning(`📉 timeout — تقليص حجم الدفعة من ${currentChunkSize} إلى ${newSize} وإعادة المحاولة...`);
            currentChunkSize = newSize;
            // لا نحرّك cursor — سنعيد محاولة نفس الملفات بحجم أصغر
            await sleep(1000);
            continue;
          }

          // غير timeout أو وصلنا للحد الأدنى — سجّل الأخطاء واستمر
          console.error(`Chunk ${chunkNumber} failed after ${attempt} attempts:`, lastError);
          chunk.forEach((file, idx) => {
            allErrors.push({
              index: chunkStartIndex + idx,
              fileName: file.name,
              error: `${lastError?.message || 'فشل معالجة الدفعة'} (بعد ${attempt} محاولات، حجم=${sizeUsedForThisChunk})`,
            });
          });
          cursor += sizeUsedForThisChunk;
        }

        setProgress(Math.min(cursor, validFiles.length));
        setBatchResults([...allResults]);
        setBatchErrors([...allErrors]);
      }

      const successCount = allResults.filter(r => r.success).length;
      toast.success(`تم تحليل ${successCount} من ${validFiles.length} فاتورة بنجاح`);
      if (allErrors.length > 0) toast.error(`فشل تحليل ${allErrors.length} فاتورة`);
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
    if (onBatchImport) onBatchImport(successResults, selectedCostCenterId);
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
    if (onBatchImport) onBatchImport(selected, selectedCostCenterId);
    handleClose();
  };

  const handleUpdateExisting = async (result: ReconciliationResult) => {
    if (!result.matchedInvoice || !companyId) return;
    const data = result.parsed.data;

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
        .from('invoices').update(headerUpdate).eq('id', result.matchedInvoice.id);
      if (headerError) throw headerError;

      if (data.items && data.items.length > 0) {
        await (supabase as any).from('invoice_items').delete().eq('invoice_id', result.matchedInvoice.id);
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
        const { error: itemsError } = await (supabase as any).from('invoice_items').insert(newItems);
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

  // Update an entry in the batch results (used by the edit dialog)
  const handleUpdateBatchResult = (updated: BatchParsedResult) => {
    setBatchResults(prev => prev.map(r => r.index === updated.index ? updated : r));
  };

  return {
    isLoading, parsedData, batchResults, batchErrors,
    fileName, isBatchMode, progress, totalFiles,
    selectedBatchIndex, setSelectedBatchIndex,
    selectedCostCenterId, setSelectedCostCenterId,
    reconciliationResults, setReconciliationResults,
    isReconciling, costCenters, companyId,
    fileInputRef, batchFileInputRef,
    selectedBatchResult, formatCurrency,
    handleSingleFileSelect, handleBatchFileSelect,
    handleConfirmImport, handleConfirmBatchImport,
    handleImportSingleFromBatch, handleClose,
    handleReconcile, handleImportFromReconciliation,
    handleUpdateExisting, setParsedData,
    handleUpdateBatchResult,
  };
}
