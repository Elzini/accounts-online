import { useState } from 'react';
import { Hash, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export function GeneralSettingsTab() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  const { data: numberMode = 'integer' } = useQuery({
    queryKey: ['number-display-mode', companyId],
    queryFn: async () => {
      // Try company-specific first
      if (companyId) {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'number_display_mode')
          .eq('company_id', companyId)
          .maybeSingle();
        if (data?.value) return data.value;
      }
      // Fallback to global
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'number_display_mode')
        .is('company_id', null)
        .maybeSingle();
      return data?.value || 'integer';
    },
  });

  const [editMode, setEditMode] = useState<string>(numberMode);

  // Sync state when data loads
  useState(() => { setEditMode(numberMode); });

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const key = 'number_display_mode';
      const targetCompanyId = companyId || null;

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .eq('company_id', targetCompanyId || '')
        .maybeSingle();

      if (!existing && !targetCompanyId) {
        const { data: globalExisting } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .is('company_id', null)
          .maybeSingle();
        
        if (globalExisting) {
          await supabase.from('app_settings').update({ value }).eq('id', globalExisting.id);
        } else {
          await supabase.from('app_settings').insert({ key, value, company_id: null });
        }
      } else if (existing) {
        await supabase.from('app_settings').update({ value }).eq('id', existing.id);
      } else {
        await supabase.from('app_settings').insert({ key, value, company_id: targetCompanyId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['number-display-mode'] });
      toast.success('تم حفظ الإعداد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحفظ');
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="w-4 h-4" /> طبيعة عرض الأرقام
          </CardTitle>
          <Button size="sm" onClick={() => saveMutation.mutate(editMode)} className="gap-1">
            <Save className="w-3 h-3" /> حفظ
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">اختر طريقة عرض الأرقام في جميع التقارير والفواتير</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-4 rounded-lg border-2 text-center transition-all ${editMode === 'integer' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              onClick={() => setEditMode('integer')}
            >
              <div className="text-2xl font-bold mb-1">1,234</div>
              <div className="text-xs text-muted-foreground">بدون فاصلة عشرية</div>
            </button>
            <button
              type="button"
              className={`p-4 rounded-lg border-2 text-center transition-all ${editMode === 'decimal' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              onClick={() => setEditMode('decimal')}
            >
              <div className="text-2xl font-bold mb-1">1,234.56</div>
              <div className="text-xs text-muted-foreground">فاصلة عشرية (خانتين)</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
