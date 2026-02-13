import { useState } from 'react';
import { Ruler, Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnits, useAddUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function UnitsPage() {
  const { t, direction } = useLanguage();
  const { data: units = [], isLoading } = useUnits();
  const addMutation = useAddUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const handleOpen = (u?: any) => {
    if (u) { setEditId(u.id); setName(u.name); setAbbreviation(u.abbreviation || ''); }
    else { setEditId(null); setName(''); setAbbreviation(''); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t.inv_units_name_required); return; }
    try {
      if (editId) { await updateMutation.mutateAsync({ id: editId, name, abbreviation }); toast.success(t.acc_updated); }
      else { await addMutation.mutateAsync({ name, abbreviation }); toast.success(t.acc_added); }
      setDialogOpen(false);
    } catch { toast.error(t.acc_error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.inv_units_confirm_delete)) return;
    try { await deleteMutation.mutateAsync(id); toast.success(t.acc_deleted); }
    catch { toast.error(t.inv_units_delete_error); }
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Ruler className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">{t.inv_units_title}</h1><p className="text-sm text-muted-foreground">{t.inv_units_subtitle}</p></div>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> {t.inv_units_add}</Button>
      </div>

      <Collapsible defaultOpen>
        <Card className="overflow-hidden">
          <div className="p-4">
            <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group">
              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=closed]:-rotate-90" />
              <span className="font-semibold text-sm">{t.inv_units_title}</span>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {isLoading ? <div className="p-8 text-center text-muted-foreground">{t.loading}</div> : (units as any[]).length === 0 ? (
              <div className="p-12 text-center"><Ruler className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">{t.inv_units_none}</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead className="text-right">{t.inv_units_col_name}</TableHead><TableHead className="text-right">{t.inv_units_col_abbr}</TableHead><TableHead className="text-right">{t.inv_units_col_actions}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(units as any[]).map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.abbreviation || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpen(u)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(u.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm" dir={direction}>
          <DialogHeader><DialogTitle>{editId ? t.inv_units_edit : t.inv_units_add_new}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.name} *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>{t.inv_units_abbreviation}</Label><Input value={abbreviation} onChange={e => setAbbreviation(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>{editId ? t.edit : t.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
