/**
 * Invoices Audit Page
 * Validates all company invoices (sales + purchases) for:
 *  1) Math integrity: subtotal + VAT ≈ total (tolerance 0.02)
 *  2) Date consistency vs date embedded in supplier ZATCA file_url (YYYYMMDDTHHMMSS)
 *  3) Missing supplier_invoice_number on purchase invoices
 *  4) Duplicates: same supplier_invoice_number + supplier_id within the company
 *
 * Provides per-row "Fix" plus bulk "Fix all auto-fixable" (math + date corrections only).
 * Duplicates and missing reference numbers require manual review.
 */
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Play, Wrench, AlertTriangle, CheckCircle2, FileWarning, Calendar, Calculator, Copy, FileX, ExternalLink, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

const TOL = 0.02;

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  invoice_type: string;
  supplier_id: string | null;
  customer_id: string | null;
  supplier_invoice_number: string | null;
  invoice_date: string;
  subtotal: number | null;
  taxable_amount: number | null;
  vat_amount: number | null;
  total: number | null;
  file_url: string | null;
  supplier?: { name: string } | null;
};

type IssueKind = 'math' | 'date' | 'missing-ref' | 'duplicate';

interface Issue {
  id: string;
  invoice: InvoiceRow;
  kind: IssueKind;
  detail: string;
  expected?: { invoice_date?: string; total?: number };
  fixable: boolean;
}

