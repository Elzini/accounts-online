import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePartnerDealerships, useAddPartnerDealership, useUpdatePartnerDealership, useDeletePartnerDealership } from '@/hooks/useTransfers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import { PartnerDealership } from '@/services/transfers';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartnerDealershipsTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PartnerDealershipsTable({ setActivePage }: PartnerDealershipsTableProps) {
  const { data: dealerships, isLoading } = usePartnerDealerships();
  const addMutation = useAddPartnerDealership();
  const updateMutation = useUpdatePartnerDealership();
  const deleteMutation = useDeletePartnerDealership();
  const { permissions } = useAuth();
  const { t } = useLanguage();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDealership, setEditingDealership] = useState<PartnerDealership | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', contact_person: '', notes: '',
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', contact_person: '', notes: '' });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.phone) {
      toast.error(t.enter_name_phone);
      return;
    }
    try {
      await addMutation.mutateAsync({
        name: formData.name, phone: formData.phone,
        address: formData.address || null, contact_person: formData.contact_person || null, notes: formData.notes || null,
      });
      toast.success(t.dealership_added);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t.dealership_add_error);
    }
  };

  const handleUpdate = async () => {
    if (!editingDealership || !formData.name || !formData.phone) {
      toast.error(t.enter_name_phone);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingDealership.id,
        data: { name: formData.name, phone: formData.phone, address: formData.address || null, contact_person: formData.contact_person || null, notes: formData.notes || null },
      });
      toast.success(t.dealership_updated);
      setEditingDealership(null);
      resetForm();
    } catch (error) {
      toast.error(t.dealership_update_error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t.dealership_deleted);
    } catch (error) {
      toast.error(t.dealership_delete_error);
    }
  };

  const openEditDialog = (dealership: PartnerDealership) => {
    setEditingDealership(dealership);
    setFormData({
      name: dealership.name, phone: dealership.phone,
      address: dealership.address || '', contact_person: dealership.contact_person || '', notes: dealership.notes || '',
    });
  };

  const filteredDealerships = dealerships?.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone.includes(searchQuery) ||
    d.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">{t.loading}</div>;
  }

  const canEdit = permissions.admin || permissions.sales || permissions.purchases;

  const formFields = (
    <div className="space-y-4">
      <div><Label>{t.dealership_name} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
      <div><Label>{t.phone} *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
      <div><Label>{t.address}</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
      <div><Label>{t.contact_person}</Label><Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} /></div>
      <div><Label>{t.notes}</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl">{t.partner_dealerships_title}</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Input placeholder={`${t.search}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-64" />
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.add_dealership}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.add_new_dealership}</DialogTitle></DialogHeader>
                  {formFields}
                  <Button onClick={handleAdd} className="w-full">{t.add}</Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.dealership_name}</TableHead>
                <TableHead className="text-right">{t.phone}</TableHead>
                <TableHead className="text-right">{t.address}</TableHead>
                <TableHead className="text-right">{t.contact_person}</TableHead>
                <TableHead className="text-right">{t.notes}</TableHead>
                {canEdit && <TableHead className="text-right">{t.actions}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDealerships?.map((dealership) => (
                <TableRow key={dealership.id}>
                  <TableCell className="font-medium">{dealership.name}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Phone className="w-3 h-3" />{dealership.phone}</div></TableCell>
                  <TableCell>{dealership.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{dealership.address}</div>}</TableCell>
                  <TableCell>{dealership.contact_person && <div className="flex items-center gap-1"><User className="w-3 h-3" />{dealership.contact_person}</div>}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{dealership.notes}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={editingDealership?.id === dealership.id} onOpenChange={(open) => !open && setEditingDealership(null)}>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEditDialog(dealership)}><Edit className="w-4 h-4" /></Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{t.edit_dealership}</DialogTitle></DialogHeader>
                            {formFields}
                            <Button onClick={handleUpdate} className="w-full">{t.save_changes}</Button>
                          </DialogContent>
                        </Dialog>
                        {permissions.admin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle>
                                <AlertDialogDescription>{t.confirm_delete_desc}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(dealership.id)}>{t.delete}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!filteredDealerships || filteredDealerships.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">{t.no_dealerships}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}