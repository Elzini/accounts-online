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
import type { ParsedInvoiceData, BatchParsedResult } from './types';

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
      const chunkSize = 5;
      const allResults: BatchParsedResult[] = [];
      const allErrors: Array<{ index: number; fileName: string; error: string }> = [];

      for (let i = 0; i < validFiles.length; i += chunkSize) {
        const chunk = validFiles.slice(i, i + chunkSize);
        const batchFiles = await Promise.all(
          chunk.map(async (file) => ({ fileContent: await fileToBase64(file), fileName: file.name }))
        );

        const { data, error } = await supabase.functions.invoke('parse-purchase-invoice', {
          body: { batchFiles },
        });

        if (error) throw error;

        if (data?.results) {
          const resultsWithFiles = await Promise.all(data.results.map(async (r: BatchParsedResult) => {
            const file = validFiles[r.index];
            let thumbnailUrl: string | undefined;
            if (file && file.type.startsWith('image/')) {
              thumbnailUrl = URL.createObjectURL(file);
            }
            return { ...r, fileObject: file, thumbnailUrl };
          }));
          allResults.push(...resultsWithFiles);
        }
        if (data?.errors) allErrors.push(...data.errors);

        setProgress(Math.min(i + chunkSize, validFiles.length));
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
  };
}
