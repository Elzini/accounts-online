/**
 * Sales Invoice AI Import - Logic Hook
 */
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ParsedSalesInvoiceData, SalesBatchParsedResult } from './types';

interface UseAISalesImportProps {
  onImport: (data: ParsedSalesInvoiceData) => void;
  onBatchImport?: (results: SalesBatchParsedResult[]) => void;
  onOpenChange: (open: boolean) => void;
}

export function useAISalesImport({ onImport, onBatchImport, onOpenChange }: UseAISalesImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSalesInvoiceData | null>(null);
  const [batchResults, setBatchResults] = useState<SalesBatchParsedResult[]>([]);
  const [batchErrors, setBatchErrors] = useState<Array<{ index: number; fileName: string; error: string }>>([]);
  const [fileName, setFileName] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
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
      const { data, error } = await supabase.functions.invoke('parse-sales-invoice', {
        body: { fileContent, fileName: file.name },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setIsLoading(false); return; }
      setParsedData(data as ParsedSalesInvoiceData);
      toast.success('تم تحليل الفاتورة بنجاح');
    } catch (error: any) {
      console.error('Error parsing sales invoice:', error);
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

    setIsBatchMode(true);
    setIsLoading(true);
    setBatchResults([]);
    setBatchErrors([]);
    setTotalFiles(validFiles.length);
    setProgress(0);

    try {
      const chunkSize = 5;
      const allResults: SalesBatchParsedResult[] = [];
      const allErrors: Array<{ index: number; fileName: string; error: string }> = [];

      for (let i = 0; i < validFiles.length; i += chunkSize) {
        const chunk = validFiles.slice(i, i + chunkSize);
        const batchFiles = await Promise.all(
          chunk.map(async (file) => ({ fileContent: await fileToBase64(file), fileName: file.name }))
        );
        const { data, error } = await supabase.functions.invoke('parse-sales-invoice', {
          body: { batchFiles },
        });
        if (error) throw error;
        if (data?.results) {
          const resultsWithFiles = data.results.map((r: SalesBatchParsedResult) => {
            const file = validFiles[r.index];
            let thumbnailUrl: string | undefined;
            if (file && file.type.startsWith('image/')) thumbnailUrl = URL.createObjectURL(file);
            return { ...r, fileObject: file, thumbnailUrl };
          });
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
    if (onBatchImport) onBatchImport(successResults);
    handleClose();
  };

  const handleImportSingleFromBatch = (result: SalesBatchParsedResult) => {
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

  const formatCurrency = (val: number) => val.toFixed(2);
  const selectedBatchResult = selectedBatchIndex !== null ? batchResults.find(r => r.index === selectedBatchIndex) : null;

  return {
    isLoading, parsedData, batchResults, batchErrors,
    fileName, isBatchMode, progress, totalFiles,
    selectedBatchIndex, setSelectedBatchIndex,
    fileInputRef, batchFileInputRef,
    selectedBatchResult, formatCurrency,
    handleSingleFileSelect, handleBatchFileSelect,
    handleConfirmImport, handleConfirmBatchImport,
    handleImportSingleFromBatch, handleClose, setParsedData,
  };
}
