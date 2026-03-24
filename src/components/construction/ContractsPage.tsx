import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConstructionContracts, useProjectsList, useCreateConstructionContract, useUpdateConstructionContract, useDeleteConstructionContract } from '@/hooks/modules/useBusinessServices';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ContractFormDialog } from './contracts/ContractFormDialog';

const typeLabels: Record<string, string> = { main: 'عقد رئيسي', subcontract: 'عقد باطن', supply: 'عقد توريد', service: 'عقد خدمات' };
const statusLabels: Record<string, string> = { draft: 'مسودة', active: 'نشط', suspended: 'موقوف', completed: 'مكتمل', terminated: 'منتهي' };
const statusColors: Record<string, string> = { draft: 'bg-gray-500', active: 'bg-green-500', suspended: 'bg-yellow-500', completed: 'bg-blue-500', terminated: 'bg-red-500' };

const defaultFormData = {
  project_id: '', contract_type: 'main', title: '', description: '', contractor_name: '', contractor_phone: '',
  contractor_address: '', contract_value: '', advance_payment: '', advance_percentage: '', retention_percentage: '10',
  start_date: '', end_date: '', status: 'draft', payment_terms: '', notes: '',
};

export function ContractsPage() {
  const { companyId } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [formData, setFormData] = useState({ ...defaultFormData });

  const { data: contracts = [], isLoading } = useConstructionContracts(companyId);
  const { data: projects = [] } = useProjectsList(companyId);

  const createContractBase = useCreateConstructionContract(companyId);
  const updateContractBase = useUpdateConstructionContract();
  const deleteContractBase = useDeleteConstructionContract();

  const handleCloseDialog = () => { setDialogOpen(false); setEditingContract(null); setFormData({ ...defaultFormData }); };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setFormData({
      project_id: contract.project_id || '', contract_type: contract.contract_type, title: contract.title,
      description: contract.description || '', contractor_name: contract.contractor_name || '',
      contractor_phone: contract.contractor_phone || '', contractor_address: contract.contractor_address || '',
      contract_value: contract.contract_value?.toString() || '', advance_payment: contract.advance_payment?.toString() || '',
      advance_percentage: contract.advance_percentage?.toString() || '', retention_percentage: contract.retention_percentage?.toString() || '10',
      start_date: contract.start_date || '', end_date: contract.end_date || '', status: contract.status,
      payment_terms: contract.payment_terms || '', notes: contract.notes || '',
    });
    setDialogOpen(true);
  };

  const parseFormToPayload = (data: typeof formData) => ({
    project_id: data.project_id || null, contract_type: data.contract_type, title: data.title, description: data.description || null,
    contractor_name: data.contractor_name || null, contractor_phone: data.contractor_phone || null, contractor_address: data.contractor_address || null,
    contract_value: parseFloat(data.contract_value) || 0, advance_payment: parseFloat(data.advance_payment) || 0,
    advance_percentage: parseFloat(data.advance_percentage) || 0, retention_percentage: parseFloat(data.retention_percentage) || 10,
    start_date: data.start_date || null, end_date: data.end_date || null, status: data.status,
    payment_terms: data.payment_terms || null, notes: data.notes || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContract) {
      updateContractBase.mutate({ id: editingContract.id, ...parseFormToPayload(formData) }, {
        onSuccess: () => { toast.success('تم تحديث العقد بنجاح'); handleCloseDialog(); },
        onError: () => toast.error('حدث خطأ أثناء تحديث العقد'),
      });
    } else {
      createContractBase.mutate(parseFormToPayload(formData), {
        onSuccess: () => { toast.success('تم إنشاء العقد بنجاح'); handleCloseDialog(); },
        onError: () => toast.error('حدث خطأ أثناء إنشاء العقد'),
      });
    }
  };

  const filteredContracts = contracts.filter((c: any) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.contractor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />إدارة العقود</h1>
          <p className="text-muted-foreground">إدارة العقود مع المقاولين والموردين</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 ml-2" />عقد جديد</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="البحث عن عقد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-8">جاري التحميل...</div> : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد عقود</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead><TableHead>عنوان العقد</TableHead><TableHead>نوع العقد</TableHead>
                  <TableHead>المشروع</TableHead><TableHead>المقاول</TableHead><TableHead>قيمة العقد</TableHead>
                  <TableHead>الحالة</TableHead><TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">#{contract.contract_number}</TableCell>
                    <TableCell>{contract.title}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabels[contract.contract_type] || contract.contract_type}</Badge></TableCell>
                    <TableCell>{contract.project?.project_name || '-'}</TableCell>
                    <TableCell>{contract.contractor_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(contract.contract_value)}</TableCell>
                    <TableCell><Badge className={statusColors[contract.status]}>{statusLabels[contract.status] || contract.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('هل أنت متأكد من حذف هذا العقد؟')) deleteContractBase.mutate(contract.id, { onSuccess: () => toast.success('تم حذف العقد'), onError: () => toast.error('حدث خطأ') }); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContractFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={!!editingContract}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
        projects={projects}
        isPending={createContractBase.isPending || updateContractBase.isPending}
      />
    </div>
  );
}
