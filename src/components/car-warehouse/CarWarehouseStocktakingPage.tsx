import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Warehouse, Car, Image, Trash2, Upload, Calendar, Images, X, Loader2, ScanLine, Printer, GitCompare, FileSpreadsheet, MapPin, Search } from 'lucide-react';
import { WarehouseReconciliation } from './WarehouseReconciliation';
import { usePartnerDealerships } from '@/hooks/useTransfers';
import { usePrintReport } from '@/hooks/usePrintReport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import {
  fetchWarehouseCarInventory,
  addWarehouseCarEntry,
  deleteWarehouseCarEntry,
  uploadChassisImage,
  updateWarehouseCarEntry,
} from '@/services/carDealership/warehouseInventory';

interface BulkEntry {
  id: string;
  file: File;
  preview: string;
  car_type: string;
  car_color: string;
  chassis_number: string;
  entry_date: string;
  location: string;
  notes: string;
}

export function CarWarehouseStocktakingPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { data: partnerDealerships = [] } = usePartnerDealerships();
  const [form, setForm] = useState({
    car_type: '', car_color: '', chassis_number: '', entry_date: new Date().toISOString().split('T')[0],
    exit_date: '', price: '', notes: '', location: 'warehouse',
  });
  const { printReport } = usePrintReport();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkEntries, setBulkEntries] = useState<BulkEntry[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [bulkExtracting, setBulkExtracting] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['warehouse-car-inventory', companyId],
    queryFn: () => fetchWarehouseCarInventory(companyId!),
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      // Check duplicate chassis number
      const duplicate = entries.find(e => e.chassis_number === form.chassis_number && !e.exit_date);
      if (duplicate) {
        throw new Error('DUPLICATE_CHASSIS');
      }
      let imageUrl: string | undefined;
      if (imageFile && companyId) {
        imageUrl = await uploadChassisImage(companyId, imageFile);
      }
      await addWarehouseCarEntry(companyId!, {
        car_type: form.car_type,
        car_color: form.car_color || undefined,
        chassis_number: form.chassis_number,
        chassis_image_url: imageUrl,
        entry_date: form.entry_date,
        exit_date: form.exit_date || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        notes: form.notes || undefined,
        location: form.location || 'warehouse',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-car-inventory'] });
      toast.success('تمت إضافة السيارة للمستودع');
      resetForm();
    },
    onError: (err: any) => toast.error(err?.message === 'DUPLICATE_CHASSIS' ? 'رقم الهيكل موجود بالفعل في المستودع' : 'حدث خطأ أثناء الإضافة'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouseCarEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-car-inventory'] });
      toast.success('تم حذف السجل');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف'),
  });

  const exitMutation = useMutation({
    mutationFn: (id: string) => updateWarehouseCarEntry(id, { exit_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-car-inventory'] });
      toast.success('تم تسجيل خروج السيارة');
    },
  });

  function resetForm() {
    setForm({ car_type: '', car_color: '', chassis_number: '', entry_date: new Date().toISOString().split('T')[0], exit_date: '', price: '', notes: '', location: 'warehouse' });
    setImageFile(null);
    setImagePreview(null);
    setShowAdd(false);
  }

  async function handleExportExcel() {
    const { createSimpleExcel, downloadExcelBuffer } = await import('@/lib/excelUtils');
    const fmtCur = (v: number | null) => v ? new Intl.NumberFormat('en-SA').format(v) : '-';
    const rows: any[][] = [
      ['#', 'نوع السيارة', 'اللون', 'رقم الهيكل', 'تاريخ الدخول', 'تاريخ الخروج', 'المكان', 'اسم المشتري', 'الحالة'],
      ...entries.map((e, i) => [
        i + 1, e.car_type, e.car_color || '-', e.chassis_number,
        e.entry_date, e.exit_date || '-',
        e.location === 'warehouse' || !e.location ? 'المستودع' : e.location,
        e.price || '-',
        e.exit_date ? 'خرجت' : 'في المستودع',
      ]),
    ];
    const buffer = await createSimpleExcel('جرد المستودع', rows, { rtl: true, columnWidths: [6, 20, 12, 25, 14, 14, 14, 14] });
    downloadExcelBuffer(buffer, 'تقرير_جرد_المستودع.xlsx');
    toast.success('تم تصدير التقرير بنجاح');
  }

  function handlePrintReport() {
    const fmtCur = (v: number | null) => v ? new Intl.NumberFormat('en-SA').format(v) : '-';
    printReport({
      title: 'تقرير جرد مستودع السيارات',
      subtitle: `إجمالي: ${entries.length} سيارة | داخل المستودع: ${inCount} | خرجت: ${outCount}`,
      columns: [
        { header: '#', key: 'index' },
        { header: 'نوع السيارة', key: 'car_type' },
        { header: 'اللون', key: 'car_color' },
        { header: 'رقم الهيكل', key: 'chassis_number' },
        { header: 'تاريخ الدخول', key: 'entry_date' },
        { header: 'تاريخ الخروج', key: 'exit_date' },
        { header: 'المكان', key: 'location' },
        { header: 'اسم المشتري', key: 'price' },
        { header: 'الحالة', key: 'status' },
      ],
      data: entries.map((e, i) => ({
        index: i + 1,
        car_type: e.car_type,
        car_color: e.car_color || '-',
        chassis_number: e.chassis_number,
        entry_date: e.entry_date,
        exit_date: e.exit_date || '-',
        location: e.location === 'warehouse' || !e.location ? 'المستودع' : e.location,
        price: fmtCur(e.price),
        status: e.exit_date ? 'خرجت' : 'في المستودع',
      })),
      summaryCards: [
        { label: 'إجمالي السيارات', value: String(entries.length) },
        { label: 'داخل المستودع', value: String(inCount) },
        { label: 'خرجت', value: String(outCount) },
        { label: 'إجمالي القيمة', value: fmtCur(entries.reduce((s, e) => s + (e.price || 0), 0)) },
        ...Object.entries(
          entries.reduce<Record<string, number>>((acc, e) => {
            const type = e.car_type?.trim() || 'غير محدد';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        ).map(([type, count]) => ({ label: type, value: `${count} سيارة` })),
      ],
    });
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function extractChassisFromImage(file: File): Promise<{ chassis_number: string; car_type: string; car_color: string }> {
    const base64 = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('extract-chassis', {
      body: { image_base64: base64 },
    });
    if (error) throw error;
    return data;
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Auto-extract chassis info via AI
    setExtracting(true);
    try {
      const result = await extractChassisFromImage(file);
      if (result.chassis_number || result.car_type || result.car_color) {
        setForm(p => ({
          ...p,
          chassis_number: result.chassis_number || p.chassis_number,
          car_type: result.car_type || p.car_type,
          car_color: result.car_color || p.car_color,
        }));
        toast.success('تم استخراج البيانات من الصورة');
      } else {
        toast.info('لم يتم العثور على رقم هيكل في الصورة');
      }
    } catch {
      toast.error('فشل استخراج البيانات من الصورة');
    } finally {
      setExtracting(false);
    }
  }

  // ===== Bulk Import =====
  async function handleBulkFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntries: BulkEntry[] = Array.from(files).map((file, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      car_type: '',
      car_color: '',
      chassis_number: '',
      entry_date: today,
      location: 'warehouse',
      notes: '',
    }));

    setBulkEntries(prev => [...prev, ...newEntries]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';

    // Auto-extract chassis info for each image
    for (const entry of newEntries) {
      setBulkExtracting(prev => new Set(prev).add(entry.id));
      try {
        const result = await extractChassisFromImage(entry.file);
        setBulkEntries(prev => prev.map(e => e.id === entry.id ? {
          ...e,
          chassis_number: result.chassis_number || e.chassis_number,
          car_type: result.car_type || e.car_type,
          car_color: result.car_color || e.car_color,
        } : e));
      } catch {
        // silently continue
      } finally {
        setBulkExtracting(prev => { const n = new Set(prev); n.delete(entry.id); return n; });
      }
    }
  }

  function updateBulkEntry(id: string, field: keyof BulkEntry, value: string) {
    setBulkEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function removeBulkEntry(id: string) {
    setBulkEntries(prev => {
      const entry = prev.find(e => e.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter(e => e.id !== id);
    });
  }

  async function handleBulkSave() {
    if (!companyId) return;

    const incomplete = bulkEntries.filter(e => !e.car_type.trim() || !e.chassis_number.trim());
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} سيارة تحتاج نوع السيارة ورقم الهيكل`);
      // Scroll to first incomplete entry
      const el = document.getElementById(`bulk-entry-${incomplete[0].id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check for duplicate chassis numbers
    const existingChassis = new Set(entries.filter(e => !e.exit_date).map(e => e.chassis_number));
    const duplicates = bulkEntries.filter(e => existingChassis.has(e.chassis_number));
    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} سيارة برقم هيكل موجود بالفعل في المستودع`);
      return;
    }

    setBulkSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const entry of bulkEntries) {
      try {
        const imageUrl = await uploadChassisImage(companyId, entry.file);
        await addWarehouseCarEntry(companyId, {
          car_type: entry.car_type,
          car_color: entry.car_color || undefined,
          chassis_number: entry.chassis_number,
          chassis_image_url: imageUrl,
          entry_date: entry.entry_date,
          notes: entry.notes || undefined,
          location: entry.location || 'warehouse',
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkSaving(false);
    queryClient.invalidateQueries({ queryKey: ['warehouse-car-inventory'] });

    if (errorCount === 0) {
      toast.success(`تمت إضافة ${successCount} سيارة بنجاح`);
      setBulkEntries([]);
      setShowBulk(false);
    } else {
      toast.error(`تمت إضافة ${successCount} سيارة، فشل ${errorCount}`);
    }
  }

  const filteredEntries = entries.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (e.chassis_number || '').toLowerCase().includes(term) ||
           (e.car_type || '').toLowerCase().includes(term) ||
           (e.car_color || '').toLowerCase().includes(term) ||
           (e.location || '').toLowerCase().includes(term);
  });
  const inCount = filteredEntries.filter(e => !e.exit_date).length;
  const outCount = filteredEntries.filter(e => !!e.exit_date).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">جرد مستودع السيارات</h1>
          <p className="text-muted-foreground">إدارة وجرد السيارات بالصور ومتابعة الدخول والخروج</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={entries.length === 0}>
            <FileSpreadsheet className="w-4 h-4" />تصدير Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrintReport} disabled={entries.length === 0}>
            <Printer className="w-4 h-4" />طباعة تقرير
          </Button>
          {/* Bulk Import Button */}
          <Dialog open={showBulk} onOpenChange={v => { if (!v) { bulkEntries.forEach(e => URL.revokeObjectURL(e.preview)); setBulkEntries([]); } setShowBulk(v); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Images className="w-4 h-4" />استيراد متعدد</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>استيراد سيارات متعددة من الصور</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* Upload area */}
                <div
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => bulkFileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">اضغط لاختيار صور هياكل السيارات (يمكنك اختيار عدة صور)</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WEBP</p>
                </div>
                <input ref={bulkFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBulkFilesChange} />

                {bulkEntries.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-sm">{bulkEntries.length} سيارة</Badge>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { bulkEntries.forEach(e => URL.revokeObjectURL(e.preview)); setBulkEntries([]); }}>
                        <Trash2 className="w-4 h-4 ml-1" /> مسح الكل
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {bulkEntries.map((entry, index) => (
                        <Card key={entry.id} id={`bulk-entry-${entry.id}`} className={`p-3 ${(!entry.car_type.trim() || !entry.chassis_number.trim()) ? 'border-destructive border-2' : ''}`}>
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 relative">
                              <img src={entry.preview} alt="هيكل" className="w-20 h-20 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(entry.preview)} />
                              {bulkExtracting.has(entry.id) && (
                                <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground text-center mt-1">
                                {bulkExtracting.has(entry.id) ? 'جاري القراءة...' : `سيارة ${index + 1}`}
                              </p>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <Label className="text-xs">نوع السيارة *</Label>
                                <Input
                                  value={entry.car_type}
                                  onChange={e => updateBulkEntry(entry.id, 'car_type', e.target.value)}
                                  placeholder="تويوتا كامري"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">اللون</Label>
                                <Input
                                  value={entry.car_color}
                                  onChange={e => updateBulkEntry(entry.id, 'car_color', e.target.value)}
                                  placeholder="أبيض"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">رقم الهيكل *</Label>
                                <Input
                                  value={entry.chassis_number}
                                  onChange={e => updateBulkEntry(entry.id, 'chassis_number', e.target.value)}
                                  placeholder="JTDKN3DU5A..."
                                  className="h-8 text-sm font-mono"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">تاريخ الدخول</Label>
                                <Input
                                  type="date"
                                  value={entry.entry_date}
                                  onChange={e => updateBulkEntry(entry.id, 'entry_date', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2 md:col-span-3">
                                <Label className="text-xs">ملاحظات</Label>
                                <Input
                                  value={entry.notes}
                                  onChange={e => updateBulkEntry(entry.id, 'notes', e.target.value)}
                                  placeholder="ملاحظات اختيارية..."
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => removeBulkEntry(entry.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={handleBulkSave}
                      disabled={bulkSaving || bulkEntries.length === 0}
                    >
                      {bulkSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />جاري حفظ {bulkEntries.length} سيارة...</>
                      ) : (
                        <>حفظ الكل ({bulkEntries.length} سيارة)</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Add Button */}
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />إضافة سيارة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>إضافة سيارة للمستودع</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>نوع السيارة *</Label><Input value={form.car_type} onChange={e => setForm(p => ({ ...p, car_type: e.target.value }))} placeholder="تويوتا كامري" /></div>
                  <div><Label>لون السيارة</Label><Input value={form.car_color} onChange={e => setForm(p => ({ ...p, car_color: e.target.value }))} placeholder="أبيض" /></div>
                </div>
                <div><Label>رقم الهيكل *</Label><Input value={form.chassis_number} onChange={e => setForm(p => ({ ...p, chassis_number: e.target.value }))} placeholder="JTDKN3DU5A..." className="font-mono" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>تاريخ الدخول</Label><Input type="date" value={form.entry_date} onChange={e => setForm(p => ({ ...p, entry_date: e.target.value }))} /></div>
                  <div><Label>تاريخ الخروج</Label><Input type="date" value={form.exit_date} onChange={e => setForm(p => ({ ...p, exit_date: e.target.value }))} /></div>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    صورة الهيكل
                    {extracting && <span className="flex items-center gap-1 text-xs text-primary"><Loader2 className="w-3 h-3 animate-spin" />جاري استخراج البيانات...</span>}
                  </Label>
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="معاينة" className="max-h-32 mx-auto rounded" />
                    ) : (
                      <div className="space-y-2">
                        <ScanLine className="w-8 h-8 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">اضغط لرفع صورة الهيكل (سيتم استخراج رقم الهيكل تلقائياً)</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />المكان</Label>
                  <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="المستودع / اسم المعرض" />
                </div>
                <div><Label>اسم المشتري</Label><Input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="اسم المشتري" /></div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.car_type || !form.chassis_number}>
                  {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inventory" className="gap-2"><Warehouse className="w-4 h-4" />جرد المستودع</TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2"><GitCompare className="w-4 h-4" />مطابقة المخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6 mt-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الهيكل أو نوع السيارة أو اللون أو المكان..."
              className="pr-10"
            />
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><Car className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{filteredEntries.length}</div><p className="text-sm text-muted-foreground">إجمالي السيارات</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><Warehouse className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{inCount}</div><p className="text-sm text-muted-foreground">داخل المستودع</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{outCount}</div><p className="text-sm text-muted-foreground">خرجت من المستودع</p></CardContent></Card>
          </div>

      {/* Table */}
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
         filteredEntries.length === 0 ? <p className="text-center py-8 text-muted-foreground">{searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد سيارات مسجلة بعد'}</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>صورة الهيكل</TableHead>
                  <TableHead>نوع السيارة</TableHead>
                  <TableHead>اللون</TableHead>
                  <TableHead>رقم الهيكل</TableHead>
                  <TableHead>تاريخ الدخول</TableHead>
                  <TableHead>تاريخ الخروج</TableHead>
                  <TableHead>المكان</TableHead>
                  <TableHead>اسم المشتري</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.chassis_image_url ? (
                        <img
                          src={entry.chassis_image_url}
                          alt="هيكل"
                          className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80"
                          onClick={() => setPreviewImage(entry.chassis_image_url)}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Image className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{entry.car_type}</TableCell>
                    <TableCell>{entry.car_color || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.chassis_number}</TableCell>
                    <TableCell>{entry.entry_date}</TableCell>
                    <TableCell>{entry.exit_date || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.location === 'warehouse' || !entry.location ? 'المستودع' : entry.location}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.price ? new Intl.NumberFormat('en-SA').format(entry.price) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={entry.exit_date ? 'secondary' : 'default'}>
                        {entry.exit_date ? 'خرجت' : 'في المستودع'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{entry.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!entry.exit_date && (
                          <Button size="sm" variant="outline" onClick={() => exitMutation.mutate(entry.id)} title="تسجيل خروج">
                            <Calendar className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                          if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(entry.id);
                        }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent></Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-4">
          <WarehouseReconciliation />
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>صورة الهيكل</DialogTitle></DialogHeader>
          {previewImage && <img src={previewImage} alt="صورة الهيكل" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
