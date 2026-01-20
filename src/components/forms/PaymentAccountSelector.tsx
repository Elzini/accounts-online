import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Building2, CreditCard, Users } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounting';

interface PaymentAccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  type?: 'payment' | 'receipt'; // payment = دفع (مشتريات), receipt = استلام (مبيعات)
}

export function PaymentAccountSelector({ 
  value, 
  onChange, 
  label = 'طريقة الدفع',
  type = 'payment'
}: PaymentAccountSelectorProps) {
  const { data: accounts = [] } = useAccounts();
  
  // Filter accounts that can be used for payment/receipt
  // Cash accounts (11xx), Bank accounts, Partner accounts (31xx)
  const paymentAccounts = accounts.filter(account => {
    const code = account.code;
    // الصندوق والنقدية (11xx)
    if (code.startsWith('110')) return true;
    // البنك (1102, 1103)
    if (code === '1102' || code === '1103') return true;
    // جاري الشريك (3102)
    if (code === '3102') return true;
    // العملاء للمبيعات الآجلة (1201)
    if (type === 'receipt' && code === '1201') return true;
    // الموردون للمشتريات الآجلة (2101)
    if (type === 'payment' && code === '2101') return true;
    return false;
  });

  const getAccountIcon = (code: string) => {
    if (code === '1101') return <Wallet className="w-4 h-4" />;
    if (code === '1102' || code === '1103') return <Building2 className="w-4 h-4" />;
    if (code === '3102') return <Users className="w-4 h-4" />;
    if (code === '1201' || code === '2101') return <CreditCard className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  const getAccountLabel = (account: typeof accounts[0]) => {
    // Custom labels for better UX
    switch (account.code) {
      case '1101': return 'نقداً - الصندوق';
      case '1102': return 'تحويل بنكي';
      case '1103': return 'نقاط البيع (مدى)';
      case '3102': return 'جاري الشريك';
      case '1201': return 'آجل - على العميل';
      case '2101': return 'آجل - على المورد';
      default: return account.name;
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder="اختر طريقة الدفع" />
        </SelectTrigger>
        <SelectContent>
          {paymentAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2">
                {getAccountIcon(account.code)}
                <span>{getAccountLabel(account)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
