import { useState } from 'react';
import { Plus, FileText, Download, Wallet, CheckCircle, Clock, AlertCircle, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCustody } from '@/hooks/useCustody';
import { calculateCustodySummary, Custody } from '@/services/custody';
import { CustodyFormDialog } from './CustodyFormDialog';
import { CustodySettlementDialog } from './CustodySettlementDialog';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { useLanguage } from '@/contexts/LanguageContext';

export function CustodyPage() {
  const { t, language } = useLanguage();
  const { custodies, isLoading, deleteCustody, isDeleting } = useCustody();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustody, setSelectedCustody] = useState<Custody | null>(null);
  const [settlementCustodyId, setSettlementCustodyId] = useState<string | null>(null);

  const currency = language === 'ar' ? 'ر.س' : 'SAR';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><Clock className="h-3 w-3" /> {t.custody_status_active}</Badge>;
      case 'settled':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> {t.custody_status_settled}</Badge>;
      case 'partially_settled':
        return <Badge variant="outline" className="gap-1 text-orange-600"><AlertCircle className="h-3 w-3" /> {t.custody_status_partial}</Badge>;
      case 'carried':
        return <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50"><Wallet className="h-3 w-3" /> {t.custody_status_carried}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (custody: Custody) => { setSelectedCustody(custody); setIsFormOpen(true); };
  const handleSettlement = (custodyId: string) => { setSettlementCustodyId(custodyId); };
  const handleDelete = (id: string) => { if (confirm(t.custody_delete_confirm)) { deleteCustody(id); } };

  const totalActiveCustodies = custodies.filter(c => c.status === 'active').length;
  const carriedAmount = custodies.filter(c => c.status === 'carried').reduce((sum, c) => sum + Number(c.custody_amount), 0);
  const totalActiveAmount = custodies.filter(c => c.status === 'active').reduce((sum, c) => sum + Number(c.custody_amount), 0) - carriedAmount;
  const settledCount = custodies.filter(c => c.status === 'settled').length;
  const carriedCount = custodies.filter(c => c.status === 'carried').length;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            {t.custody_title}
          </h1>
          <p className="text-muted-foreground">{t.custody_subtitle}</p>
        </div>
        <Button onClick={() => { setSelectedCustody(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.custody_add}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.custody_active_count}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalActiveCustodies}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.custody_active_amount}</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalActiveAmount < 0 ? 'text-destructive' : 'text-primary'}`}>
              {formatNumber(totalActiveAmount)} {currency}
            </div>
            {carriedAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{t.custody_carried_deduction} {formatNumber(carriedAmount)} {currency}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.custody_carried_balance}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {carriedCount > 0 ? `-${formatNumber(carriedAmount)}` : '0'} {currency}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{carriedCount} {t.custody_carried_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.custody_settled_count}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{settledCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.custody_list}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t.custody_loading}</div>
          ) : custodies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.custody_no_records}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.custody_number}</TableHead>
                  <TableHead className="text-right">{t.custody_type}</TableHead>
                  <TableHead className="text-right">{t.custody_name}</TableHead>
                  <TableHead className="text-right">{t.custody_recipient}</TableHead>
                  <TableHead className="text-right">{t.amount}</TableHead>
                  <TableHead className="text-right">{t.custody_spent}</TableHead>
                  <TableHead className="text-right">{t.custody_remaining}</TableHead>
                  <TableHead className="text-right">{t.date}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custodies.map((custody) => {
                  const summary = calculateCustodySummary(custody);
                  return (
                    <TableRow key={custody.id}>
                      <TableCell className="font-medium">#{custody.custody_number}</TableCell>
                      <TableCell>
                        {custody.custody_type === 'advance' 
                          ? <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5"><Banknote className="h-3 w-3" /> {t.custody_type_advance}</Badge>
                          : <Badge variant="outline" className="gap-1"><Wallet className="h-3 w-3" /> {t.custody_type_custody}</Badge>
                        }
                      </TableCell>
                      <TableCell>{custody.custody_name}</TableCell>
                      <TableCell>{custody.employee?.name || '-'}</TableCell>
                      <TableCell>{formatNumber(custody.custody_amount)} {currency}</TableCell>
                      <TableCell className="text-destructive">{formatNumber(summary.totalSpent)} {currency}</TableCell>
                      <TableCell className="text-green-600 font-semibold">{formatNumber(summary.returnedAmount)} {currency}</TableCell>
                      <TableCell>{new Date(custody.custody_date).toLocaleDateString(locale)}</TableCell>
                      <TableCell>{getStatusBadge(custody.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSettlement(custody.id)}>
                            <FileText className="h-4 w-4 ml-1" />
                            {t.custody_settlement}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(custody)}>{t.custody_edit}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(custody.id)} disabled={isDeleting}>{t.custody_delete}</Button>
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

      <CustodyFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} custody={selectedCustody} />
      {settlementCustodyId && (
        <CustodySettlementDialog open={!!settlementCustodyId} onOpenChange={(open) => !open && setSettlementCustodyId(null)} custodyId={settlementCustodyId} />
      )}
    </div>
  );
}
