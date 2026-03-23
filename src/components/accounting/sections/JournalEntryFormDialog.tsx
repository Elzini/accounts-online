/**
 * Journal Entry Form Dialog - Extracted from JournalEntriesPage
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AccountSearchSelect } from '../AccountSearchSelect';
import { ProjectSelector } from '@/components/forms/ProjectSelector';
import type { useJournalEntryForm } from '../hooks/useJournalEntryForm';

interface Props {
  hook: ReturnType<typeof useJournalEntryForm>;
}

export function JournalEntryFormDialog({ hook }: Props) {
  const {
    t, isDialogOpen, setIsDialogOpen, resetForm,
    nextEntryNumber, entryDate, setEntryDate,
    description, setDescription, notes1, setNotes1, notes2, setNotes2,
    projectId, setProjectId,
    includeVat, setIncludeVat, vatType, setVatType,
    supplierCustomer, setSupplierCustomer, taxNumber, setTaxNumber,
    lines, addLine, removeLine, updateLine,
    accounts, costCenters,
    totalDebit, totalCredit, difference, isBalanced,
    handleSubmit, createJournalEntry,
  } = hook;

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 ml-2" />{t.je_new}</Button>
      </DialogTrigger>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">{t.je_dialog_title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.je_voucher_number}</Label>
              <Input value={nextEntryNumber} disabled className="bg-primary/10 font-bold text-center" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.je_date}</Label>
              <Input type="date" value={entryDate ? format(entryDate, "yyyy-MM-dd") : ''} onChange={(e) => {
                const val = e.target.value;
                if (val) { const parsed = new Date(val + 'T00:00:00'); if (!isNaN(parsed.getTime())) setEntryDate(parsed); }
              }} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.je_entry_number}</Label>
              <Input value={nextEntryNumber} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.je_periodic}</Label>
              <Select defaultValue="none">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.je_periodic_none}</SelectItem>
                  <SelectItem value="monthly">{t.je_periodic_monthly}</SelectItem>
                  <SelectItem value="quarterly">{t.je_periodic_quarterly}</SelectItem>
                  <SelectItem value="yearly">{t.je_periodic_yearly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium">{t.je_statement}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.je_note_1}</Label>
                <Input value={notes1} onChange={(e) => setNotes1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.je_note_2}</Label>
                <Input value={notes2} onChange={(e) => setNotes2(e.target.value)} />
              </div>
            </div>
          </div>

          <ProjectSelector value={projectId} onChange={setProjectId} />

          {/* Lines Table */}
          <div className="border rounded-lg">
            <div className="bg-muted/50 p-2 flex items-center gap-2 border-b">
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 ml-1" />{t.je_new_line}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="min-w-[320px]">{t.je_col_account}</TableHead>
                    <TableHead className="min-w-[120px] w-36">{t.je_col_debit}</TableHead>
                    <TableHead className="min-w-[120px] w-36">{t.je_col_credit}</TableHead>
                    <TableHead className="min-w-[140px]">{t.je_col_statement}</TableHead>
                    <TableHead className="w-28">{t.je_col_reference}</TableHead>
                    <TableHead className="w-32">{t.je_col_date}</TableHead>
                    <TableHead className="w-28">{t.je_col_cost_center}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index} className="hover:bg-muted/20">
                      <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <AccountSearchSelect accounts={accounts} value={line.account_id} onChange={(v) => updateLine(index, 'account_id', v)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', e.target.value)} placeholder="0" className="text-center" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', e.target.value)} placeholder="0" className="text-center" />
                      </TableCell>
                      <TableCell>
                        <Input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="text-sm" />
                      </TableCell>
                      <TableCell>
                        <Input value={line.reference || ''} onChange={(e) => updateLine(index, 'reference', e.target.value)} className="text-sm" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" value={line.line_date || ''} onChange={(e) => updateLine(index, 'line_date', e.target.value)} className="text-sm" />
                      </TableCell>
                      <TableCell>
                        <Select value={line.cost_center_id || 'none'} onValueChange={(v) => updateLine(index, 'cost_center_id', v === 'none' ? '' : v)}>
                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t.je_periodic_none}</SelectItem>
                            {costCenters.filter(c => c.is_active).map(cc => (
                              <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lines.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removeLine(index)} className="h-8 w-8 text-destructive hover:text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* VAT Section */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="include-vat" checked={includeVat} onCheckedChange={(c) => setIncludeVat(!!c)} />
                <Label htmlFor="include-vat" className="text-sm cursor-pointer">{t.je_include_vat}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="vat-enabled" checked={includeVat} onCheckedChange={(c) => setIncludeVat(!!c)} />
                <Label htmlFor="vat-enabled" className="text-sm cursor-pointer">{t.je_record_vat}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t.je_customer_supplier}</Label>
                <Input value={supplierCustomer} onChange={(e) => setSupplierCustomer(e.target.value)} className="w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t.je_tax_number}</Label>
                <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className="w-40" />
              </div>
              <Select value={vatType} onValueChange={(v) => setVatType(v as 'sales' | 'purchases')}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchases">{t.je_purchases_standard}</SelectItem>
                  <SelectItem value="sales">{t.je_sales_standard}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <Label className="text-sm text-muted-foreground">{t.je_total_debit}</Label>
                <p className="text-xl font-bold text-primary">{totalDebit.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t.je_total_credit}</Label>
                <p className="text-xl font-bold text-primary">{totalCredit.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t.je_difference}</Label>
                <p className={cn("text-xl font-bold", difference === 0 ? "text-green-600" : "text-destructive")}>{difference.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t.je_col_status}</Label>
                <div className="mt-1">
                  {isBalanced ? <Badge className="bg-green-500">{t.je_balanced}</Badge> : <Badge variant="destructive">{t.je_unbalanced}</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.je_exit}</Button>
            <div className="flex gap-2">
              <Button variant="outline"><Printer className="w-4 h-4 ml-2" />{t.print}</Button>
              <Button variant="outline" onClick={resetForm}>{t.je_new_btn}</Button>
              <Button onClick={handleSubmit} disabled={createJournalEntry.isPending || !isBalanced} className="min-w-[120px]">
                {createJournalEntry.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {t.je_approve}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
