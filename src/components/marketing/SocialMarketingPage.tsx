import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Plus, Heart, Eye, MessageCircle, Calendar, Trash2 } from 'lucide-react';
import { useSocialPosts, useAddSocialPost, useDeleteSocialPost } from '@/hooks/useModuleData';

export function SocialMarketingPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', platform: 'all', scheduled_at: '' });

  const { data: posts = [], isLoading } = useSocialPosts();
  const addPost = useAddSocialPost();
  const deletePost = useDeleteSocialPost();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التسويق الاجتماعي</h1><p className="text-sm text-muted-foreground">نشر وجدولة على وسائل التواصل</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />منشور جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Eye className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{posts.length}</p><p className="text-xs text-muted-foreground">منشورات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Heart className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{posts.reduce((s: number, p: any) => s + (p.likes_count || 0), 0)}</p><p className="text-xs text-muted-foreground">إعجابات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><MessageCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{posts.reduce((s: number, p: any) => s + (p.comments_count || 0), 0)}</p><p className="text-xs text-muted-foreground">تعليقات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{posts.filter((p: any) => p.status === 'scheduled').length}</p><p className="text-xs text-muted-foreground">مجدولة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        posts.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد منشورات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>المحتوى</TableHead><TableHead>المنصة</TableHead><TableHead>الإعجابات</TableHead><TableHead>التعليقات</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{posts.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="max-w-[200px] truncate">{p.content}</TableCell>
              <TableCell><Badge variant="outline">{p.platform}</Badge></TableCell>
              <TableCell>{p.likes_count || 0}</TableCell>
              <TableCell>{p.comments_count || 0}</TableCell>
              <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status === 'published' ? 'منشور' : p.status === 'scheduled' ? 'مجدول' : 'مسودة'}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePost.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>منشور جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>المحتوى *</Label><Textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المنصة</Label><Select value={newPost.platform} onValueChange={v => setNewPost(p => ({ ...p, platform: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="twitter">تويتر</SelectItem><SelectItem value="instagram">إنستغرام</SelectItem><SelectItem value="facebook">فيسبوك</SelectItem></SelectContent></Select></div>
              <div><Label>الجدولة</Label><Input type="datetime-local" value={newPost.scheduled_at} onChange={e => setNewPost(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
            </div>
            <Button onClick={() => { if (!newPost.content) return; addPost.mutate({ ...newPost, scheduled_at: newPost.scheduled_at || null }, { onSuccess: () => { setShowAdd(false); setNewPost({ content: '', platform: 'all', scheduled_at: '' }); } }); }} disabled={addPost.isPending} className="w-full">{addPost.isPending ? 'جاري...' : 'نشر / جدولة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
