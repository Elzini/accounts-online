/**
 * Company Accounting Settings - Slim Orchestrator
 * Logic in hooks/useCompanyAccountingSettings.
 */
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save, Settings2, Building2, ToggleLeft, BookOpen } from 'lucide-react';
import {
  useCompanyAccountingSettings,
  accountMappings, vatAccountMappings, expenseAccountMappings,
  type AccountingSettings,
} from './hooks/useCompanyAccountingSettings';

interface Props { companyId: string; companyName: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function CompanyAccountingSettings({ companyId, companyName, open, onOpenChange }: Props) {
  const h = useCompanyAccountingSettings(companyId, open, onOpenChange);
  const { formData, setFormData, accounts, isLoading, saveSettings, handleSave, getAccountsByType, getAccountDisplay, findAccountByCode, getSuggestedAccountDisplay } = h;

  const renderAccountSelect = (value: string | null, onChange: (v: string | null) => void, types: string[], disabled?: boolean, suggestedCode?: string, suggestedName?: string) => {
    const filtered = getAccountsByType(types);
    const selectedCode = getAccountDisplay(value);
    const suggestedAccount = suggestedCode ? findAccountByCode(suggestedCode) : null;
    const placeholder = suggestedCode && suggestedName ? getSuggestedAccountDisplay(suggestedCode, suggestedName) : 'اختر الحساب';
    return (
      <div className="flex items-center gap-2">
        <Select value={value || 'default'} onValueChange={v => { if (v === 'default') onChange(suggestedAccount ? suggestedAccount.id : null); else onChange(v); }} disabled={disabled}>
          <SelectTrigger className="w-full h-9 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {suggestedAccount && <SelectItem value="default" className="text-primary font-medium">✓ {suggestedAccount.code} - {suggestedAccount.name} (مقترح)</SelectItem>}
            {filtered.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedCode && <span className="text-xs font-mono bg-muted px-2 py-1 rounded min-w-[60px] text-center">{selectedCode}</span>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" />إعدادات القيود المحاسبية</DialogTitle>
          <DialogDescription className="flex items-center gap-2"><Building2 className="w-4 h-4" />{companyName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="accounts" className="flex items-center gap-2"><BookOpen className="w-4 h-4" />تخصيص الحسابات</TabsTrigger>
              <TabsTrigger value="control" className="flex items-center gap-2"><ToggleLeft className="w-4 h-4" />التحكم في القيود</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-4">
              {/* Main Account Mappings */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 bg-muted/50 border-b"><div className="p-3 text-center font-semibold border-l">الوصف</div><div className="p-3 text-center font-semibold border-l text-success">حسابات المبيعات</div><div className="p-3 text-center font-semibold text-primary">حسابات المشتريات</div></div>
                {accountMappings.map((m, i) => (
                  <div key={m.label} className={`grid grid-cols-3 ${i !== accountMappings.length - 1 ? 'border-b' : ''}`}>
                    <div className="p-3 bg-muted/20 border-l flex items-center"><div><span className="text-sm font-medium block">{m.label}</span><span className="text-xs text-muted-foreground">{m.suggestedCode} - {m.suggestedName}</span></div></div>
                    <div className="p-2 border-l">{m.salesKey ? renderAccountSelect(formData[m.salesKey as keyof AccountingSettings] as string | null, v => setFormData({ ...formData, [m.salesKey as string]: v }), m.types, !formData.auto_sales_entries, m.suggestedCode, m.suggestedName) : <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">—</div>}</div>
                    <div className="p-2">{m.purchaseKey ? renderAccountSelect(formData[m.purchaseKey as keyof AccountingSettings] as string | null, v => setFormData({ ...formData, [m.purchaseKey as string]: v }), m.types, !formData.auto_purchase_entries, m.suggestedCode, m.suggestedName) : <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">—</div>}</div>
                  </div>
                ))}
              </div>

              {/* VAT Accounts */}
              <div className="mt-4"><h4 className="text-sm font-semibold mb-3 text-emerald-600 flex items-center gap-2"><span>🏛️</span> حسابات ضريبة القيمة المضافة (ZATCA)</h4>
                <div className="border rounded-lg overflow-hidden border-emerald-200">
                  <div className="grid grid-cols-2 bg-emerald-50 dark:bg-emerald-950/20 border-b"><div className="p-3 text-center font-semibold border-l">الوصف</div><div className="p-3 text-center font-semibold text-emerald-600">الحساب</div></div>
                  {vatAccountMappings.map((m, i) => (
                    <div key={m.label} className={`grid grid-cols-2 ${i !== vatAccountMappings.length - 1 ? 'border-b' : ''}`}>
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border-l flex items-center"><div><span className="text-sm font-medium block">{m.label}</span><span className="text-xs text-muted-foreground">{m.description}</span><span className="text-xs text-emerald-600 block">{m.suggestedCode} - {m.suggestedName}</span></div></div>
                      <div className="p-2">{renderAccountSelect(formData[m.key as keyof AccountingSettings] as string | null, v => setFormData({ ...formData, [m.key]: v }), m.types, false, m.suggestedCode, m.suggestedName)}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">💡 وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA): نسبة الضريبة 15%</p>
              </div>

              {/* Expense Accounts */}
              <div className="mt-4"><h4 className="text-sm font-semibold mb-3 text-amber-600 flex items-center gap-2"><span>📋</span> حسابات المصروفات</h4>
                <div className="border rounded-lg overflow-hidden border-amber-200">
                  <div className="grid grid-cols-2 bg-amber-50 dark:bg-amber-950/20 border-b"><div className="p-3 text-center font-semibold border-l">الوصف</div><div className="p-3 text-center font-semibold text-amber-600">الحساب</div></div>
                  {expenseAccountMappings.map((m, i) => (
                    <div key={m.label} className={`grid grid-cols-2 ${i !== expenseAccountMappings.length - 1 ? 'border-b' : ''}`}>
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border-l flex items-center"><div><span className="text-sm font-medium block">{m.label}</span><span className="text-xs text-muted-foreground">{m.suggestedCode} - {m.suggestedName}</span></div></div>
                      <div className="p-2">{renderAccountSelect(formData[m.key as keyof AccountingSettings] as string | null, v => setFormData({ ...formData, [m.key]: v }), m.types, !formData.auto_expense_entries, m.suggestedCode, m.suggestedName)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {accounts.length === 0 && <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20"><p className="text-warning font-medium">لا توجد حسابات محاسبية لهذه الشركة</p><p className="text-sm text-muted-foreground mt-1">يجب إنشاء دليل الحسابات أولاً لتخصيص الحسابات</p></div>}
            </TabsContent>

            <TabsContent value="control" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div><div><Label className="text-base font-semibold">توليد القيود التلقائي</Label><p className="text-sm text-muted-foreground">تفعيل توليد قيود اليومية تلقائياً عند إجراء العمليات</p></div></div><Switch checked={formData.auto_journal_entries_enabled} onCheckedChange={checked => setFormData({ ...formData, auto_journal_entries_enabled: checked })} /></div>
                {[
                  { key: 'auto_sales_entries' as const, label: 'قيود المبيعات', desc: 'توليد قيد محاسبي تلقائي عند كل عملية بيع', icon: '💰', color: 'bg-success/10 text-success' },
                  { key: 'auto_purchase_entries' as const, label: 'قيود المشتريات', desc: 'توليد قيد محاسبي تلقائي عند كل عملية شراء', icon: '🛒', color: 'bg-primary/10 text-primary' },
                  { key: 'auto_expense_entries' as const, label: 'قيود المصروفات', desc: 'توليد قيد محاسبي تلقائي عند كل عملية صرف', icon: '📋', color: 'bg-orange-500/10 text-orange-500' },
                ].map(item => (
                  <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg border ${!formData.auto_journal_entries_enabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color.split(' ')[0]}`}><span className={`text-lg ${item.color.split(' ')[1]}`}>{item.icon}</span></div><div><Label className="font-medium">{item.label}</Label><p className="text-sm text-muted-foreground">{item.desc}</p></div></div>
                    <Switch checked={formData[item.key]} onCheckedChange={checked => setFormData({ ...formData, [item.key]: checked })} disabled={!formData.auto_journal_entries_enabled} />
                  </div>
                ))}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border"><h4 className="font-medium mb-3">ملخص الحالة</h4><div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { active: formData.auto_journal_entries_enabled, label: 'النظام العام' },
                    { active: formData.auto_sales_entries && formData.auto_journal_entries_enabled, label: 'قيود المبيعات' },
                    { active: formData.auto_purchase_entries && formData.auto_journal_entries_enabled, label: 'قيود المشتريات' },
                    { active: formData.auto_expense_entries && formData.auto_journal_entries_enabled, label: 'قيود المصروفات' },
                  ].map(s => <div key={s.label} className={`p-3 rounded-lg ${s.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}><div className="text-lg font-bold">{s.active ? '✓' : '✗'}</div><div className="text-xs">{s.label}</div></div>)}
                </div></div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saveSettings.isPending}>{saveSettings.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</> : <><Save className="w-4 h-4 ml-2" />حفظ الإعدادات</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
