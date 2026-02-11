import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Settings } from 'lucide-react';
import { PluginInfo } from '@/hooks/usePlugins';

interface PluginPlaceholderPageProps {
  plugin: PluginInfo;
}

export function PluginPlaceholderPage({ plugin }: PluginPlaceholderPageProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">{plugin.icon}</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{plugin.name}</h1>
          <p className="text-muted-foreground">{plugin.name_en}</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          مثبتة - v{plugin.version}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              حول الإضافة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>الإصدار: {plugin.version}</p>
              <p>المطور: {plugin.author}</p>
              <p>التقييم: ⭐ {plugin.rating}</p>
              <p>التحميلات: {plugin.downloads}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">🚀 الإضافة جاهزة للاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              تم تثبيت وتفعيل الإضافة بنجاح. يمكنك الوصول إليها من القائمة الجانبية.
              سيتم إضافة ميزات إضافية في التحديثات القادمة.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
