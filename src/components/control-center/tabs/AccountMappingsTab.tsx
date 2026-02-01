import { useState, useEffect } from 'react';
import { Save, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { useAccountMappings, useSaveAccountMapping } from '@/hooks/useSystemControl';
import { useAccounts } from '@/hooks/useAccounting';
import { MAPPING_TYPES } from '@/services/systemControl';
import { toast } from 'sonner';

export function AccountMappingsTab() {
  const { data: mappings = [], isLoading } = useAccountMappings();
  const { data: accounts = [] } = useAccounts();
  const saveMapping = useSaveAccountMapping();
  
  const [localMappings, setLocalMappings] = useState<Record<string, Record<string, string | null>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (mappings.length > 0) {
      const mappingsMap: Record<string, Record<string, string | null>> = {};
      mappings.forEach(m => {
        if (!mappingsMap[m.mapping_type]) {
          mappingsMap[m.mapping_type] = {};
        }
        mappingsMap[m.mapping_type][m.mapping_key] = m.account_id;
      });
      setLocalMappings(mappingsMap);
    }
  }, [mappings]);

  const handleMappingChange = (type: string, key: string, accountId: string | null) => {
    setLocalMappings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: accountId,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      for (const type of Object.keys(localMappings)) {
        for (const key of Object.keys(localMappings[type])) {
          await saveMapping.mutateAsync({
            mapping_type: type,
            mapping_key: key,
            account_id: localMappings[type][key],
            is_active: true,
          });
        }
      }
      toast.success('تم حفظ ربط الحسابات بنجاح');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>ربط الحسابات بالعمليات</CardTitle>
              <CardDescription>
                تحديد الحسابات المحاسبية المرتبطة بكل نوع من العمليات
              </CardDescription>
            </div>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saveMapping.isPending}>
              <Save className="w-4 h-4 ml-2" />
              حفظ التغييرات
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['sales']} className="w-full">
          {MAPPING_TYPES.map((mappingType) => (
            <AccordionItem key={mappingType.type} value={mappingType.type}>
              <AccordionTrigger className="text-lg font-semibold">
                {mappingType.label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  {mappingType.keys.map((keyItem) => (
                    <div key={keyItem.key} className="space-y-2">
                      <Label>{keyItem.label}</Label>
                      <AccountSearchSelect
                        accounts={accounts}
                        value={localMappings[mappingType.type]?.[keyItem.key] || ''}
                        onChange={(value) => handleMappingChange(mappingType.type, keyItem.key, value || null)}
                        placeholder="اختر الحساب..."
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
