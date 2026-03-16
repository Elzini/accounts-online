import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, XCircle, AlertTriangle, ArrowLeftRight, 
  FileText, Plus, Eye, ChevronDown, ChevronUp, RefreshCw, Loader2, HelpCircle
} from 'lucide-react';
import { ParsedInvoiceData, BatchParsedResult } from './PurchaseInvoiceAIImport';

export interface ExistingInvoice {
  id: string;
  invoice_number: string;
  supplier_invoice_number: string | null;
  supplier_id: string | null;
  customer_name: string | null;
  invoice_date: string;
  subtotal: number;
  total: number;
  vat_amount: number;
  status: string;
  payment_status: string | null;
}

export interface ReconciliationResult {
  parsed: BatchParsedResult;
  matchedInvoice: ExistingInvoice | null;
  matchType: 'exact' | 'partial' | 'amount_only' | 'none';
  matchScore: number;
  differences: string[];
}

interface InvoiceReconciliationProps {
  results: ReconciliationResult[];
  formatCurrency: (val: number) => string;
  onImportSelected: (selected: BatchParsedResult[]) => void;
  onViewDetails: (result: BatchParsedResult) => void;
  onUpdateExisting?: (result: ReconciliationResult) => Promise<void>;
  onClose: () => void;
}

export function matchInvoices(
  parsedResults: BatchParsedResult[],
  existingInvoices: ExistingInvoice[]
): ReconciliationResult[] {
  return parsedResults.filter(r => r.success).map(parsed => {
    const data = parsed.data;
    let bestMatch: ExistingInvoice | null = null;
    let bestScore = 0;
    let matchType: ReconciliationResult['matchType'] = 'none';
    const differences: string[] = [];
    let bestChecks = {
      invoiceNumber: false,
      date: false,
      subtotal: false,
      vat: false,
      total: false,
    };

    for (const existing of existingInvoices) {
      let score = 0;
      const tempDiffs: string[] = [];

      // Match by supplier invoice number (strongest signal)
      const parsedInvNum = normalizeInvoiceNumber(data.invoice_number);
      const existingInvNum = normalizeInvoiceNumber(existing.supplier_invoice_number || '');
      const invoiceNumberMatch = !!parsedInvNum && !!existingInvNum && parsedInvNum === existingInvNum;

      if (invoiceNumberMatch) {
        score += 40;
      } else if (parsedInvNum && existingInvNum) {
        tempDiffs.push(`رقم فاتورة المورد: ${data.invoice_number} ≠ ${existing.supplier_invoice_number}`);
      }

      // Match by total amount (zero tolerance at halalah level)
      const totalHalalahDiff = Math.abs(toHalalah(data.total_amount) - toHalalah(existing.total));
      const totalMatch = totalHalalahDiff === 0;
      if (totalMatch) {
        score += 25;
      } else if (totalHalalahDiff <= 100) {
        score += 15;
        tempDiffs.push(`الإجمالي شامل الضريبة: ${formatAmount(data.total_amount)} ≠ ${formatAmount(existing.total)} (فرق: ${(totalHalalahDiff / 100).toFixed(2)} ر.س)`);
      } else {
        tempDiffs.push(`الإجمالي شامل الضريبة: ${formatAmount(data.total_amount)} ≠ ${formatAmount(existing.total)}`);
      }

      // Match by subtotal (before VAT)
      let subtotalMatch = false;
      if (data.subtotal !== undefined && existing.subtotal !== undefined) {
        const subtotalHalalahDiff = Math.abs(toHalalah(data.subtotal) - toHalalah(existing.subtotal));
        subtotalMatch = subtotalHalalahDiff === 0;
        if (!subtotalMatch) {
          tempDiffs.push(`الإجمالي قبل الضريبة: ${formatAmount(data.subtotal)} ≠ ${formatAmount(existing.subtotal)} (فرق: ${(subtotalHalalahDiff / 100).toFixed(2)} ر.س)`);
        }
      }

      // Match by VAT amount (zero tolerance)
      let vatMatch = false;
      if (data.vat_amount !== undefined && existing.vat_amount !== undefined) {
        const vatHalalahDiff = Math.abs(toHalalah(data.vat_amount) - toHalalah(existing.vat_amount));
        vatMatch = vatHalalahDiff === 0;
        if (vatMatch) {
          score += 10;
        } else {
          tempDiffs.push(`الضريبة: ${formatAmount(data.vat_amount)} ≠ ${formatAmount(existing.vat_amount)} (فرق: ${(vatHalalahDiff / 100).toFixed(2)} ر.س)`);
        }
      }

      // Match by supplier name
      const parsedSupplier = normalizeText(data.supplier_name);
      const existingSupplier = normalizeText(existing.customer_name || '');
      if (parsedSupplier && existingSupplier &&
          (parsedSupplier.includes(existingSupplier) || existingSupplier.includes(parsedSupplier))) {
        score += 15;
      }

      // Match by date
      const parsedDate = data.invoice_date?.split('T')[0];
      const existingDate = existing.invoice_date?.split('T')[0];
      const dateMatch = !!parsedDate && !!existingDate && parsedDate === existingDate;
      if (dateMatch) {
        score += 10;
      } else if (parsedDate && existingDate) {
        tempDiffs.push(`التاريخ: ${parsedDate} ≠ ${existingDate}`);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = existing;
        differences.length = 0;
        differences.push(...tempDiffs);
        bestChecks = {
          invoiceNumber: invoiceNumberMatch,
          date: dateMatch,
          subtotal: subtotalMatch,
          vat: vatMatch,
          total: totalMatch,
        };
      }
    }

    if (bestMatch && bestChecks.invoiceNumber && bestChecks.date && bestChecks.subtotal && bestChecks.vat && bestChecks.total) {
      matchType = 'exact';
    } else if (bestScore >= 40) {
      matchType = 'partial';
    } else if (bestScore >= 25) {
      matchType = 'amount_only';
    } else {
      bestMatch = null;
      matchType = 'none';
    }

    return { parsed, matchedInvoice: bestMatch, matchType, matchScore: bestScore, differences };
  });
}

