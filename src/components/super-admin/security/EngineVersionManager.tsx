import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Cpu, Plus, CheckCircle2, Clock, History } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { useEngineVersions, useCreateEngineVersion } from '@/hooks/modules/useSuperAdminServices';

export function EngineVersionManager() {
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({ version: '', description: '' });

  const { data: versions = [], isLoading } = useEngineVersions();

  const createVersion = useCreateEngineVersion();

  const currentVersion = versions.find((v: any) => v.is_current);

  return (
    <div className="space-y-4">
      {/* Current Version */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            النسخة الحالية للمحرك المحاسبي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentVersion ? (
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary font-mono">v{currentVersion.version_number}</div>
              <div>
                <p className="text-sm">{currentVersion.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  مفعّلة منذ: {currentVersion.activated_at ? new Date(currentVersion.activated_at).toLocaleString('ar-SA') : '-'}
                </p>
              </div>
              <Badge className="bg-green-500/10 text-green-600 mr-auto">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                نشطة
              </Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">لم يتم تحديد نسخة حالية</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ سياسة الحفاظ على البيانات التاريخية</p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
              <li>• كل فاتورة وقيد يحمل رقم نسخة المحرك المستخدمة وقت الإنشاء</li>
              <li>• عند تحديث المنطق المحاسبي، تُنشأ نسخة جديدة تلقائياً</li>
              <li>• الفواتير والقيود القديمة لا يُعاد حسابها أبداً</li>
              <li>• النسخ السابقة تبقى نشطة للمرجعية التاريخية</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل النسخ
          </CardTitle>
          <Button size="sm" onClick={() => setShowNewVersion(true)}>
            <Plus className="h-4 w-4 ml-1" />
            نسخة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {versions.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">v{v.version_number}</span>
                    <span className="text-sm text-muted-foreground">{v.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.is_current ? (
                      <Badge className="bg-green-500/10 text-green-600">حالية</Badge>
                    ) : v.is_active ? (
                      <Badge variant="outline">نشطة</Badge>
                    ) : (
                      <Badge variant="secondary">مؤرشفة</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Version Dialog */}
      <Dialog open={showNewVersion} onOpenChange={setShowNewVersion}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء نسخة جديدة للمحرك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">رقم النسخة</label>
              <Input
                placeholder="مثال: 2.0.0"
                value={newVersion.version}
                onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">وصف التغييرات</label>
              <Textarea
                placeholder="وصف التعديلات على المنطق المحاسبي..."
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVersion(false)}>إلغاء</Button>
            <Button onClick={() => createVersion.mutate({ version: newVersion.version, description: newVersion.description })} disabled={createVersion.isPending}>
              إنشاء النسخة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
