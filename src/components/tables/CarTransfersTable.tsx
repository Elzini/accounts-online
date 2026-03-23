/**
 * Car Transfers Table - Slim Orchestrator
 * Logic in hooks/useCarTransfers. 
 */
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ActivePage } from '@/types';
import { useCarTransfersLogic } from './hooks/useCarTransfers';

interface CarTransfersTableProps { setActivePage: (page: ActivePage) => void; }

export function CarTransfersTable({ setActivePage }: CarTransfersTableProps) {
  const h = useCarTransfersLogic();
  const { t, isLoading, filteredTransfers, dealerships, cars, availableCars, canEdit, permissions,
    isAddDialogOpen, setIsAddDialogOpen, isIncomingDialogOpen, setIsIncomingDialogOpen,
    isEditIncomingDialogOpen, setIsEditIncomingDialogOpen, editingTransfer, setEditingTransfer,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter,
    formData, setFormData, incomingCarData, setIncomingCarData,
    handleAdd, handleAddIncomingCar, handleUpdate, handleUpdateIncomingCar,
    openEditIncomingDialog, handleQuickReturn, handleDelete, openEditDialog,
    resetIncomingForm } = h;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> {t.pending_status}</Badge>;
      case 'sold': return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> {t.sold_status}</Badge>;
      case 'returned': return <Badge variant="secondary" className="gap-1"><RotateCcw className="w-3 h-3" /> {t.returned_status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => type === 'outgoing'
    ? <Badge variant="destructive" className="gap-1"><ArrowUpRight className="w-3 h-3" /> {t.outgoing_badge}</Badge>
    : <Badge className="gap-1 bg-blue-500"><ArrowDownLeft className="w-3 h-3" /> {t.incoming_badge}</Badge>;

  const formatCurrency = (v: number) => String(Math.round(v));
  const formatDate = (d: string) => format(new Date(d), 'yyyy/MM/dd');

  if (isLoading) return <div className="flex items-center justify-center h-64">{t.loading}</div>;

  const formFieldsJSX = (
    <div className="space-y-4">
      <div><Label>{t.select_car} *</Label><Select value={formData.car_id} onValueChange={(v) => setFormData({ ...formData, car_id: v })}><SelectTrigger><SelectValue placeholder={t.select_car} /></SelectTrigger><SelectContent>{(editingTransfer ? cars : availableCars)?.map(car => <SelectItem key={car.id} value={car.id}>{car.inventory_number} - {car.name} {car.model} ({car.chassis_number})</SelectItem>)}</SelectContent></Select></div>
      <div><Label>{t.partner_dealership} *</Label><Select value={formData.partner_dealership_id} onValueChange={(v) => setFormData({ ...formData, partner_dealership_id: v })}><SelectTrigger><SelectValue placeholder={t.select_dealership} /></SelectTrigger><SelectContent>{dealerships?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>{t.transfer_type}</Label><Select value={formData.transfer_type} onValueChange={(v: any) => setFormData({ ...formData, transfer_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="outgoing">{t.outgoing_we_send}</SelectItem><SelectItem value="incoming">{t.incoming_we_receive}</SelectItem></SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.transfer_date}</Label><Input type="date" value={formData.transfer_date} onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })} /></div><div><Label>{t.return_date}</Label><Input type="date" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.agreed_commission}</Label><Input type="number" value={formData.agreed_commission} onChange={(e) => setFormData({ ...formData, agreed_commission: Number(e.target.value) })} /></div><div><Label>{t.commission_percent} (%)</Label><Input type="number" value={formData.commission_percentage} onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })} /></div></div>
      <div><Label>{t.status}</Label><Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">{t.pending_status}</SelectItem><SelectItem value="sold">{t.sold_status}</SelectItem><SelectItem value="returned">{t.returned_status}</SelectItem></SelectContent></Select></div>
      <div><Label>{t.notes}</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
    </div>
  );

  const incomingCarFormFieldsJSX = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.car_name_label} *</Label><Input value={incomingCarData.name} onChange={(e) => setIncomingCarData({ ...incomingCarData, name: e.target.value })} placeholder={t.form_example_car} /></div><div><Label>{t.form_model}</Label><Input value={incomingCarData.model} onChange={(e) => setIncomingCarData({ ...incomingCarData, model: e.target.value })} placeholder={t.form_example_year} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.th_chassis_number} *</Label><Input value={incomingCarData.chassis_number} onChange={(e) => setIncomingCarData({ ...incomingCarData, chassis_number: e.target.value })} placeholder={t.form_enter_chassis} /></div><div><Label>{t.form_color}</Label><Input value={incomingCarData.color} onChange={(e) => setIncomingCarData({ ...incomingCarData, color: e.target.value })} placeholder={t.form_enter_color} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.form_purchase_price}</Label><Input type="number" value={incomingCarData.purchase_price} onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_price: Number(e.target.value) })} /></div><div><Label>{t.form_purchase_date}</Label><Input type="date" value={incomingCarData.purchase_date} onChange={(e) => setIncomingCarData({ ...incomingCarData, purchase_date: e.target.value })} /></div></div>
      <div><Label>{t.partner_dealership} *</Label><Select value={incomingCarData.partner_dealership_id} onValueChange={(v) => setIncomingCarData({ ...incomingCarData, partner_dealership_id: v })}><SelectTrigger><SelectValue placeholder={t.select_dealership} /></SelectTrigger><SelectContent>{dealerships?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4"><div><Label>{t.transfer_date}</Label><Input type="date" value={incomingCarData.transfer_date} onChange={(e) => setIncomingCarData({ ...incomingCarData, transfer_date: e.target.value })} /></div><div><Label>{t.agreed_commission}</Label><Input type="number" value={incomingCarData.agreed_commission} onChange={(e) => setIncomingCarData({ ...incomingCarData, agreed_commission: Number(e.target.value) })} /></div></div>
      <div><Label>{t.commission_percent} (%)</Label><Input type="number" value={incomingCarData.commission_percentage} onChange={(e) => setIncomingCarData({ ...incomingCarData, commission_percentage: Number(e.target.value) })} /></div>
      <div><Label>{t.notes}</Label><Textarea value={incomingCarData.notes} onChange={(e) => setIncomingCarData({ ...incomingCarData, notes: e.target.value })} /></div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl">{t.car_transfers_title}</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Input placeholder={t.search + '...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-48" />
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-full md:w-32"><SelectValue placeholder={t.transfer_type} /></SelectTrigger><SelectContent><SelectItem value="all">{t.all}</SelectItem><SelectItem value="outgoing">{t.outgoing_badge}</SelectItem><SelectItem value="incoming">{t.incoming_badge}</SelectItem></SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-32"><SelectValue placeholder={t.status} /></SelectTrigger><SelectContent><SelectItem value="all">{t.all}</SelectItem><SelectItem value="pending">{t.pending_status}</SelectItem><SelectItem value="sold">{t.sold_status}</SelectItem><SelectItem value="returned">{t.returned_status}</SelectItem></SelectContent></Select>
            {canEdit && (<>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button variant="outline" className="gap-2"><ArrowUpRight className="w-4 h-4" />{t.outgoing_transfer}</Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.add_transfer}</DialogTitle></DialogHeader>{formFieldsJSX}<Button onClick={handleAdd} className="w-full mt-4">{t.add}</Button></DialogContent></Dialog>
              <Dialog open={isIncomingDialogOpen} onOpenChange={setIsIncomingDialogOpen}><DialogTrigger asChild><Button className="gap-2"><ArrowDownLeft className="w-4 h-4" />{t.incoming_car}</Button></DialogTrigger><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{t.incoming_car}</DialogTitle></DialogHeader>{incomingCarFormFieldsJSX}<Button onClick={handleAddIncomingCar} className="w-full mt-4">{t.add}</Button></DialogContent></Dialog>
            </>)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">{t.th_car}</TableHead><TableHead className="text-right">{t.th_chassis_number}</TableHead><TableHead className="text-right">{t.partner_dealership}</TableHead><TableHead className="text-right">{t.transfer_type}</TableHead><TableHead className="text-right">{t.transfer_date}</TableHead><TableHead className="text-right">{t.agreed_commission}</TableHead><TableHead className="text-right">{t.status}</TableHead>{canEdit && <TableHead className="text-right">{t.actions}</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
              {filteredTransfers?.map(transfer => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.car?.inventory_number} - {transfer.car?.name} {transfer.car?.model}</TableCell>
                  <TableCell>{transfer.car?.chassis_number}</TableCell>
                  <TableCell>{transfer.partner_dealership?.name}</TableCell>
                  <TableCell>{getTypeBadge(transfer.transfer_type)}</TableCell>
                  <TableCell>{formatDate(transfer.transfer_date)}</TableCell>
                  <TableCell>{transfer.agreed_commission > 0 ? formatCurrency(transfer.agreed_commission) : transfer.commission_percentage > 0 ? `${transfer.commission_percentage}%` : '-'}</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  {canEdit && (<TableCell><div className="flex gap-2">
                    {transfer.status === 'pending' && (<AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="icon" className="text-orange-600 hover:text-orange-700" title={t.return_label}><RotateCcw className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t.return_label}</AlertDialogTitle><AlertDialogDescription>{transfer.car?.name} {transfer.car?.model} - {transfer.partner_dealership?.name}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => handleQuickReturn(transfer)}>{t.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
                    {transfer.transfer_type === 'incoming' ? (
                      <Button variant="ghost" size="icon" onClick={() => openEditIncomingDialog(transfer)} title={t.edit}><Edit className="w-4 h-4" /></Button>
                    ) : (
                      <Dialog open={editingTransfer?.id === transfer.id && !isEditIncomingDialogOpen} onOpenChange={(open) => !open && setEditingTransfer(null)}><DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEditDialog(transfer)}><Edit className="w-4 h-4" /></Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t.edit_transfer}</DialogTitle></DialogHeader>{formFieldsJSX}<Button onClick={handleUpdate} className="w-full mt-4">{t.save_changes}</Button></DialogContent></Dialog>
                    )}
                    {permissions.admin && (<AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle><AlertDialogDescription>{t.confirm_delete_desc}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(transfer.id)}>{t.delete}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
                  </div></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!filteredTransfers || filteredTransfers.length === 0) && <div className="text-center py-8 text-muted-foreground">{t.no_data}</div>}
        </div>
        <Dialog open={isEditIncomingDialogOpen} onOpenChange={(open) => { setIsEditIncomingDialogOpen(open); if (!open) { setEditingTransfer(null); resetIncomingForm(); } }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{t.edit_transfer}</DialogTitle></DialogHeader>{incomingCarFormFieldsJSX}<Button onClick={handleUpdateIncomingCar} className="w-full mt-4">{t.save_changes}</Button></DialogContent></Dialog>
      </CardContent>
    </Card>
  );
}
