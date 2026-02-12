import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useJournalEntries, useAccounts, useCreateJournalEntry, useDeleteJournalEntry, useJournalEntry } from '@/hooks/useAccounting';
import { useCostCenters } from '@/hooks/useCostCenters';
import { toast } from 'sonner';
import { Loader2, Plus, Eye, Trash2, BookOpen, CalendarIcon, X, Printer, FileDown, Paperclip } from 'lucide-react';
import { JournalEntryEditDialog } from './JournalEntryEditDialog';
import { JournalAttachments } from './JournalAttachments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AccountSearchSelect } from './AccountSearchSelect';
import { JournalEntryPrintDialog } from './JournalEntryPrintDialog';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useLanguage } from '@/contexts/LanguageContext';

interface JournalLine {
  account_id: string;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  line_date?: string;
  cost_center?: string;
  cost_center_id?: string;
}

export function JournalEntriesPage() {
  const { t, direction } = useLanguage();
  const { data: entries = [], isLoading } = useJournalEntries();
  const { data: accounts = [] } = useAccounts();
  const { data: costCenters = [] } = useCostCenters();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const createJournalEntry = useCreateJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const [attachmentEntryId, setAttachmentEntryId] = useState<string | null>(null);
  const [printingEntryId, setPrintingEntryId] = useState<string | null>(null);
  const { data: viewingEntry } = useJournalEntry(viewingEntryId);
  const { data: printingEntry } = useJournalEntry(printingEntryId);
  
  // Form state
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [notes1, setNotes1] = useState('');
  const [notes2, setNotes2] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [vatType, setVatType] = useState<'sales' | 'purchases'>('purchases');
  const [taxNumber, setTaxNumber] = useState('');
  const [supplierCustomer, setSupplierCustomer] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
    { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
  ]);

  const resetForm = () => {
    setEntryDate(new Date());
    setDescription('');
    setNotes1('');
    setNotes2('');
    setIncludeVat(false);
    setVatType('purchases');
    setTaxNumber('');
    setSupplierCustomer('');
    setLines([
      { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
      { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { 
      account_id: '', 
      description: '', 
      debit: 0, 
      credit: 0, 
      reference: '', 
      line_date: format(new Date(), 'yyyy-MM-dd'), 
      cost_center: '' 
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      newLines[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      newLines[index].account_id = value as string;
      newLines[index].account_code = account?.code;
      newLines[index].account_name = account?.name;
    } else {
      (newLines[index] as any)[field] = value;
    }
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async () => {
    if (!description) {
      toast.error(t.je_statement);
      return;
    }

    const validLines = lines.filter(line => line.account_id && (line.debit > 0 || line.credit > 0));
    if (validLines.length < 2) {
      toast.error(t.acc_error);
      return;
    }

    if (!isBalanced) {
      toast.error(t.je_unbalanced);
      return;
    }

    try {
      await createJournalEntry.mutateAsync({
        entry: {
          entry_date: format(entryDate, 'yyyy-MM-dd'),
          description: `${description}${notes1 ? ` | ${notes1}` : ''}${notes2 ? ` | ${notes2}` : ''}`,
          is_posted: true,
          total_debit: totalDebit,
          total_credit: totalCredit,
          reference_type: 'manual',
          reference_id: null,
          created_by: null,
        },
        lines: validLines.map(line => ({
          account_id: line.account_id,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          cost_center_id: line.cost_center_id || null,
        })),
      });
      toast.success(t.acc_added);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t.acc_error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry.mutateAsync(id);
      toast.success(t.acc_deleted);
    } catch (error) {
      toast.error(t.acc_error);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const getReferenceTypeLabel = (type: string | null) => {
    switch (type) {
      case 'manual': return t.je_type_manual;
      case 'sale': return t.je_type_sales;
      case 'purchase': return t.je_type_purchases;
      case 'expense': return t.je_type_expenses;
      case 'voucher': return t.je_type_voucher;
      default: return t.je_type_auto;
    }
  };

  // Filter entries by fiscal year
  const filteredEntries = useMemo(() => {
    return filterByFiscalYear(entries, 'entry_date');
  }, [entries, filterByFiscalYear]);

  // Get next entry number
  const nextEntryNumber = filteredEntries.length > 0 ? Math.max(...filteredEntries.map(e => e.entry_number)) + 1 : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.je_title}</h1>
          <p className="text-muted-foreground">{t.je_subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              {t.je_new}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl">{t.je_dialog_title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.je_voucher_number}</Label>
                  <Input 
                    value={nextEntryNumber} 
                    disabled 
                    className="bg-primary/10 font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.je_date}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !entryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {entryDate ? format(entryDate, "yyyy-MM-dd") : t.je_date}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={entryDate}
                        onSelect={(date) => date && setEntryDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.je_entry_number}</Label>
                  <Input 
                    value={nextEntryNumber} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.je_periodic}</Label>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.je_periodic_none}</SelectItem>
                      <SelectItem value="monthly">{t.je_periodic_monthly}</SelectItem>
                      <SelectItem value="quarterly">{t.je_periodic_quarterly}</SelectItem>
                      <SelectItem value="yearly">{t.je_periodic_yearly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">{t.je_statement}</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.je_note_1}</Label>
                    <Input
                      value={notes1}
                      onChange={(e) => setNotes1(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.je_note_2}</Label>
                    <Input
                      value={notes2}
                      onChange={(e) => setNotes2(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-2 flex items-center gap-2 border-b">
                  <Button variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-4 h-4 ml-1" />
                    {t.je_new_line}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="min-w-[250px]">{t.je_col_account}</TableHead>
                        <TableHead className="w-28">{t.je_col_debit}</TableHead>
                        <TableHead className="w-28">{t.je_col_credit}</TableHead>
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
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <AccountSearchSelect
                              accounts={accounts}
                              value={line.account_id}
                              onChange={(value) => updateLine(index, 'account_id', value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.account_name || ''}
                              readOnly
                              className="bg-muted/30 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.reference || ''}
                              onChange={(e) => updateLine(index, 'reference', e.target.value)}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={line.line_date || ''}
                              onChange={(e) => updateLine(index, 'line_date', e.target.value)}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.cost_center_id || 'none'}
                              onValueChange={(value) => updateLine(index, 'cost_center_id', value === 'none' ? '' : value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeLine(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
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
                    <Checkbox 
                      id="include-vat" 
                      checked={includeVat}
                      onCheckedChange={(checked) => setIncludeVat(!!checked)}
                    />
                    <Label htmlFor="include-vat" className="text-sm cursor-pointer">{t.je_include_vat}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="vat-enabled" 
                      checked={includeVat}
                      onCheckedChange={(checked) => setIncludeVat(!!checked)}
                    />
                    <Label htmlFor="vat-enabled" className="text-sm cursor-pointer">{t.je_record_vat}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">{t.je_customer_supplier}</Label>
                    <Input
                      value={supplierCustomer}
                      onChange={(e) => setSupplierCustomer(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">{t.je_tax_number}</Label>
                    <Input
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Select value={vatType} onValueChange={(v) => setVatType(v as 'sales' | 'purchases')}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchases">{t.je_purchases_standard}</SelectItem>
                      <SelectItem value="sales">{t.je_sales_standard}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Totals Section */}
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
                    <p className={cn(
                      "text-xl font-bold",
                      difference === 0 ? "text-green-600" : "text-destructive"
                    )}>
                      {difference.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.je_col_status}</Label>
                    <div className="mt-1">
                      {isBalanced ? (
                        <Badge className="bg-green-500">{t.je_balanced}</Badge>
                      ) : (
                        <Badge variant="destructive">{t.je_unbalanced}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t.je_exit}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Printer className="w-4 h-4 ml-2" />
                    {t.print}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    {t.je_new_btn}
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createJournalEntry.isPending || !isBalanced}
                    className="min-w-[120px]"
                  >
                    {createJournalEntry.isPending ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : null}
                    {t.je_approve}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Entry Dialog */}
      <Dialog open={!!viewingEntryId} onOpenChange={(open) => !open && setViewingEntryId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.je_details_title} #{viewingEntry?.entry_number}</DialogTitle>
            <DialogDescription>
              {viewingEntry && format(new Date(viewingEntry.entry_date), "PPP", { locale: ar })}
            </DialogDescription>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-foreground font-medium">{viewingEntry.description}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.je_col_account}</TableHead>
                    <TableHead>{t.je_col_statement}</TableHead>
                    <TableHead className="text-center">{t.je_col_debit}</TableHead>
                    <TableHead className="text-center">{t.je_col_credit}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingEntry.lines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono">{getAccountName(line.account_id)}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell className="text-center">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-center">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>{t.total}</TableCell>
                    <TableCell className="text-center">{viewingEntry.total_debit.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{viewingEntry.total_credit.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
                </Table>
              {viewingEntryId && <JournalAttachments journalEntryId={viewingEntryId} />}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewingEntryId(null)}>
                  {t.close}
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 ml-2" />
                  {t.print}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t.je_entries_title}
          </CardTitle>
          <CardDescription>{t.je_entries_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{t.je_no_entries}</p>
              <p className="text-sm">{t.je_no_entries_hint}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t.je_col_number}</TableHead>
                  <TableHead className="w-28">{t.je_col_date}</TableHead>
                  <TableHead>{t.je_col_desc}</TableHead>
                  <TableHead className="w-20">{t.je_col_type}</TableHead>
                  <TableHead className="w-28 text-center">{t.je_col_debit}</TableHead>
                  <TableHead className="w-28 text-center">{t.je_col_credit}</TableHead>
                  <TableHead className="w-24">{t.je_col_status}</TableHead>
                  <TableHead className="w-24">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono font-bold">{entry.entry_number}</TableCell>
                    <TableCell>{format(new Date(entry.entry_date), "yyyy/MM/dd")}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={entry.reference_type === 'manual' ? 'outline' : 'secondary'}>
                        {getReferenceTypeLabel(entry.reference_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{entry.total_debit.toLocaleString()}</TableCell>
                    <TableCell className="text-center font-medium">{entry.total_credit.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_posted ? "default" : "secondary"}>
                        {entry.is_posted ? t.je_status_posted : t.je_status_draft}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAttachmentEntryId(entry.id)}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingEntryId(entry.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPrintingEntryId(entry.id)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t.je_confirm_delete}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.je_confirm_delete_desc}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                {t.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attachments Dialog */}
      <JournalEntryEditDialog
        entryId={attachmentEntryId}
        open={!!attachmentEntryId}
        onOpenChange={(open) => !open && setAttachmentEntryId(null)}
        title={t.je_attachments}
      />

      {/* Print Dialog */}
      <JournalEntryPrintDialog
        entry={printingEntry || null}
        accounts={accounts}
        open={!!printingEntryId}
        onClose={() => setPrintingEntryId(null)}
      />
    </div>
  );
}
