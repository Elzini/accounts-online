import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Search, FileText, FolderOpen, Eye, Clock, Star } from 'lucide-react';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');

  const categories = [
    { name: 'سياسات الشركة', articles: 12, icon: '📋' },
    { name: 'إجراءات العمل', articles: 18, icon: '⚙️' },
    { name: 'الأدلة التقنية', articles: 8, icon: '💻' },
    { name: 'الموارد البشرية', articles: 15, icon: '👥' },
    { name: 'المالية والمحاسبة', articles: 10, icon: '💰' },
    { name: 'خدمة العملاء', articles: 7, icon: '🎯' },
  ];

  const articles = [
    { id: 1, title: 'سياسة الإجازات والغياب', category: 'الموارد البشرية', author: 'فريق الموارد البشرية', views: 450, updated: '2024-01-15', pinned: true },
    { id: 2, title: 'دليل استخدام نظام ERP', category: 'الأدلة التقنية', author: 'فريق تقنية المعلومات', views: 320, updated: '2024-01-10', pinned: true },
    { id: 3, title: 'إجراءات الشراء والمناقصات', category: 'إجراءات العمل', author: 'قسم المشتريات', views: 280, updated: '2024-01-08', pinned: false },
    { id: 4, title: 'سياسة السفر والانتداب', category: 'سياسات الشركة', author: 'الإدارة العامة', views: 190, updated: '2024-01-05', pinned: false },
    { id: 5, title: 'دليل خدمة العملاء', category: 'خدمة العملاء', author: 'مدير المبيعات', views: 540, updated: '2024-01-12', pinned: false },
  ];

  const filtered = articles.filter(a => a.title.includes(search) || a.category.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">قاعدة المعرفة</h1>
            <p className="text-sm text-muted-foreground">ويكي داخلي للإجراءات والسياسات</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />مقال جديد</Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="البحث في قاعدة المعرفة..." className="pr-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map(cat => (
          <Card key={cat.name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-4 text-center">
              <span className="text-2xl">{cat.icon}</span>
              <p className="font-medium text-sm mt-2">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.articles} مقال</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg">المقالات</h2>
        {filtered.map(a => (
          <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    {a.pinned && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{a.category}</span>
                    <span>بواسطة: {a.author}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.updated}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline">{a.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
