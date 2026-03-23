import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { type FixedAsset, type DepreciationEntry } from '@/hooks/useFixedAssets';

interface DepreciationLogTabProps {
  entries: DepreciationEntry[];
  assets: FixedAsset[];
  formatCurrency: (n: number) => string;
  t: any;
}

export function DepreciationLogTab({ entries, assets, formatCurrency, t }: DepreciationLogTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <TrendingDown className="w-6 h-6 text-primary" />
          <div><CardTitle>{t.fa_dep_log_title}</CardTitle><CardDescription>{t.fa_dep_log_subtitle}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{t.fa_dep_no_data}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.fa_dep_col_date}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_asset}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_period_start}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_period_end}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_amount}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_accumulated}</TableHead>
                <TableHead className="text-right">{t.fa_dep_col_book_value}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const asset = assets.find(a => a.id === entry.asset_id);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{asset?.name || '-'}</TableCell>
                    <TableCell>{format(new Date(entry.period_start), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(new Date(entry.period_end), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-destructive">{formatCurrency(entry.depreciation_amount)}</TableCell>
                    <TableCell>{formatCurrency(entry.accumulated_after)}</TableCell>
                    <TableCell className="text-primary font-medium">{formatCurrency(entry.book_value_after)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
