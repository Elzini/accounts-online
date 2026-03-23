/**
 * Journal Entries List Card - Extracted from JournalEntriesPage
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Trash2, BookOpen, Paperclip, Printer, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import type { useJournalEntryForm } from '../hooks/useJournalEntryForm';

interface Props {
  hook: ReturnType<typeof useJournalEntryForm>;
}

export function JournalEntriesListCard({ hook }: Props) {
  const {
    t, language, filteredEntries, searchQuery, setSearchQuery,
    setViewingEntryId, setAttachmentEntryId, setPrintingEntryId,
    handleDelete, getReferenceTypeLabel,
  } = hook;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />{t.je_entries_title}
            </CardTitle>
            <CardDescription>{t.je_entries_desc}</CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={language === 'ar' ? 'بحث برقم القيد، التاريخ، الوصف، أو القيمة...' : 'Search by number, date, description, or amount...'}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted/40 border-border/50 focus:bg-card focus:border-primary/40 transition-all"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setSearchQuery('')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
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
              {filteredEntries.map((entry: any) => (
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
                      <Button variant="ghost" size="icon" onClick={() => setAttachmentEntryId(entry.id)}><Paperclip className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setViewingEntryId(entry.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setPrintingEntryId(entry.id)}><Printer className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.je_confirm_delete}</AlertDialogTitle>
                            <AlertDialogDescription>{t.je_confirm_delete_desc}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)}>{t.delete}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length > 0 && (
                <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                  <TableCell colSpan={4} className="text-center">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableCell>
                  <TableCell className="text-center font-mono">
                    {filteredEntries.reduce((s: number, e: any) => s + (e.total_debit || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {filteredEntries.reduce((s: number, e: any) => s + (e.total_credit || 0), 0).toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={2} className="text-center text-muted-foreground text-sm">
                    {filteredEntries.length} {language === 'ar' ? 'قيد' : 'entries'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
