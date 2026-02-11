import { useState, useMemo } from 'react';
import { FolderTree, Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useItemCategories, useAddItemCategory, useUpdateItemCategory, useDeleteItemCategory } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface TreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  children: TreeNode[];
}

export function CategoriesPage() {
  const { data: categories = [], isLoading } = useItemCategories();
  const addMutation = useAddItemCategory();
  const updateMutation = useUpdateItemCategory();
  const deleteMutation = useDeleteItemCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    (categories as any[]).forEach(c => map.set(c.id, { ...c, children: [] }));
    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [categories]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOpen = (c?: any) => {
    if (c) { setEditId(c.id); setName(c.name); setParentId(c.parent_id || ''); }
    else { setEditId(null); setName(''); setParentId(''); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('اسم الفئة مطلوب'); return; }
    try {
      const payload = { name, parent_id: parentId || null };
      if (editId) { await updateMutation.mutateAsync({ id: editId, ...payload }); toast.success('تم التحديث'); }
      else { await addMutation.mutateAsync(payload); toast.success('تم الإضافة'); }
      setDialogOpen(false);
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    try { await deleteMutation.mutateAsync(id); toast.success('تم الحذف'); }
    catch { toast.error('لا يمكن حذف الفئة - قد تكون مرتبطة بأصناف أو فئات فرعية'); }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group"
          style={{ paddingRight: `${depth * 24 + 12}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="w-5 h-5 flex items-center justify-center">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          ) : <div className="w-5" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary/70" />}
          <span className="font-medium text-sm flex-1">{node.name}</span>
          {hasChildren && <Badge variant="secondary" className="text-xs">{node.children.length}</Badge>}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpen(node)}><Edit className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(node.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        {isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FolderTree className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">فئات الأصناف</h1><p className="text-sm text-muted-foreground">تنظيم الأصناف في فئات شجرية</p></div>
        </div>
        <div className="flex gap-2">
          {tree.length > 0 && (
            <Button variant="outline" onClick={() => setExpanded(new Set((categories as any[]).map(c => c.id)))}>توسيع الكل</Button>
          )}
          <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> إضافة فئة</Button>
        </div>
      </div>

      <Card className="p-4">
        {isLoading ? <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div> : tree.length === 0 ? (
          <div className="p-12 text-center"><FolderTree className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">لا توجد فئات</p></div>
        ) : (
          <div className="space-y-0.5">{tree.map(node => renderNode(node))}</div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الفئة *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="مواد بناء" /></div>
            <div>
              <Label>الفئة الأم</Label>
              <Select value={parentId || 'none'} onValueChange={v => setParentId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="فئة رئيسية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">فئة رئيسية (بدون أم)</SelectItem>
                  {(categories as any[]).filter(c => c.id !== editId).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>{editId ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
