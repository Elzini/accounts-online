/**
 * Purchase Returns - Records List Tab
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RotateCw, Trash2, Pencil } from 'lucide-react';
import type { usePurchaseReturns } from '../hooks/usePurchaseReturns';

type Hook = ReturnType<typeof usePurchaseReturns>;

export function ReturnListTab({ hook }: { hook: Hook }) {
  const { language, searchList, setSearchList, filtered, openEdit, deleteMutation } = hook;

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pr-9 h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-violet-500 shadow-none" placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search records...'} value={searchList} onChange={e => setSearchList(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-b-2 border-violet-200 dark:border-violet-800">
              <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'رقم السند' : 'Note #'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: any) => (
              <TableRow key={r.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors">
                <TableCell className="font-mono font-bold text-xs">{r.note_number}</TableCell>
                <TableCell className="text-xs">{r.note_date}</TableCell>
                <TableCell className="font-bold text-xs">{Number(r.total_amount).toLocaleString()} ر.س</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.reason || '-'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                    {r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-full" onClick={() => openEdit(r)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteMutation.mutate(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <RotateCw className="w-8 h-8 text-muted-foreground/30" />
                    <span className="text-sm">{language === 'ar' ? 'لا توجد مرتجعات' : 'No returns found'}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