function toHalalah(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  return Math.round(Number(value) * 100);
}

function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(2);
}

function normalizeInvoiceNumber(num: string): string {
  return num.replace(/[\s\-\/\\._]+/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).toLowerCase().trim();
}

function normalizeText(text: string): string {
  return text.replace(/[ـ\s]+/g, ' ').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim().toLowerCase();
}

export function InvoiceReconciliation({
  results,
  formatCurrency,
  onImportSelected,
  onViewDetails,
  onUpdateExisting,
  onClose,
}: InvoiceReconciliationProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    // Pre-select unmatched invoices
    const ids = new Set<number>();
    results.forEach(r => {
      if (r.matchType === 'none') ids.add(r.parsed.index);
    });
    return ids;
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'partial'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const stats = useMemo(() => ({
    total: results.length,
    exact: results.filter(r => r.matchType === 'exact').length,
    partial: results.filter(r => r.matchType === 'partial' || r.matchType === 'amount_only').length,
    unmatched: results.filter(r => r.matchType === 'none').length,
  }), [results]);

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    if (filter === 'matched') return results.filter(r => r.matchType === 'exact');
    if (filter === 'partial') return results.filter(r => r.matchType === 'partial' || r.matchType === 'amount_only');
    return results.filter(r => r.matchType === 'none');
  }, [results, filter]);

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIds);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    const unmatchedIds = results.filter(r => r.matchType === 'none').map(r => r.parsed.index);
    const allSelected = unmatchedIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unmatchedIds));
    }
  };

  const handleImport = () => {
    const selected = results
      .filter(r => selectedIds.has(r.parsed.index))
      .map(r => r.parsed);
    onImportSelected(selected);
  };

  const getMatchBadge = (r: ReconciliationResult) => {
    switch (r.matchType) {
      case 'exact':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="w-3 h-3" />
            مطابقة تامة
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
            <AlertTriangle className="w-3 h-3" />
            مطابقة جزئية
          </Badge>
        );
      case 'amount_only':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            مبلغ متطابق
          </Badge>
        );
      case 'none':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
            <XCircle className="w-3 h-3" />
            غير موجودة
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`p-3 rounded-lg border text-center transition-all ${filter === 'all' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}
        >
          <div className="text-lg font-bold">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">إجمالي</div>
        </button>
        <button
          onClick={() => setFilter('matched')}
          className={`p-3 rounded-lg border text-center transition-all ${filter === 'matched' ? 'border-green-500 bg-green-50 dark:bg-green-950/20 ring-1 ring-green-500' : 'hover:bg-muted/50'}`}
        >
          <div className="text-lg font-bold text-green-600">{stats.exact}</div>
          <div className="text-[10px] text-muted-foreground">مطابقة</div>
        </button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilter('partial')}
                className={`p-3 rounded-lg border text-center transition-all ${filter === 'partial' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500' : 'hover:bg-muted/50'}`}
              >
                <div className="text-lg font-bold text-yellow-600">{stats.partial}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">جزئية <HelpCircle className="w-3 h-3" /></div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p className="font-bold mb-1">مطابقة جزئية تعني:</p>
              <p>الفاتورة موجودة في النظام لكن بعض البيانات مختلفة (مثل المبلغ أو التاريخ أو رقم الفاتورة). يمكنك تحديث الفاتورة الحالية لتطابق البيانات المستوردة.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <button
          onClick={() => setFilter('unmatched')}
          className={`p-3 rounded-lg border text-center transition-all ${filter === 'unmatched' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 ring-1 ring-red-500' : 'hover:bg-muted/50'}`}
        >
          <div className="text-lg font-bold text-red-600">{stats.unmatched}</div>
          <div className="text-[10px] text-muted-foreground">غير موجودة</div>
        </button>
      </div>

      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 text-center">
                <Checkbox 
                  checked={results.filter(r => r.matchType === 'none').every(r => selectedIds.has(r.parsed.index))}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-right w-8">#</TableHead>
              <TableHead className="text-right">المورد</TableHead>
              <TableHead className="text-right">رقم فاتورة المورد</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-left">المبلغ</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <>
                <TableRow 
                  key={r.parsed.index} 
                  className={`hover:bg-muted/20 cursor-pointer ${r.matchType === 'none' ? 'bg-red-50/30 dark:bg-red-950/10' : ''} ${selectedIds.has(r.parsed.index) ? 'bg-primary/5' : ''}`}
                  onClick={() => setExpandedId(expandedId === r.parsed.index ? null : r.parsed.index)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(r.parsed.index)}
                      onCheckedChange={() => toggleSelect(r.parsed.index)}
                      disabled={r.matchType === 'exact'}
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{r.parsed.index + 1}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{r.parsed.data.supplier_name}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.parsed.data.invoice_number}</TableCell>
                  <TableCell className="text-right text-xs">{r.parsed.data.invoice_date}</TableCell>
                  <TableCell className="text-left font-mono text-sm">{formatCurrency(r.parsed.data.total_amount)}</TableCell>
                  <TableCell className="text-center">{getMatchBadge(r)}</TableCell>
                  <TableCell>
                    {expandedId === r.parsed.index ? 
                      <ChevronUp className="w-4 h-4 text-muted-foreground" /> : 
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </TableCell>
                </TableRow>
                {expandedId === r.parsed.index && (
                  <TableRow key={`detail-${r.parsed.index}`}>
                    <TableCell colSpan={8} className="p-0">
                      <div className="p-3 bg-muted/20 border-t space-y-2">
                        {r.matchedInvoice ? (
                          <div className="space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground">مقارنة تفصيلية - الفاتورة المستوردة مع النظام ({r.matchedInvoice.invoice_number}):</div>
                            <div className="border rounded overflow-hidden">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="bg-muted/40">
                                    <th className="text-right p-1.5 font-semibold">البيان</th>
                                    <th className="text-right p-1.5 font-semibold text-blue-600">المستورد (PDF)</th>
                                    <th className="text-right p-1.5 font-semibold text-purple-600">النظام الحالي</th>
                                    <th className="text-center p-1.5 font-semibold">الحالة</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const d = r.parsed.data;
                                    const e = r.matchedInvoice!;
                                    const rows = [
                                      { label: 'رقم فاتورة المورد', imported: d.invoice_number, system: e.supplier_invoice_number || '-' },
                                      { label: 'التاريخ', imported: d.invoice_date?.split('T')[0] || '-', system: e.invoice_date?.split('T')[0] || '-' },
                                      { label: 'الإجمالي قبل الضريبة', imported: d.subtotal?.toFixed(2) || '-', system: e.subtotal?.toFixed(2) || '-' },
                                      { label: 'الضريبة', imported: d.vat_amount?.toFixed(2) || '-', system: e.vat_amount?.toFixed(2) || '-' },
                                      { label: 'الإجمالي شامل الضريبة', imported: d.total_amount?.toFixed(2), system: e.total?.toFixed(2) },
                                      { label: 'عدد الأصناف', imported: String(d.items?.length || 0), system: '-' },
                                    ];
                                    return rows.map((row, i) => {
                                      const match = row.imported === row.system;
                                      const hasDiff = !match && row.imported !== '-' && row.system !== '-';
                                      return (
                                        <tr key={i} className={hasDiff ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                                          <td className="p-1.5 font-medium border-t">{row.label}</td>
                                          <td className="p-1.5 font-mono border-t text-blue-700 dark:text-blue-400">{row.imported}</td>
                                          <td className="p-1.5 font-mono border-t text-purple-700 dark:text-purple-400">{row.system}</td>
                                          <td className="p-1.5 border-t text-center">
                                            {match ? (
                                              <CheckCircle className="w-3.5 h-3.5 text-green-500 inline" />
                                            ) : hasDiff ? (
                                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 inline" />
                                            ) : (
                                              <span className="text-muted-foreground">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <Badge variant="outline" className="text-[10px]">
                                {r.matchedInvoice.status === 'draft' ? 'مسودة' : r.matchedInvoice.status === 'issued' ? 'معتمدة' : r.matchedInvoice.status}
                              </Badge>
                              <span className="text-muted-foreground">نقاط التطابق: {r.matchScore}/100</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <XCircle className="w-4 h-4" />
                            لم يتم العثور على فاتورة مطابقة في النظام - يمكنك تحديدها لاستيرادها كفاتورة جديدة
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={(e) => { e.stopPropagation(); onViewDetails(r.parsed); }}
                          >
                            <Eye className="w-3 h-3" />
                            عرض التفاصيل
                          </Button>
                          {r.matchType !== 'none' && r.matchType !== 'exact' && r.matchedInvoice && onUpdateExisting && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-7 gap-1"
                              disabled={updatingId === r.parsed.index}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setUpdatingId(r.parsed.index);
                                try {
                                  await onUpdateExisting(r);
                                } finally {
                                  setUpdatingId(null);
                                }
                              }}
                            >
                              {updatingId === r.parsed.index ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              تحديث الفاتورة الحالية
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {selectedIds.size > 0 && (
            <span>تم تحديد {selectedIds.size} فاتورة للاستيراد</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {selectedIds.size > 0 && (
            <Button onClick={handleImport} className="gap-2">
              <Plus className="w-4 h-4" />
              استيراد المحدد ({selectedIds.size} فاتورة)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
