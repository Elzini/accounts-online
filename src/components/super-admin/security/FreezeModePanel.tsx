import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Snowflake } from 'lucide-react';

export function FreezeModePanel() {
  const queryClient = useQueryClient();
  const [masterCode, setMasterCode] = useState('');

  const { data: isFrozen = false, isLoading } = useQuery({
    queryKey: ['system-freeze-mode'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'system_freeze_mode')
        .is('company_id', null)
        .maybeSingle();
      return data?.value === 'true';
    },
  });

  const toggleFreeze = useMutation({
    mutationFn: async (freeze: boolean) => {
      if (!masterCode || masterCode.length < 4) {
        throw new Error('يجب إدخال كود المدير الرئيسي (4 أحرف على الأقل)');
      }

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'system_freeze_mode')
        .is('company_id', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: String(freeze) })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: 'system_freeze_mode', value: String(freeze), company_id: null });
        if (error) throw error;
      }

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      await (supabase.from as any)('system_change_log').insert({
        user_id: user?.id,
        change_type: 'config_change',
        module: 'system_freeze',
        description: freeze ? 'تفعيل وضع التجميد الشامل' : 'إلغاء وضع التجميد',
        previous_value: { frozen: !freeze },
        new_value: { frozen: freeze },
        authorization_method: 'master_code',
        status: 'applied',
        applied_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-freeze-mode'] });
      setMasterCode('');
      toast.success('تم تحديث وضع التجميد');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card className={`border-2 ${isFrozen ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className={`h-5 w-5 ${isFrozen ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          وضع التجميد الشامل (System Freeze)
          {isFrozen ? (
            <Badge className="bg-blue-500 text-white">مُفعّل - النظام مُجمّد</Badge>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-500">غير مُفعّل</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
          <p className="text-sm font-medium">عند تفعيل التجميد يتم منع:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>تعديل كود التطبيق والمنطق المحاسبي</li>
            <li>تغيير هيكل قاعدة البيانات</li>
            <li>تعديل إعدادات الضرائب</li>
            <li>تغيير إعدادات النظام العامة</li>
          </ul>
          <p className="text-xs text-destructive font-medium mt-2">
            ⚠️ فقط مدير النظام الرئيسي يمكنه إلغاء التجميد باستخدام كود التفويض
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="password"
            placeholder="كود التفويض الرئيسي..."
            value={masterCode}
            onChange={(e) => setMasterCode(e.target.value)}
            className="max-w-[250px]"
          />
          <Button
            variant={isFrozen ? 'default' : 'destructive'}
            onClick={() => toggleFreeze.mutate(!isFrozen)}
            disabled={isLoading || toggleFreeze.isPending}
          >
            {isFrozen ? '🔓 إلغاء التجميد' : '🔒 تفعيل التجميد الشامل'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
