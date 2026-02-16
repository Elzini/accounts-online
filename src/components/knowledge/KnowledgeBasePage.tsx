import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Search, FileText, Eye, Clock, Star, Trash2 } from 'lucide-react';
import { useKnowledgeArticles, useAddKnowledgeArticle, useDeleteKnowledgeArticle } from '@/hooks/useModuleData';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: '', author_name: '' });

  const { data: articles = [], isLoading } = useKnowledgeArticles();
  const addArticle = useAddKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const filtered = articles.filter((a: any) => a.title?.includes(search) || a.category?.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">قاعدة المعرفة</h1><p className="text-sm text-muted-foreground">ويكي داخلي للإجراءات والسياسات</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />مقال جديد</Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="البحث في قاعدة المعرفة..." className="pr-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{articles.length}</p><p className="text-xs text-muted-foreground">مقالات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Eye className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{articles.reduce((s: number, a: any) => s + (a.views_count || 0), 0)}</p><p className="text-xs text-muted-foreground">مشاهدات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{articles.filter((a: any) => a.is_published).length}</p><p className="text-xs text-muted-foreground">منشورة</p></CardContent></Card>
      </div>

      {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
      filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد مقالات.</p> :
      <div className="space-y-3">
        {filtered.map((a: any) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {a.category && <span>{a.category}</span>}
                    {a.author_name && <span>بواسطة: {a.author_name}</span>}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views_count || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.updated_at).toLocaleDateString('ar')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{a.is_published ? 'منشور' : 'مسودة'}</Badge>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteArticle.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>مقال جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان *</Label><Input value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الفئة</Label><Input value={newArticle.category} onChange={e => setNewArticle(p => ({ ...p, category: e.target.value }))} /></div>
              <div><Label>الكاتب</Label><Input value={newArticle.author_name} onChange={e => setNewArticle(p => ({ ...p, author_name: e.target.value }))} /></div>
            </div>
            <div><Label>المحتوى</Label><Textarea rows={6} value={newArticle.content} onChange={e => setNewArticle(p => ({ ...p, content: e.target.value }))} /></div>
            <Button onClick={() => { if (!newArticle.title) return; addArticle.mutate(newArticle, { onSuccess: () => { setShowAdd(false); setNewArticle({ title: '', content: '', category: '', author_name: '' }); } }); }} disabled={addArticle.isPending} className="w-full">{addArticle.isPending ? 'جاري...' : 'إضافة المقال'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
