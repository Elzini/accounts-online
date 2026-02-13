import { useState, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { useLanguage } from '@/contexts/LanguageContext';

interface TreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  children: TreeNode[];
}

export function CategoriesPage() {
  const { t, direction } = useLanguage();
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
    if (!name.trim()) { toast.error(t.inv_categories_name_required); return; }
    try {
      const payload = { name, parent_id: parentId || null };
      if (editId) { await updateMutation.mutateAsync({ id: editId, ...payload }); toast.success(t.acc_updated); }
      else { await addMutation.mutateAsync(payload); toast.success(t.acc_added); }
      setDialogOpen(false);
    } catch { toast.error(t.acc_error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.inv_categories_confirm_delete)) return;
    try { await deleteMutation.mutateAsync(id); toast.success(t.acc_deleted); }
    catch { toast.error(t.inv_categories_delete_error); }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group"
          style={{ paddingRight: direction === 'rtl' ? `${depth * 24 + 12}px` : undefined, paddingLeft: direction === 'ltr' ? `${depth * 24 + 12}px` : undefined }}
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
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FolderTree className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">{t.inv_categories_title}</h1><p className="text-sm text-muted-foreground">{t.inv_categories_subtitle}</p></div>
        </div>
        <div className="flex gap-2">
          {tree.length > 0 && (
            <Button variant="outline" onClick={() => setExpanded(new Set((categories as any[]).map(c => c.id)))}>{t.inv_categories_expand_all}</Button>
          )}
          <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> {t.inv_categories_add}</Button>
        </div>
      </div>

      <Collapsible defaultOpen>
        <Card className="p-4">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group mb-2">
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=closed]:-rotate-90" />
            <span className="font-semibold text-sm">{t.inv_categories_title}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {isLoading ? <div className="p-8 text-center text-muted-foreground">{t.loading}</div> : tree.length === 0 ? (
              <div className="p-12 text-center"><FolderTree className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">{t.inv_categories_none}</p></div>
            ) : (
              <div className="space-y-0.5">{tree.map(node => renderNode(node))}</div>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm" dir={direction}>
          <DialogHeader><DialogTitle>{editId ? t.inv_categories_edit : t.inv_categories_add_new}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t.inv_categories_name_label}</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div>
              <Label>{t.inv_categories_parent}</Label>
              <Select value={parentId || 'none'} onValueChange={v => setParentId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.inv_categories_parent_root}</SelectItem>
                  {(categories as any[]).filter(c => c.id !== editId).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
