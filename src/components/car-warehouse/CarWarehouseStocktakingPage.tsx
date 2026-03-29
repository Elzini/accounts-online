import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Warehouse, Car, Image, Trash2, Eye, Upload, Calendar } from 'lucide-react';
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

export function CarWarehouseStocktakingPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    car_type: '', car_color: '', chassis_number: '', entry_date: new Date().toISOString().split('T')[0],
    exit_date: '', notes: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['warehouse-car-inventory', companyId],
    queryFn: () => fetchWarehouseCarInventory(companyId!),
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
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
        notes: form.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-car-inventory'] });
      toast.success('تمت إضافة السيارة للمستودع');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
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
    setForm({ car_type: '', car_color: '', chassis_number: '', entry_date: new Date().toISOString().split('T')[0], exit_date: '', notes: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowAdd(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  const inCount = entries.filter(e => !e.exit_date).length;
  const outCount = entries.filter(e => !!e.exit_date).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">جرد مستودع السيارات</h1>
          <p className="text-muted-foreground">إدارة وجرد السيارات بالصور ومتابعة الدخول والخروج</p>
        </div>
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
                <Label>صورة الهيكل</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="معاينة" className="max-h-32 mx-auto rounded" />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">اضغط لرفع صورة الهيكل</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.car_type || !form.chassis_number}>
                {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Car className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{entries.length}</div><p className="text-sm text-muted-foreground">إجمالي السيارات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Warehouse className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{inCount}</div><p className="text-sm text-muted-foreground">داخل المستودع</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{outCount}</div><p className="text-sm text-muted-foreground">خرجت من المستودع</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
         entries.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد سيارات مسجلة بعد</p> : (
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
                  <TableHead>الحالة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
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
