import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Calculator, TrendingDown, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { type FixedAsset } from '@/hooks/useFixedAssets';

interface AssetsListTabProps {
  assets: FixedAsset[];
  formatCurrency: (n: number) => string;
  getStatusLabel: (s: string) => string;
  openEditDialog: (a: FixedAsset) => void;
  openDepreciationDialog: (id: string) => void;
  openDisposeDialog: (a: FixedAsset) => void;
  handleDelete: (id: string) => void;
  t: any;
}

export function AssetsListTab({ assets, formatCurrency, getStatusLabel, openEditDialog, openDepreciationDialog, openDisposeDialog, handleDelete, t }: AssetsListTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <div><CardTitle>{t.fa_list_title}</CardTitle><CardDescription>{t.fa_list_subtitle}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{t.fa_no_data}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.fa_col_number}</TableHead>
                <TableHead className="text-right">{t.fa_col_name}</TableHead>
                <TableHead className="text-right">{t.fa_col_category}</TableHead>
                <TableHead className="text-right">{t.fa_col_purchase_date}</TableHead>
                <TableHead className="text-right">{t.fa_col_purchase_price}</TableHead>
                <TableHead className="text-right">{t.fa_col_accumulated}</TableHead>
                <TableHead className="text-right">{t.fa_col_book_value}</TableHead>
                <TableHead className="text-right">{t.fa_col_status}</TableHead>
                <TableHead className="text-right">{t.fa_col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const bookValue = asset.current_value || (asset.purchase_price - asset.accumulated_depreciation);
                return (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.asset_number}</TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.category || '-'}</TableCell>
                    <TableCell>{format(new Date(asset.purchase_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{formatCurrency(asset.purchase_price)}</TableCell>
                    <TableCell className="text-destructive">{formatCurrency(asset.accumulated_depreciation)}</TableCell>
                    <TableCell className="text-primary font-medium">{formatCurrency(bookValue)}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'disposed' ? 'destructive' : asset.status === 'fully_depreciated' ? 'secondary' : asset.status === 'under_maintenance' ? 'outline' : 'default'}>
                        {getStatusLabel(asset.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {asset.status === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openDepreciationDialog(asset.id)} title={t.fa_tab_depreciation}><Calculator className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openDisposeDialog(asset)} title={t.fa_status_disposed}><TrendingDown className="w-4 h-4" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(asset)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
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
