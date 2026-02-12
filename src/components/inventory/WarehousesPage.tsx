import { useState } from 'react';
import { Warehouse, Plus, Edit, Trash2, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useWarehouses, useAddWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface WarehouseForm {
  warehouse_name: string;
  warehouse_code: string;
  address: string;
  manager: string;
  phone: string;
  is_default: boolean;
}

const emptyForm: WarehouseForm = { warehouse_name: '', warehouse_code: '', address: '', manager: '', phone: '', is_default: false };

export function WarehousesPage() {
  const { t } = useLanguage();
  const { data: warehouses = [], isLoading } = useWarehouses();
  const addMutation = useAddWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);

  const handleOpen = (w?: any) => {
    if (w) { setEditId(w.id); setForm({ warehouse_name: w.warehouse_name, warehouse_code: w.warehouse_code || '', address: w.address || '', manager: w.manager || '', phone: w.phone || '', is_default: w.is_default || false }); }
    else { setEditId(null); setForm(emptyForm); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.warehouse_name.trim()) { toast.error(t.wh_name_required); return; }
    try {
      if (editId) { await updateMutation.mutateAsync({ id: editId, ...form }); toast.success(t.wh_updated); }
      else { await addMutation.mutateAsync(form); toast.success(t.wh_added); }
      setDialogOpen(false);
    } catch { toast.error(t.wh_error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.wh_delete_confirm)) return;
    try { await deleteMutation.mutateAsync(id); toast.success(t.wh_deleted); }
    catch { toast.error(t.wh_delete_error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Warehouse className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">{t.wh_title}</h1><p className="text-sm text-muted-foreground">{t.wh_subtitle}</p></div>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> {t.wh_add}</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t.wh_loading}</div>
      ) : warehouses.length === 0 ? (
        <Card className="p-12 text-center">
          <Warehouse className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{t.wh_no_warehouses}</p>
          <Button onClick={() => handleOpen()} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> {t.wh_add_first}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w: any) => (
            <Card key={w.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div><h3 className="font-semibold text-foreground">{w.warehouse_name}</h3>{w.warehouse_code && <p className="text-xs text-muted-foreground">{t.wh_code}: {w.warehouse_code}</p>}</div>
                <div className="flex gap-1">
                  {w.is_default && <Badge variant="secondary">{t.wh_default}</Badge>}
                  {!w.is_active && <Badge variant="destructive">{t.wh_inactive}</Badge>}
                </div>
              </div>
              {w.address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{w.address}</div>}
              {w.manager && <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="w-3.5 h-3.5" />{w.manager}</div>}
              {w.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5" />{w.phone}</div>}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => handleOpen(w)} className="gap-1.5 flex-1"><Edit className="w-3.5 h-3.5" /> {t.edit}</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(w.id)} className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? t.wh_edit_title : t.wh_add_title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.wh_name_label}</Label><Input value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} /></div>
            <div><Label>{t.wh_code_label}</Label><Input value={form.warehouse_code} onChange={e => setForm(f => ({ ...f, warehouse_code: e.target.value }))} placeholder="WH-001" /></div>
            <div><Label>{t.wh_address_label}</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>{t.wh_manager_label}</Label><Input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} /></div>
            <div><Label>{t.wh_phone_label}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} /><Label>{t.wh_default_label}</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>{editId ? t.tasks_update : t.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
