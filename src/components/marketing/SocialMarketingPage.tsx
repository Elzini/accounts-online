import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Share2, Plus, Heart, Eye, MessageCircle, Calendar } from 'lucide-react';

export function SocialMarketingPage() {
  const posts = [
    { id: 1, content: 'عرض خاص على زيوت المحركات 🔥', platform: 'تويتر', scheduled: '2024-01-20 10:00', likes: 45, views: 1200, comments: 12, status: 'published' },
    { id: 2, content: 'منتجات جديدة وصلت! تصفح الآن', platform: 'إنستغرام', scheduled: '2024-01-21 14:00', likes: 0, views: 0, comments: 0, status: 'scheduled' },
    { id: 3, content: 'نصائح للحفاظ على سيارتك في الشتاء', platform: 'فيسبوك', scheduled: '2024-01-19 09:00', likes: 120, views: 3500, comments: 28, status: 'published' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التسويق الاجتماعي</h1>
            <p className="text-sm text-muted-foreground">نشر وجدولة على وسائل التواصل</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />منشور جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Eye className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">4,700</p><p className="text-xs text-muted-foreground">مشاهدات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Heart className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">165</p><p className="text-xs text-muted-foreground">إعجابات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><MessageCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">40</p><p className="text-xs text-muted-foreground">تعليقات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">مجدولة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>المحتوى</TableHead><TableHead>المنصة</TableHead><TableHead>الموعد</TableHead>
            <TableHead>المشاهدات</TableHead><TableHead>الإعجابات</TableHead><TableHead>التعليقات</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {posts.map(p => (
              <TableRow key={p.id}>
                <TableCell className="max-w-[200px] truncate">{p.content}</TableCell>
                <TableCell><Badge variant="outline">{p.platform}</Badge></TableCell>
                <TableCell>{p.scheduled}</TableCell>
                <TableCell>{p.views.toLocaleString()}</TableCell>
                <TableCell>{p.likes}</TableCell>
                <TableCell>{p.comments}</TableCell>
                <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status === 'published' ? 'منشور' : 'مجدول'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