function extractDateFromFileUrl(url: string | null): string | null {
  if (!url) return null;
  // Pattern: _20260115T121840_  or _20260115_
  const m = url.match(/_(\d{4})(\d{2})(\d{2})T?\d*_/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function InvoicesAuditPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [hasRun, setHasRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<IssueKind | 'all'>('all');
  const [confirmFixAllOpen, setConfirmFixAllOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const { data: invoices = [], refetch, isFetching } = useQuery<InvoiceRow[]>({
    queryKey: ['invoices-audit', companyId],
    enabled: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_type, supplier_id, customer_id, supplier_invoice_number, invoice_date, subtotal, taxable_amount, vat_amount, total, file_url, supplier:suppliers(name)')
        .eq('company_id', companyId!)
        .order('invoice_date', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const issues = useMemo<Issue[]>(() => {
    if (!invoices.length) return [];
    const out: Issue[] = [];

    // Duplicate map (supplier_invoice_number + supplier_id, purchase only)
    const dupMap = new Map<string, InvoiceRow[]>();
    invoices.forEach(inv => {
      if (inv.invoice_type === 'purchase' && inv.supplier_invoice_number?.trim() && inv.supplier_id) {
        const key = `${inv.supplier_id}::${inv.supplier_invoice_number.trim()}`;
        const arr = dupMap.get(key) || [];
        arr.push(inv);
        dupMap.set(key, arr);
      }
    });

    invoices.forEach(inv => {
      // Use subtotal (post-discount net) as the VAT base, matching the posting engine standard.
      // taxable_amount may differ when a line-level discount is recorded separately.
      const subtotal = Number(inv.subtotal ?? 0);
      const vat = Number(inv.vat_amount ?? 0);
      const total = Number(inv.total ?? 0);
      const expectedFromSubtotal = subtotal + vat;
      const taxable = Number(inv.taxable_amount ?? 0);
      const expectedFromTaxable = taxable + vat;
      // Only flag as math error if BOTH bases disagree with total (true accounting error)
      const mismatch = total > 0
        && Math.abs(expectedFromSubtotal - total) > TOL
        && (taxable === 0 || Math.abs(expectedFromTaxable - total) > TOL);
      if (mismatch) {
        out.push({
          id: `${inv.id}-math`,
          invoice: inv,
          

      // Date consistency from file_url (ZATCA-pattern PDFs only)
      const urlDate = extractDateFromFileUrl(inv.file_url);
      if (urlDate && urlDate !== inv.invoice_date) {
        out.push({
          id: `${inv.id}-date`,
          invoice: inv,
          kind: 'date',
          detail: `التاريخ المسجل ${inv.invoice_date} يختلف عن تاريخ الملف الأصلي ${urlDate}`,
          expected: { invoice_date: urlDate },
          fixable: true,
        });
      }

      // Missing supplier ref (purchase only)
      if (inv.invoice_type === 'purchase' && !inv.supplier_invoice_number?.trim()) {
        out.push({
          id: `${inv.id}-missing`,
          invoice: inv,
          kind: 'missing-ref',
          detail: 'لا يوجد رقم فاتورة المورد',
          fixable: false,
        });
      }
    });

    // Duplicates
    dupMap.forEach((arr, key) => {
      if (arr.length > 1) {
        const [, ref] = key.split('::');
        arr.forEach(inv => {
          out.push({
            id: `${inv.id}-dup`,
            invoice: inv,
            kind: 'duplicate',
            detail: `مكرر: ${arr.length} فواتير بنفس رقم المورد (${ref})`,
            fixable: false,
          });
        });
      }
    });

    return out;
  }, [invoices]);

  const counts = useMemo(() => ({
    all: issues.length,
    math: issues.filter(i => i.kind === 'math').length,
    date: issues.filter(i => i.kind === 'date').length,
    'missing-ref': issues.filter(i => i.kind === 'missing-ref').length,
    duplicate: issues.filter(i => i.kind === 'duplicate').length,
  }), [issues]);

  const filtered = useMemo(() => activeTab === 'all' ? issues : issues.filter(i => i.kind === activeTab), [issues, activeTab]);

  const fixableCount = useMemo(() => issues.filter(i => i.fixable).length, [issues]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      await refetch();
      setHasRun(true);
      toast.success('اكتمل التدقيق');
    } catch (e: any) {
      toast.error(`فشل التدقيق: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }, [refetch]);

  const fixSingle = useCallback(async (issue: Issue) => {
    if (!issue.fixable || !issue.expected) return;
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (issue.expected.total !== undefined) payload.total = issue.expected.total;
      if (issue.expected.invoice_date) {
        payload.invoice_date = issue.expected.invoice_date;
        payload.due_date = issue.expected.invoice_date;
      }
      const { error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', issue.invoice.id)
        .eq('company_id', companyId!);
      if (error) throw error;
      toast.success(`تم إصلاح ${issue.invoice.invoice_number || issue.invoice.id.slice(0, 8)}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
    } catch (e: any) {
      toast.error(`فشل الإصلاح: ${e.message}`);
    }
  }, [companyId, refetch, queryClient]);

  const fixAll = useCallback(async () => {
    setFixingAll(true);
    let success = 0;
    let failed = 0;
    try {
      for (const issue of issues.filter(i => i.fixable)) {
        try {
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };
          if (issue.expected?.total !== undefined) payload.total = issue.expected.total;
          if (issue.expected?.invoice_date) {
            payload.invoice_date = issue.expected.invoice_date;
            payload.due_date = issue.expected.invoice_date;
          }
          const { error } = await supabase
            .from('invoices').update(payload)
            .eq('id', issue.invoice.id).eq('company_id', companyId!);
          if (error) throw error;
          success++;
        } catch { failed++; }
      }
      toast.success(`تم إصلاح ${success} ${failed > 0 ? `(فشل ${failed})` : ''}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
    } finally {
      setFixingAll(false);
      setConfirmFixAllOpen(false);
    }
  }, [issues, companyId, refetch, queryClient]);

  const KIND_META: Record<IssueKind, { label: string; icon: typeof Calculator; color: string }> = {
    math: { label: 'فرق حسابي', icon: Calculator, color: 'text-red-500' },
    date: { label: 'فرق في التاريخ', icon: Calendar, color: 'text-amber-500' },
    'missing-ref': { label: 'رقم مورد ناقص', icon: FileX, color: 'text-orange-500' },
    duplicate: { label: 'فاتورة مكررة', icon: Copy, color: 'text-purple-500' },
  };

  return (
    <div className="space-y-4 p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10"><ShieldCheck className="w-7 h-7 text-primary" /></div>
              <div>
                <CardTitle className="text-2xl">تدقيق الفواتير التلقائي</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  فحص شامل لمطابقة المبالغ، التواريخ، أرقام المورد، والفواتير المكررة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="lg" onClick={handleRun} disabled={running || isFetching} className="gap-2">
                {running || isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                تشغيل التدقيق
              </Button>
              {hasRun && fixableCount > 0 && (
                <Button size="lg" variant="default" onClick={() => setConfirmFixAllOpen(true)}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Wrench className="w-4 h-4" />
                  إصلاح الكل تلقائياً ({fixableCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      {hasRun && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={ShieldCheck} label="فواتير مفحوصة" value={invoices.length} color="text-blue-500" />
          <StatCard icon={Calculator} label="أخطاء حسابية" value={counts.math} color="text-red-500" />
          <StatCard icon={Calendar} label="أخطاء التاريخ" value={counts.date} color="text-amber-500" />
          <StatCard icon={FileX} label="رقم مورد ناقص" value={counts['missing-ref']} color="text-orange-500" />
          <StatCard icon={Copy} label="فواتير مكررة" value={counts.duplicate} color="text-purple-500" />
        </div>
      )}

      {/* Results */}
      {hasRun && issues.length === 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold">لا توجد أخطاء</h3>
            <p className="text-muted-foreground">جميع فواتيرك ({invoices.length}) سليمة وصحيحة</p>
          </CardContent>
        </Card>
      )}

      {hasRun && issues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              الأخطاء المكتشفة ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all">الكل ({counts.all})</TabsTrigger>
                <TabsTrigger value="math">حسابي ({counts.math})</TabsTrigger>
                <TabsTrigger value="date">تاريخ ({counts.date})</TabsTrigger>
                <TabsTrigger value="missing-ref">رقم ناقص ({counts['missing-ref']})</TabsTrigger>
                <TabsTrigger value="duplicate">مكرر ({counts.duplicate})</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">رقم الفاتورة</TableHead>
                        <TableHead className="w-[80px]">النوع</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                        <TableHead className="w-[140px]">المورد/العميل</TableHead>
                        <TableHead className="w-[120px]">نوع الخطأ</TableHead>
                        <TableHead>التفاصيل</TableHead>
                        <TableHead className="w-[160px] text-end">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا أخطاء في هذا التصنيف</TableCell></TableRow>
                      ) : filtered.map(issue => {
                        const meta = KIND_META[issue.kind];
                        const Icon = meta.icon;
                        return (
                          <TableRow key={issue.id}>
                            <TableCell className="font-mono text-xs font-bold">{issue.invoice.invoice_number || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={issue.invoice.invoice_type === 'purchase' ? 'secondary' : 'outline'} className="text-[10px]">
                                {issue.invoice.invoice_type === 'purchase' ? 'شراء' : 'بيع'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{issue.invoice.invoice_date}</TableCell>
                            <TableCell className="text-xs truncate max-w-[140px]">{issue.invoice.supplier?.name || '-'}</TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1.5 text-xs font-semibold ${meta.color}`}>
                                <Icon className="w-3.5 h-3.5" /> {meta.label}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{issue.detail}</TableCell>
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1">
                                {issue.invoice.file_url && (
                                  <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                                    <a href={issue.invoice.file_url} target="_blank" rel="noreferrer" title="فتح الأصل">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </Button>
                                )}
                                {issue.fixable ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => fixSingle(issue)}>
                                    <Wrench className="w-3 h-3" /> إصلاح
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">يدوي</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!hasRun && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <h3 className="text-lg font-semibold text-muted-foreground">اضغط "تشغيل التدقيق" لبدء الفحص</h3>
            <div className="text-xs text-muted-foreground max-w-md mx-auto space-y-1 pt-2">
              <p>سيتم فحص كل فواتير الشركة الحالية والبحث عن:</p>
              <ul className="list-disc list-inside text-start mt-2 space-y-0.5">
                <li>أخطاء حسابية (الصافي + الضريبة ≠ الإجمالي)</li>
                <li>عدم تطابق التاريخ مع الملف الأصلي</li>
                <li>فواتير شراء بدون رقم فاتورة المورد</li>
                <li>فواتير شراء مكررة (نفس المورد + نفس الرقم)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Fix-All */}
      <AlertDialog open={confirmFixAllOpen} onOpenChange={setConfirmFixAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تأكيد الإصلاح التلقائي
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-start">
              <span className="block">سيتم إصلاح <strong>{fixableCount}</strong> خطأ تلقائياً:</span>
              <ul className="list-disc list-inside text-xs space-y-1 pr-4">
                <li>تصحيح الإجمالي ليطابق (الصافي + الضريبة)</li>
                <li>تصحيح التاريخ ليطابق الملف الأصلي</li>
              </ul>
              <span className="block text-amber-600 font-semibold pt-2">
                ⚠️ الفواتير المرحّلة (issued/posted) قد لا تتأثر إذا كانت محمية.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fixingAll}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={fixAll} disabled={fixingAll} className="bg-emerald-600 hover:bg-emerald-700">
              {fixingAll ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> جاري الإصلاح...</> : 'تأكيد وإصلاح الكل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="w-5 h-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
