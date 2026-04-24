/**
 * EditBatchInvoiceDialog
 * Allows editing supplier + invoice data and attaching/replacing the invoice file
 * for an AI-parsed batch result before final import.
 */
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, Upload, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import type { BatchParsedResult, ParsedInvoiceData } from './types';

interface EditBatchInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchParsedResult | null;
  onSave: (updated: BatchParsedResult) => void;
}

export function EditBatchInvoiceDialog({ open, onOpenChange, result, onSave }: EditBatchInvoiceDialogProps) {
  const [data, setData] = useState<ParsedInvoiceData | null>(null);
  const [fileObject, setFileObject] = useState<File | undefined>(undefined);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | 'none'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result) {
      setData(JSON.parse(JSON.stringify(result.data)));
      setFileObject(result.fileObject);
      buildPreview(result.fileObject, result.thumbnailUrl);
    } else {
      setData(null);
      setFileObject(undefined);
      setAttachmentUrl(undefined);
      setAttachmentType('none');
    }
  }, [result]);

  const buildPreview = (file?: File, fallback?: string) => {
    if (!file) {
      if (fallback) {
        setAttachmentUrl(fallback);
        setAttachmentType('image');
      } else {
        setAttachmentUrl(undefined);
        setAttachmentType('none');
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setAttachmentUrl(url);
    if (file.type.startsWith('image/')) setAttachmentType('image');
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) setAttachmentType('pdf');
    else setAttachmentType('none');
  };

  const handleFileReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObject(file);
    buildPreview(file);
  };

  const updateField = <K extends keyof ParsedInvoiceData>(key: K, value: ParsedInvoiceData[K]) => {
    if (!data) return;
    setData({ ...data, [key]: value });
  };

  const updateItem = (idx: number, field: 'description' | 'quantity' | 'unit_price' | 'total', value: any) => {
    if (!data) return;
    const items = [...data.items];
    const item = { ...items[idx], [field]: field === 'description' ? value : Number(value) || 0 };
    if (field === 'quantity' || field === 'unit_price') {
      item.total = Number(item.quantity || 0) * Number(item.unit_price || 0);
    }
    items[idx] = item;
    setData({ ...data, items });
    recalcTotals(items, data.vat_rate);
  };

  const recalcTotals = (items: ParsedInvoiceData['items'], vatRate?: number) => {
    if (!data) return;
    const rate = vatRate ?? data.vat_rate ?? 15;
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const vat = +(subtotal * (rate / 100)).toFixed(2);
    setData(prev => prev ? { ...prev, items, subtotal, vat_amount: vat, vat_rate: rate, total_amount: +(subtotal + vat).toFixed(2) } : prev);
  };

  const addItem = () => {
    if (!data) return;
    const items = [...data.items, { description: '', quantity: 1, unit_price: 0, total: 0 }];
    setData({ ...data, items });
  };

  const removeItem = (idx: number) => {
    if (!data) return;
    const items = data.items.filter((_, i) => i !== idx);
    setData({ ...data, items });
    recalcTotals(items, data.vat_rate);
  };

  const handleSave = () => {
    if (!result || !data) return;
    onSave({ ...result, data, fileObject, thumbnailUrl: attachmentType === 'image' ? attachmentUrl : result.thumbnailUrl });
    onOpenChange(false);
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            تعديل بيانات الفاتورة المستوردة
          </DialogTitle>
          <DialogDescription>
            عدّل بيانات المورد والفاتورة وأرفق/استبدل صورة الفاتورة قبل الاستيراد النهائي
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">البيانات</TabsTrigger>
            <TabsTrigger value="items">الأصناف ({data.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="attachment" className="gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              المرفق
            </TabsTrigger>
          </TabsList>

          {/* === Tab: بيانات المورد والفاتورة === */}
          <TabsContent value="data" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المورد *</Label>
                <Input value={data.supplier_name || ''} onChange={(e) => updateField('supplier_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الرقم الضريبي للمورد</Label>
                <Input value={data.supplier_tax_number || ''} onChange={(e) => updateField('supplier_tax_number', e.target.value)} dir="ltr" placeholder="3xxxxxxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>هاتف المورد</Label>
                <Input value={data.supplier_phone || ''} onChange={(e) => updateField('supplier_phone', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>عنوان المورد</Label>
                <Input value={data.supplier_address || ''} onChange={(e) => updateField('supplier_address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>رقم فاتورة المورد *</Label>
                <Input value={data.invoice_number || ''} onChange={(e) => updateField('invoice_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الفاتورة *</Label>
                <Input type="date" value={data.invoice_date || ''} onChange={(e) => updateField('invoice_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" value={data.due_date || ''} onChange={(e) => updateField('due_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>نسبة الضريبة %</Label>
                <Input type="number" step="0.01" value={data.vat_rate ?? 15} onChange={(e) => recalcTotals(data.items, Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <Label>المجموع قبل الضريبة</Label>
                <Input type="number" step="0.01" value={data.subtotal ?? ''} onChange={(e) => updateField('subtotal', Number(e.target.value))} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>مبلغ الضريبة</Label>
                <Input type="number" step="0.01" value={data.vat_amount ?? ''} onChange={(e) => updateField('vat_amount', Number(e.target.value))} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>الإجمالي شامل الضريبة</Label>
                <Input type="number" step="0.01" value={data.total_amount ?? ''} onChange={(e) => updateField('total_amount', Number(e.target.value))} className="font-mono font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={data.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={2} />
            </div>
          </TabsContent>

          {/* === Tab: الأصناف === */}
          <TabsContent value="items" className="space-y-3 pt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10 text-right">#</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="w-24 text-center">الكمية</TableHead>
                    <TableHead className="w-32 text-left">سعر الوحدة</TableHead>
                    <TableHead className="w-32 text-left">الإجمالي</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-right text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell><Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="h-8 text-center font-mono" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} className="h-8 text-left font-mono" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={item.total} onChange={(e) => updateItem(idx, 'total', e.target.value)} className="h-8 text-left font-mono font-medium" /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="w-4 h-4" />
              إضافة صنف
            </Button>
          </TabsContent>

          {/* === Tab: المرفق === */}
          <TabsContent value="attachment" className="space-y-4 pt-4">
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileReplace} className="hidden" />

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                {attachmentType === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-primary shrink-0" />
                ) : attachmentType === 'pdf' ? (
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Paperclip className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fileObject?.name || result?.fileName || 'لا يوجد مرفق'}</p>
                  {fileObject && (
                    <p className="text-xs text-muted-foreground">
                      {(fileObject.size / 1024).toFixed(1)} KB · {fileObject.type || 'غير محدد'}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1 shrink-0">
                <Upload className="w-4 h-4" />
                {fileObject || attachmentUrl ? 'استبدال' : 'إرفاق'}
              </Button>
            </div>

            {/* Preview */}
            {attachmentType === 'image' && attachmentUrl && (
              <div className="border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center max-h-[480px]">
                <img src={attachmentUrl} alt="معاينة الفاتورة" className="max-w-full max-h-[480px] object-contain" />
              </div>
            )}
            {attachmentType === 'pdf' && attachmentUrl && (
              <div className="border rounded-lg overflow-hidden bg-muted/20">
                <iframe src={attachmentUrl} title="معاينة PDF" className="w-full h-[480px]" />
              </div>
            )}
            {attachmentType === 'none' && !attachmentUrl && (
              <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد صورة مرفقة لهذه الفاتورة</p>
                <p className="text-xs mt-1">استخدم زر "إرفاق" أعلاه لإضافة صورة الفاتورة الأصلية</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            حفظ التعديلات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
