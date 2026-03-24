import { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { toast } from 'sonner';
import { readExcelFile, utils, writeFile } from '@/lib/excelUtils';
import { parseExcelToInvoiceItems, ImportedInvoiceItem } from '@/services/importedInvoiceData';

export function useCustomTemplate() {
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

  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company) {
      const companyData = company as any;
      if (companyData.invoice_settings?.custom_background_url) {
        setBackgroundUrl(companyData.invoice_settings.custom_background_url);
        setBackgroundPreview(companyData.invoice_settings.custom_background_url);
      }
    }
  }, [company]);

  useEffect(() => {
    if (excelData && excelData.length > 0) {
      setParsedItems(parseExcelToInvoiceItems(excelData));
    }
  }, [excelData]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setBackgroundPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setBackgroundPreview('/placeholder.svg');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-template-${companyId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('app-logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('app-logos').getPublicUrl(fileName);
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

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
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
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = worksheet.jsonData;
          if (jsonData.length === 0) { toast.error('الملف فارغ'); return; }
          setExcelData(jsonData);
          setExcelFileName(file.name);
          toast.success(`تم استيراد ${jsonData.length} سجل من الملف`);
        } catch { toast.error('حدث خطأ أثناء قراءة الملف'); }
      };
      reader.readAsArrayBuffer(file);
    } catch { toast.error('حدث خطأ أثناء قراءة الملف'); }
  };

  const handleRemoveBackground = () => {
    setBackgroundUrl(null);
    setBackgroundPreview(null);
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  };

  const handleRemoveExcel = () => {
    setExcelData(null);
    setExcelFileName(null);
    setParsedItems(null);
    setIsEditing(false);
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleSaveTemplate = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const companyData = company as any;
      const existingSettings = companyData?.invoice_settings || {};
      const updatedSettings = { ...existingSettings, custom_background_url: backgroundUrl, use_custom_template: !!backgroundUrl };
      const { error } = await supabase.from('companies').update({ invoice_settings: JSON.parse(JSON.stringify(updatedSettings)) }).eq('id', companyId);
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
      { 'اسم المنتج': 'سيارة تويوتا كامري 2024', 'الكمية': 1, 'سعر الوحدة': 85000, 'نسبة الضريبة': 15, 'الإجمالي': 97750 },
      { 'اسم المنتج': 'سيارة هوندا أكورد 2024', 'الكمية': 1, 'سعر الوحدة': 78000, 'نسبة الضريبة': 15, 'الإجمالي': 89700 },
    ];
    const worksheet = utils.json_to_sheet(sampleData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'بيانات الفاتورة');
    await writeFile(workbook, 'نموذج_بيانات_الفاتورة.xlsx');
    toast.success('تم تحميل النموذج بنجاح');
  };

  return {
    backgroundUrl, backgroundPreview, excelFileName, uploading, saving, templateName, setTemplateName,
    savingExcelData, setSavingExcelData, parsedItems, setParsedItems, isEditing, setIsEditing,
    backgroundInputRef, excelInputRef,
    handleBackgroundUpload, handleExcelUpload, handleRemoveBackground, handleRemoveExcel,
    handleSaveTemplate, downloadSampleExcel,
  };
}
