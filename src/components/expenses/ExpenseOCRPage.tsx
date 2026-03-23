import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, FileText, Trash2, CheckCircle2, Eye, Receipt, ScanLine } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/hooks/modules/useMiscServices';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScannedExpense {
  id: string;
  imageUrl: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  status: 'pending' | 'saved' | 'error';
  isProcessing: boolean;
}

export function ExpenseOCRPage() {
  const { companyId } = useCompany();
  const [expenses, setExpenses] = useState<ScannedExpense[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    const id = crypto.randomUUID();
    const imageUrl = URL.createObjectURL(file);

    const newExpense: ScannedExpense = {
      id,
      imageUrl,
      vendor: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'عام',
      description: '',
      status: 'pending',
      isProcessing: true,
    };
    setExpenses(prev => [newExpense, ...prev]);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call AI to extract data
      const { data, error } = await supabase.functions.invoke('expense-ocr', {
        body: { image: base64 },
      });

      if (error) throw error;

      setExpenses(prev =>
        prev.map(e =>
          e.id === id
            ? {
                ...e,
                vendor: data?.vendor || 'غير محدد',
                amount: data?.amount || 0,
                date: data?.date || e.date,
                category: data?.category || 'عام',
                description: data?.description || '',
                isProcessing: false,
              }
            : e
        )
      );
      toast.success('تم استخراج بيانات الفاتورة بنجاح');
    } catch (error) {
      console.error('OCR Error:', error);
      setExpenses(prev =>
        prev.map(e => (e.id === id ? { ...e, isProcessing: false, status: 'error' } : e))
      );
      toast.error('فشل في استخراج البيانات - يمكنك إدخالها يدوياً');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await processImage(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const updateExpense = (id: string, field: keyof ScannedExpense, value: any) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const saveExpense = async (expense: ScannedExpense) => {
    if (!companyId) return;
    try {
      const { error } = await supabase.from('expenses').insert({
        company_id: companyId,
        vendor_name: expense.vendor,
        amount: expense.amount,
        expense_date: expense.date,
        category: expense.category,
        description: expense.description || `فاتورة من ${expense.vendor}`,
        payment_method: 'cash',
        status: 'approved',
      });

      if (error) throw error;

      setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, status: 'saved' } : e)));
      toast.success('تم حفظ المصروف بنجاح');
    } catch (error: any) {
      toast.error(`خطأ في الحفظ: ${error.message}`);
    }
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-6 h-6" />
            تتبع المصروفات بالصور (OCR)
          </h1>
          <p className="text-muted-foreground">التقط صورة للفاتورة وسيتم استخراج البيانات تلقائياً بالذكاء الاصطناعي</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex gap-3">
              <Button size="lg" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-5 h-5 ml-2" />
                التقاط صورة
              </Button>
              <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5 ml-2" />
                رفع ملف
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">يدعم JPG, PNG, PDF - حد أقصى 10 ميجا</p>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scanned Expenses */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              المصروفات المستخرجة ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map(expense => (
                <div key={expense.id} className="border rounded-lg p-4 bg-card">
                  {expense.isProcessing ? (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">جاري استخراج البيانات بالذكاء الاصطناعي...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-16 h-16 p-0 border rounded overflow-hidden"
                          onClick={() => setPreviewImage(expense.imageUrl)}
                        >
                          <img src={expense.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs">المورد/المتجر</Label>
                        <Input
                          value={expense.vendor}
                          onChange={e => updateExpense(expense.id, 'vendor', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">المبلغ</Label>
                        <Input
                          type="number"
                          value={expense.amount}
                          onChange={e => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التاريخ</Label>
                        <Input
                          type="date"
                          value={expense.date}
                          onChange={e => updateExpense(expense.id, 'date', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التصنيف</Label>
                        <Input
                          value={expense.category}
                          onChange={e => updateExpense(expense.id, 'category', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="flex gap-1">
                        {expense.status === 'saved' ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 ml-1" /> تم الحفظ
                          </Badge>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => saveExpense(expense)} className="h-8">حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => removeExpense(expense.id)} className="h-8 text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>صورة الفاتورة</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="receipt preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
