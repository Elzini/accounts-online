import { useState, useMemo } from 'react';
import { Printer, ArrowUpRight, ArrowDownLeft, Building2, Phone, MapPin, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useAppSettings } from '@/hooks/useSettings';
import { format } from 'date-fns';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartnerDealershipReportProps { setActivePage: (page: ActivePage) => void; }

export function PartnerDealershipReport({ setActivePage }: PartnerDealershipReportProps) {
  const { data: transfers, isLoading: transfersLoading } = useCarTransfers();
  const { data: dealerships, isLoading: dealershipsLoading } = usePartnerDealerships();
  const { data: settings } = useAppSettings();
  const { printReport } = usePrintReport();
  const { t, language } = useLanguage();

  const [selectedDealershipId, setSelectedDealershipId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(value);
  const formatDate2 = (date: string) => format(new Date(date), 'yyyy/MM/dd');
  const getStatusText = (status: string) => { if (status === 'pending') return t.rpt_trans_status_pending; if (status === 'sold') return t.rpt_trans_status_sold; if (status === 'returned') return t.rpt_trans_status_returned; return status; };
  const getTypeText = (type: string) => type === 'outgoing' ? t.rpt_trans_type_outgoing : t.rpt_trans_type_incoming;

  const selectedDealership = dealerships?.find(d => d.id === selectedDealershipId);

  const dealershipTransfers = useMemo(() => {
    if (!transfers || !selectedDealershipId) return [];
    return transfers.filter(transfer => {
      const matchesDealership = transfer.partner_dealership_id === selectedDealershipId;
      const transferDate = new Date(transfer.transfer_date);
      const matchesDateRange = (!startDate || transferDate >= new Date(startDate)) && (!endDate || transferDate <= new Date(endDate));
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      return matchesDealership && matchesDateRange && matchesStatus;
    });
  }, [transfers, selectedDealershipId, startDate, endDate, statusFilter]);

  const stats = useMemo(() => {
    const outgoing = dealershipTransfers.filter(tr => tr.transfer_type === 'outgoing');
    const incoming = dealershipTransfers.filter(tr => tr.transfer_type === 'incoming');
    const sold = dealershipTransfers.filter(tr => tr.status === 'sold');
    const commissionsOwed = incoming.filter(tr => tr.status === 'sold').reduce((sum, tr) => sum + (tr.actual_commission || tr.agreed_commission || 0), 0);
    const commissionsEarned = outgoing.filter(tr => tr.status === 'sold').reduce((sum, tr) => sum + (tr.actual_commission || tr.agreed_commission || 0), 0);
    const totalSalesValue = sold.reduce((sum, tr) => sum + (tr.sale_price || 0), 0);
    return { totalTransfers: dealershipTransfers.length, outgoingCount: outgoing.length, incomingCount: incoming.length, pendingCount: dealershipTransfers.filter(tr => tr.status === 'pending').length, soldCount: sold.length, returnedCount: dealershipTransfers.filter(tr => tr.status === 'returned').length, commissionsOwed, commissionsEarned, netCommission: commissionsEarned - commissionsOwed, totalSalesValue };
  }, [dealershipTransfers]);

  const handlePrint = () => {
    if (!selectedDealership) return;
    printReport({
      title: `${t.rpt_partner_title}: ${selectedDealership.name}`, subtitle: settings?.app_name || '',
      columns: [
        { header: t.rpt_trans_col_item, key: 'car' }, { header: t.rpt_trans_col_chassis, key: 'chassis' },
        { header: t.rpt_trans_col_type, key: 'type' }, { header: t.rpt_trans_col_date, key: 'date' },
        { header: t.rpt_partner_col_sale_price, key: 'salePrice' }, { header: t.rpt_trans_col_commission, key: 'commission' },
        { header: t.rpt_trans_col_status, key: 'status' },
      ],
      data: dealershipTransfers.map(tr => ({
        car: `${tr.car?.inventory_number} - ${tr.car?.name} ${tr.car?.model || ''}`, chassis: tr.car?.chassis_number || '',
        type: getTypeText(tr.transfer_type), date: formatDate2(tr.transfer_date),
        salePrice: tr.sale_price > 0 ? formatCurrency(tr.sale_price) : '-',
        commission: tr.actual_commission > 0 ? formatCurrency(tr.actual_commission) : tr.agreed_commission > 0 ? formatCurrency(tr.agreed_commission) : '-',
        status: getStatusText(tr.status),
      })),
      summaryCards: [
        { label: t.rpt_trans_total, value: stats.totalTransfers.toString() },
        { label: t.rpt_trans_outgoing, value: stats.outgoingCount.toString() },
        { label: t.rpt_trans_incoming, value: stats.incomingCount.toString() },
        { label: t.rpt_trans_sold_count, value: stats.soldCount.toString() },
        { label: t.rpt_partner_comm_earned, value: formatCurrency(stats.commissionsEarned) },
        { label: t.rpt_partner_comm_owed, value: formatCurrency(stats.commissionsOwed) },
      ],
    });
  };

  const isLoading = transfersLoading || dealershipsLoading;
  if (isLoading) return <div className="flex items-center justify-center h-64">{t.rpt_loading}</div>;

  return (
    <div className="space-y-6">
      <Card><CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl flex items-center gap-2"><Building2 className="w-6 h-6" />{t.rpt_partner_title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedDealershipId} onValueChange={setSelectedDealershipId}>
              <SelectTrigger className="w-56"><SelectValue placeholder={t.rpt_partner_select} /></SelectTrigger>
              <SelectContent>{dealerships?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedDealershipId && (<>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder={t.rpt_trans_col_status} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.rpt_trans_all}</SelectItem><SelectItem value="pending">{t.rpt_trans_status_pending}</SelectItem><SelectItem value="sold">{t.rpt_trans_status_sold}</SelectItem><SelectItem value="returned">{t.rpt_trans_status_returned}</SelectItem></SelectContent>
              </Select>
              <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
              <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print}</Button>
            </>)}
            <Button variant="outline" onClick={() => setActivePage('partner-dealerships')} className="gap-2"><ArrowRight className="w-4 h-4" />{t.rpt_partner_dealerships}</Button>
          </div>
        </div>
      </CardHeader></Card>

      {!selectedDealershipId ? (
        <Card className="p-12"><div className="text-center text-muted-foreground"><Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">{t.rpt_partner_select_prompt}</p></div></Card>
      ) : (<>
        {selectedDealership && (
          <Card><CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{selectedDealership.name}</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{selectedDealership.phone}</span></div>
                  {selectedDealership.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{selectedDealership.address}</span></div>}
                  {selectedDealership.contact_person && <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{selectedDealership.contact_person}</span></div>}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Card className="p-4 bg-blue-50 dark:bg-blue-950"><p className="text-sm text-muted-foreground">{t.rpt_partner_comm_earned}</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.commissionsEarned)}</p></Card>
                <Card className="p-4 bg-orange-50 dark:bg-orange-950"><p className="text-sm text-muted-foreground">{t.rpt_partner_comm_owed}</p><p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.commissionsOwed)}</p></Card>
                <Card className={`p-4 col-span-2 ${stats.netCommission >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <p className="text-sm text-muted-foreground">{t.rpt_partner_net_comm}</p>
                  <p className={`text-2xl font-bold ${stats.netCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(stats.netCommission)}<span className="text-sm font-normal mr-2">{stats.netCommission >= 0 ? t.rpt_partner_in_our_favor : t.rpt_partner_against_us}</span></p>
                </Card>
              </div>
            </div>
          </CardContent></Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_total}</p><p className="text-2xl font-bold">{stats.totalTransfers}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-red-500" /> {t.rpt_trans_outgoing}</p><p className="text-2xl font-bold">{stats.outgoingCount}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDownLeft className="w-4 h-4 text-blue-500" /> {t.rpt_trans_incoming}</p><p className="text-2xl font-bold">{stats.incomingCount}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_pending}</p><p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_sold_count}</p><p className="text-2xl font-bold text-green-600">{stats.soldCount}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_partner_total_sales}</p><p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalSalesValue)}</p></Card>
        </div>

        <Card><CardHeader><CardTitle>{t.rpt_partner_log}</CardTitle></CardHeader><CardContent>
          <div className="overflow-x-auto">
            <Table><TableHeader><TableRow>
              <TableHead className="text-right">{t.rpt_trans_col_item}</TableHead><TableHead className="text-right">{t.rpt_trans_col_chassis}</TableHead>
              <TableHead className="text-right">{t.rpt_trans_col_type}</TableHead><TableHead className="text-right">{t.rpt_trans_col_date}</TableHead>
              <TableHead className="text-right">{t.rpt_partner_col_sale_price}</TableHead><TableHead className="text-right">{t.rpt_partner_col_agreed_comm}</TableHead>
              <TableHead className="text-right">{t.rpt_partner_col_actual_comm}</TableHead><TableHead className="text-right">{t.rpt_trans_col_status}</TableHead>
            </TableRow></TableHeader><TableBody>
              {dealershipTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}</TableCell>
                  <TableCell>{transfer.car?.chassis_number}</TableCell>
                  <TableCell>{transfer.transfer_type === 'outgoing' ? <Badge variant="destructive" className="gap-1"><ArrowUpRight className="w-3 h-3" /> {t.rpt_trans_type_outgoing}</Badge> : <Badge className="gap-1 bg-blue-500"><ArrowDownLeft className="w-3 h-3" /> {t.rpt_trans_type_incoming}</Badge>}</TableCell>
                  <TableCell>{formatDate2(transfer.transfer_date)}</TableCell>
                  <TableCell>{transfer.sale_price > 0 ? formatCurrency(transfer.sale_price) : '-'}</TableCell>
                  <TableCell>{transfer.agreed_commission > 0 ? formatCurrency(transfer.agreed_commission) : transfer.commission_percentage > 0 ? `${transfer.commission_percentage}%` : '-'}</TableCell>
                  <TableCell>{transfer.actual_commission > 0 ? <span className="text-green-600 font-medium">{formatCurrency(transfer.actual_commission)}</span> : '-'}</TableCell>
                  <TableCell><Badge variant={transfer.status === 'sold' ? 'default' : transfer.status === 'returned' ? 'secondary' : 'outline'}>{getStatusText(transfer.status)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
            {dealershipTransfers.length === 0 && <div className="text-center py-8 text-muted-foreground">{t.rpt_partner_no_data}</div>}
          </div>
        </CardContent></Card>
      </>)}
    </div>
  );
}
