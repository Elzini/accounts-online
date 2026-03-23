import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, RotateCcw } from 'lucide-react';

interface Props {
  filtered: any[];
  searchList: string;
  setSearchList: (v: string) => void;
  language: string;
  onDelete: (id: string) => void;
}

export function ReturnsListTab({ filtered, searchList, setSearchList, language, onDelete }: Props) {
  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pr-9 h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none" placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search records...'} value={searchList} onChange={e => setSearchList(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border-b-2 border-rose-200 dark:border-rose-800">
              <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'رقم السند' : 'Note #'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
              <TableHead className="text-center text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: any) => (
              <TableRow key={r.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                <TableCell className="font-mono font-bold text-xs">{r.note_number}</TableCell>
                <TableCell className="text-xs">{r.note_date}</TableCell>
                <TableCell className="font-bold text-xs">{Number(r.total_amount).toLocaleString()} ر.س</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.reason || '-'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                    {r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => onDelete(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <RotateCcw className="w-8 h-8 text-muted-foreground/30" />
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
