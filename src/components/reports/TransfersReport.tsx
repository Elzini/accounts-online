import { useState, useMemo } from 'react';
import { Printer, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useAppSettings } from '@/hooks/useSettings';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export function TransfersReport() {
  const { data: transfers, isLoading } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: settings } = useAppSettings();
  const { printReport } = usePrintReport();
  const { t, language } = useLanguage();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dealershipFilter, setDealershipFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(value);
  const formatDate2 = (date: string) => format(new Date(date), 'yyyy/MM/dd');

  const getStatusText = (status: string) => {
    if (status === 'pending') return t.rpt_trans_status_pending;
    if (status === 'sold') return t.rpt_trans_status_sold;
    if (status === 'returned') return t.rpt_trans_status_returned;
    return status;
  };
  const getTypeText = (type: string) => type === 'outgoing' ? t.rpt_trans_type_outgoing : t.rpt_trans_type_incoming;

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    return transfers.filter(transfer => {
      const transferDate = new Date(transfer.transfer_date);
      const matchesDateRange = (!startDate || transferDate >= new Date(startDate)) && (!endDate || transferDate <= new Date(endDate));
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const matchesType = typeFilter === 'all' || transfer.transfer_type === typeFilter;
      const matchesDealership = dealershipFilter === 'all' || transfer.partner_dealership_id === dealershipFilter;
      const matchesSearch = transfer.car?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || transfer.car?.chassis_number?.includes(searchQuery) || transfer.partner_dealership?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDateRange && matchesStatus && matchesType && matchesDealership && matchesSearch;
    });
  }, [transfers, startDate, endDate, statusFilter, typeFilter, dealershipFilter, searchQuery]);

  const outgoingTransfers = filteredTransfers.filter(t2 => t2.transfer_type === 'outgoing');
  const incomingTransfers = filteredTransfers.filter(t2 => t2.transfer_type === 'incoming');
  const pendingTransfers = filteredTransfers.filter(t2 => t2.status === 'pending');
  const soldTransfers = filteredTransfers.filter(t2 => t2.status === 'sold');
  const totalCommission = filteredTransfers.reduce((sum, t2) => sum + (t2.actual_commission || t2.agreed_commission || 0), 0);

  const handlePrint = () => {
    printReport({
      title: t.rpt_trans_title, subtitle: settings?.app_name || '',
      columns: [
        { header: t.rpt_trans_col_item, key: 'car' }, { header: t.rpt_trans_col_chassis, key: 'chassis' },
        { header: t.rpt_trans_col_dealership, key: 'dealership' }, { header: t.rpt_trans_col_type, key: 'type' },
        { header: t.rpt_trans_col_date, key: 'date' }, { header: t.rpt_trans_col_commission, key: 'commission' },
        { header: t.rpt_trans_col_status, key: 'status' },
      ],
      data: filteredTransfers.map(tr => ({
        car: `${tr.car?.inventory_number} - ${tr.car?.name} ${tr.car?.model || ''}`,
        chassis: tr.car?.chassis_number || '', dealership: tr.partner_dealership?.name || '',
        type: getTypeText(tr.transfer_type), date: formatDate2(tr.transfer_date),
        commission: tr.agreed_commission > 0 ? formatCurrency(tr.agreed_commission) : '-',
        status: getStatusText(tr.status),
      })),
      summaryCards: [
        { label: t.rpt_trans_total, value: filteredTransfers.length.toString() },
        { label: t.rpt_trans_outgoing, value: outgoingTransfers.length.toString() },
        { label: t.rpt_trans_incoming, value: incomingTransfers.length.toString() },
        { label: t.rpt_trans_pending, value: pendingTransfers.length.toString() },
        { label: t.rpt_trans_sold_count, value: soldTransfers.length.toString() },
        { label: t.rpt_trans_total_comm, value: formatCurrency(totalCommission) },
      ],
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64">{t.rpt_loading}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl">{t.rpt_trans_title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input placeholder={t.rpt_trans_search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48" />
              <Select value={dealershipFilter} onValueChange={setDealershipFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder={t.rpt_trans_col_dealership} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.rpt_trans_all_dealerships}</SelectItem>{dealerships?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder={t.rpt_trans_col_type} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.rpt_trans_all}</SelectItem><SelectItem value="outgoing">{t.rpt_trans_type_outgoing}</SelectItem><SelectItem value="incoming">{t.rpt_trans_type_incoming}</SelectItem></SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder={t.rpt_trans_col_status} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.rpt_trans_all}</SelectItem><SelectItem value="pending">{t.rpt_trans_status_pending}</SelectItem><SelectItem value="sold">{t.rpt_trans_status_sold}</SelectItem><SelectItem value="returned">{t.rpt_trans_status_returned}</SelectItem></SelectContent>
              </Select>
              <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
              <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_total}</p><p className="text-2xl font-bold">{filteredTransfers.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-red-500" /> {t.rpt_trans_outgoing}</p><p className="text-2xl font-bold">{outgoingTransfers.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><ArrowDownLeft className="w-4 h-4 text-blue-500" /> {t.rpt_trans_incoming}</p><p className="text-2xl font-bold">{incomingTransfers.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_pending}</p><p className="text-2xl font-bold text-yellow-600">{pendingTransfers.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_sold_count}</p><p className="text-2xl font-bold text-green-600">{soldTransfers.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t.rpt_trans_total_comm}</p><p className="text-2xl font-bold text-primary">{formatCurrency(totalCommission)}</p></Card>
          </div>

          <div className="overflow-x-auto">
            <Table><TableHeader><TableRow>
              <TableHead className="text-right">{t.rpt_trans_col_item}</TableHead><TableHead className="text-right">{t.rpt_trans_col_chassis}</TableHead>
              <TableHead className="text-right">{t.rpt_trans_col_dealership}</TableHead><TableHead className="text-right">{t.rpt_trans_col_type}</TableHead>
              <TableHead className="text-right">{t.rpt_trans_col_date}</TableHead><TableHead className="text-right">{t.rpt_trans_col_return_date}</TableHead>
              <TableHead className="text-right">{t.rpt_trans_col_commission}</TableHead><TableHead className="text-right">{t.rpt_trans_col_status}</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}</TableCell>
                  <TableCell>{transfer.car?.chassis_number}</TableCell>
                  <TableCell>{transfer.partner_dealership?.name}</TableCell>
                  <TableCell>{transfer.transfer_type === 'outgoing' ? <Badge variant="destructive" className="gap-1"><ArrowUpRight className="w-3 h-3" /> {t.rpt_trans_type_outgoing}</Badge> : <Badge className="gap-1 bg-blue-500"><ArrowDownLeft className="w-3 h-3" /> {t.rpt_trans_type_incoming}</Badge>}</TableCell>
                  <TableCell>{formatDate2(transfer.transfer_date)}</TableCell>
                  <TableCell>{transfer.return_date ? formatDate2(transfer.return_date) : '-'}</TableCell>
                  <TableCell>{transfer.agreed_commission > 0 ? formatCurrency(transfer.agreed_commission) : transfer.commission_percentage > 0 ? `${transfer.commission_percentage}%` : '-'}</TableCell>
                  <TableCell><Badge variant={transfer.status === 'sold' ? 'default' : transfer.status === 'returned' ? 'secondary' : 'outline'}>{getStatusText(transfer.status)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
            {filteredTransfers.length === 0 && <div className="text-center py-8 text-muted-foreground">{t.rpt_trans_no_data}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
