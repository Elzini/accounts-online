import { useState, useEffect } from 'react';
import { Hash, Save, Calculator } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export function GeneralSettingsTab() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  // ── Number display mode (integer vs decimal) ──
  const { data: numberMode = 'integer' } = useQuery({
    queryKey: ['number-display-mode', companyId],
    queryFn: async () => {
      if (companyId) {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'number_display_mode')
          .eq('company_id', companyId)
          .maybeSingle();
        if (data?.value) return data.value;
      }
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'number_display_mode')
        .is('company_id', null)
        .maybeSingle();
      return data?.value || 'integer';
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Rounding setting ──
  const { data: roundingMode = 'rounded' } = useQuery({
    queryKey: ['number-rounding-mode', companyId],
    queryFn: async () => {
      if (companyId) {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'number_rounding_mode')
          .eq('company_id', companyId)
          .maybeSingle();
        if (data?.value) return data.value;
      }
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'number_rounding_mode')
        .is('company_id', null)
        .maybeSingle();
      return data?.value || 'rounded';
    },
    staleTime: 5 * 60 * 1000,
  });

  const [editMode, setEditMode] = useState<string>(numberMode);
  const [editRounding, setEditRounding] = useState<string>(roundingMode);

  // Sync state when data loads
  useEffect(() => { setEditMode(numberMode); }, [numberMode]);
  useEffect(() => { setEditRounding(roundingMode); }, [roundingMode]);

  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const targetCompanyId = companyId || null;

      if (targetCompanyId) {
        // Company-specific: upsert by key + company_id
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .eq('company_id', targetCompanyId)
          .maybeSingle();

        if (existing) {
          await supabase.from('app_settings').update({ value }).eq('id', existing.id);
        } else {
          await supabase.from('app_settings').insert({ key, value, company_id: targetCompanyId });
        }
      } else {
        // Global: upsert by key + company_id IS NULL
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .is('company_id', null)
          .maybeSingle();

        if (existing) {
          await supabase.from('app_settings').update({ value }).eq('id', existing.id);
        } else {
          await supabase.from('app_settings').insert({ key, value, company_id: null });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['number-display-mode'] });
      queryClient.invalidateQueries({ queryKey: ['number-rounding-mode'] });
      toast.success('تم حفظ الإعداد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحفظ');
    },
  });

  const handleSaveAll = () => {
    saveSettingMutation.mutate({ key: 'number_display_mode', value: editMode });
    saveSettingMutation.mutate({ key: 'number_rounding_mode', value: editRounding });
  };

  return (
    <div className="space-y-6">
      {/* Number display mode */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="w-4 h-4" /> طبيعة عرض الأرقام
          </CardTitle>
          <Button size="sm" onClick={handleSaveAll} className="gap-1">
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

      {/* Rounding setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" /> تقريب الأرقام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            اختر هل تريد تقريب الأرقام في التقارير والقوائم أم عرضها بالقيمة الدقيقة
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-4 rounded-lg border-2 text-center transition-all ${editRounding === 'rounded' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              onClick={() => setEditRounding('rounded')}
            >
              <div className="text-2xl font-bold mb-1">1,235</div>
              <div className="text-xs text-muted-foreground">تقريب (بدون كسور)</div>
            </button>
            <button
              type="button"
              className={`p-4 rounded-lg border-2 text-center transition-all ${editRounding === 'precise' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              onClick={() => setEditRounding('precise')}
            >
              <div className="text-2xl font-bold mb-1">1,234.56</div>
              <div className="text-xs text-muted-foreground">دقيق (بالهللات)</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
