import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Loader2, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

interface PurchaseInvoiceAIImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ParsedInvoiceData) => void;
}

export function PurchaseInvoiceAIImport({ open, onOpenChange, onImport }: PurchaseInvoiceAIImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10MB)');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setParsedData(null);

    try {
      let fileContent: string;

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Convert PDF to base64 data URL
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileContent = `data:application/pdf;base64,${base64}`;
      } else if (file.type.startsWith('image/')) {
        // Convert image to base64 data URL
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileContent = `data:${file.type};base64,${base64}`;
      } else {
        toast.error('صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو صورة');
        setIsLoading(false);
        return;
      }

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

  const handleConfirmImport = () => {
    if (!parsedData) return;
    onImport(parsedData);
    handleClose();
  };

  const handleClose = () => {
    setParsedData(null);
    setFileName('');
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            استيراد فاتورة مشتريات بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            ارفع فاتورة المشتريات (PDF أو صورة) وسيتم استخراج البيانات تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          {!parsedData && (
            <div
              className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isLoading ? (
                <div className="space-y-3">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <p className="text-sm font-medium">جاري تحليل الفاتورة بالذكاء الاصطناعي...</p>
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">اضغط لرفع فاتورة المشتريات</p>
                  <p className="text-xs text-muted-foreground">PDF أو صورة (JPG, PNG) - حتى 10MB</p>
                </div>
              )}
            </div>
          )}

          {/* Parsed results */}
          {parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم استخراج البيانات بنجاح - يرجى المراجعة قبل الاعتماد</span>
              </div>

              {/* Supplier info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">المورد</p>
                  <p className="font-bold text-sm">{parsedData.supplier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رقم الفاتورة</p>
                  <p className="font-bold text-sm">{parsedData.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="text-sm">{parsedData.invoice_date}</p>
                </div>
                {parsedData.supplier_tax_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">الرقم الضريبي</p>
                    <p className="text-sm font-mono">{parsedData.supplier_tax_number}</p>
                  </div>
                )}
                {parsedData.supplier_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">الهاتف</p>
                    <p className="text-sm">{parsedData.supplier_phone}</p>
                  </div>
                )}
                {parsedData.supplier_address && (
                  <div>
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="text-sm">{parsedData.supplier_address}</p>
                  </div>
                )}
              </div>

              {/* Items table */}
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
                    {parsedData.items?.map((item, idx) => (
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

              {/* Totals */}
              <div className="flex flex-col items-start gap-1 p-4 bg-muted/30 rounded-lg border">
                {parsedData.subtotal != null && (
                  <div className="flex justify-between w-full text-sm">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-mono">{formatCurrency(parsedData.subtotal)}</span>
                  </div>
                )}
                {parsedData.discount != null && parsedData.discount > 0 && (
                  <div className="flex justify-between w-full text-sm text-red-600">
                    <span>خصم:</span>
                    <span className="font-mono">-{formatCurrency(parsedData.discount)}</span>
                  </div>
                )}
                {parsedData.vat_amount != null && (
                  <div className="flex justify-between w-full text-sm">
                    <span>ضريبة القيمة المضافة ({parsedData.vat_rate || 15}%):</span>
                    <span className="font-mono">{formatCurrency(parsedData.vat_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full text-base font-bold border-t pt-2 mt-1">
                  <span>الإجمالي:</span>
                  <span className="font-mono">{formatCurrency(parsedData.total_amount)}</span>
                </div>
              </div>

              {parsedData.notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">ملاحظات</span>
                  </div>
                  <p className="text-sm">{parsedData.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setParsedData(null); setFileName(''); }}>
                  رفع فاتورة أخرى
                </Button>
                <Button onClick={handleConfirmImport} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  اعتماد وتعبئة النموذج
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
