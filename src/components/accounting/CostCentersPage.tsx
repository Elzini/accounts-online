import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCostCenters, useAddCostCenter, useUpdateCostCenter, useDeleteCostCenter } from '@/hooks/useCostCenters';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, Target } from 'lucide-react';
import type { CostCenter } from '@/services/costCenters';
import { useLanguage } from '@/contexts/LanguageContext';

export function CostCentersPage() {
  const { t, direction } = useLanguage();
  const { data: centers = [], isLoading } = useCostCenters();
  const addCenter = useAddCostCenter();
  const updateCenter = useUpdateCostCenter();
  const deleteCenter = useDeleteCostCenter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setParentId('');
    setEditingCenter(null);
  };

  const openEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setCode(center.code);
    setName(center.name);
    setDescription(center.description || '');
    setParentId(center.parent_id || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!code || !name) {
      toast.error(t.cost_toast_required);
      return;
    }

    try {
      if (editingCenter) {
        await updateCenter.mutateAsync({
          id: editingCenter.id,
          updates: { code, name, description: description || null, parent_id: parentId || null },
        });
        toast.success(t.cost_toast_updated);
      } else {
        await addCenter.mutateAsync({
          code,
          name,
          description: description || undefined,
          parent_id: parentId || undefined,
        });
        toast.success(t.cost_toast_added);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || t.cost_toast_error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCenter.mutateAsync(id);
      toast.success(t.cost_toast_deleted);
    } catch (error: any) {
      toast.error(error.message || t.cost_toast_error);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = centers.find(c => c.id === parentId);
    return parent ? `${parent.code} - ${parent.name}` : '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.cost_title}</h1>
          <p className="text-muted-foreground">{t.cost_subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              {t.cost_add}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCenter ? t.cost_edit : t.cost_add_new}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.cost_code}</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="CC-001" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>{t.cost_name}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t.cost_name} />
              </div>
              <div className="space-y-2">
                <Label>{t.cost_description}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.cost_description} />
              </div>
              <div className="space-y-2">
                <Label>{t.cost_parent}</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.cost_parent_none} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.cost_parent_none}</SelectItem>
                    {centers
                      .filter(c => c.id !== editingCenter?.id)
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-mono text-muted-foreground ml-2">{c.code}</span>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addCenter.isPending || updateCenter.isPending}>
                {(addCenter.isPending || updateCenter.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {editingCenter ? t.cost_update : t.cost_add_btn}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t.cost_count} ({centers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.cost_no_data}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.cost_code}</TableHead>
                  <TableHead className="text-right">{t.cost_name}</TableHead>
                  <TableHead className="text-right">{t.cost_description}</TableHead>
                  <TableHead className="text-right">{t.cost_parent}</TableHead>
                  <TableHead className="text-right">{t.cost_status}</TableHead>
                  <TableHead className="text-right">{t.cost_actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers.map(center => (
                  <TableRow key={center.id}>
                    <TableCell className="font-mono">{center.code}</TableCell>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="text-muted-foreground">{center.description || '-'}</TableCell>
                    <TableCell>{getParentName(center.parent_id)}</TableCell>
                    <TableCell>
                      <Badge variant={center.is_active ? 'default' : 'secondary'}>
                        {center.is_active ? t.cost_active : t.cost_inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(center)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.cost_confirm_delete}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.cost_confirm_delete_desc} "{center.name}"
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(center.id)}>{t.delete}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}