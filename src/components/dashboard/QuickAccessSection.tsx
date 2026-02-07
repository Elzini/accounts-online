import { ShoppingCart, Users, Package, Wallet, Boxes, FileText, CreditCard, UserPlus, Truck, ArrowLeftRight, FileCheck, TrendingUp, LucideIcon, HardHat, Building2, Ship } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ActivePage } from '@/types';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';

interface QuickAccessCard {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: string;
  actions: { label: string; page: ActivePage }[];
}

function getQuickAccessCards(companyType: CompanyActivityType, labels: ReturnType<typeof useIndustryLabels>): QuickAccessCard[] {
  const baseCards: QuickAccessCard[] = [
    {
      id: 'customers',
      title: 'العملاء',
      icon: Users,
      gradient: 'from-blue-500 via-blue-400 to-cyan-400',
      actions: [
        { label: 'إضافة عميل', page: 'add-customer' },
        { label: 'قائمة العملاء', page: 'customers' },
        { label: 'الأقساط', page: 'installments' },
      ],
    },
    {
      id: 'treasury',
      title: 'الخزينة',
      icon: Wallet,
      gradient: 'from-emerald-500 via-emerald-400 to-teal-400',
      actions: [
        { label: 'السندات', page: 'vouchers' },
        { label: 'البنوك', page: 'banking' },
        { label: 'المصروفات', page: 'expenses' },
      ],
    },
  ];

  switch (companyType) {
    case 'construction':
      return [
        {
          id: 'projects',
          title: 'المشاريع',
          icon: HardHat,
          gradient: 'from-primary via-primary/90 to-primary/70',
          actions: [
            { label: 'المشاريع', page: 'projects' },
            { label: 'العقود', page: 'contracts' },
            { label: 'المستخلصات', page: 'progress-billings' },
          ],
        },
        ...baseCards,
        {
          id: 'suppliers',
          title: 'الموردين',
          icon: Truck,
          gradient: 'from-orange-500 via-orange-400 to-amber-400',
          actions: [
            { label: 'إضافة مورد', page: 'add-supplier' },
            { label: 'قائمة الموردين', page: 'suppliers' },
          ],
        },
      ];

    case 'export_import':
      return [
        {
          id: 'shipments',
          title: 'الشحنات',
          icon: Ship,
          gradient: 'from-primary via-primary/90 to-primary/70',
          actions: [
            { label: 'الشحنات', page: 'shipments' },
            { label: 'خطابات الاعتماد', page: 'letters-of-credit' },
            { label: 'التخليص الجمركي', page: 'customs-clearance' },
          ],
        },
        ...baseCards,
        {
          id: 'purchases',
          title: 'الواردات',
          icon: Truck,
          gradient: 'from-orange-500 via-orange-400 to-amber-400',
          actions: [
            { label: 'فاتورة واردات', page: 'add-purchase-invoice' },
            { label: 'الواردات', page: 'purchases' },
            { label: 'الموردين', page: 'suppliers' },
          ],
        },
      ];

    default: // car_dealership, general_trading, restaurant
      return [
        {
          id: 'sales',
          title: 'المبيعات',
          icon: ShoppingCart,
          gradient: 'from-primary via-primary/90 to-primary/70',
          actions: [
            { label: 'فاتورة بيع جديدة', page: 'add-sale-invoice' },
            { label: 'المبيعات', page: 'sales' },
          ],
        },
        ...baseCards,
        {
          id: 'purchases',
          title: 'المشتريات',
          icon: Truck,
          gradient: 'from-orange-500 via-orange-400 to-amber-400',
          actions: [
            { label: 'فاتورة شراء', page: 'add-purchase-invoice' },
            { label: 'المشتريات', page: 'purchases' },
            { label: 'الموردين', page: 'suppliers' },
          ],
        },
        ...(companyType === 'car_dealership' ? [{
          id: 'inventory',
          title: labels.inventoryLabel,
          icon: Package as LucideIcon,
          gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
          actions: labels.inventoryActions.map(a => ({ label: a.label, page: a.page as ActivePage })),
        }] : []),
      ];
  }
}

interface QuickAccessSectionProps {
  setActivePage: (page: ActivePage) => void;
}

export function QuickAccessSection({ setActivePage }: QuickAccessSectionProps) {
  const { company } = useCompany();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const labels = useIndustryLabels();
  const quickAccessCards = getQuickAccessCards(companyType, labels);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 p-4 sm:p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex items-center justify-end gap-4">
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-bold text-white">الوصول السريع</h2>
            <p className="text-white/80 text-sm">اختصارات للعمليات الشائعة</p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Access Cards Grid */}
      <div className={cn(
        "grid gap-3 sm:gap-4",
        quickAccessCards.length <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      )}>
        {quickAccessCards.map((card) => (
          <Card
            key={card.id}
            className="group relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
          >
            {/* Gradient Header */}
            <div className={cn(
              "relative h-14 sm:h-16 bg-gradient-to-l",
              card.gradient
            )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-end px-3 sm:px-4 gap-2 sm:gap-3">
                <span className="text-white font-bold text-sm sm:text-base">{card.title}</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Actions List */}
            <div className="p-2 sm:p-3 space-y-1">
              {card.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setActivePage(action.page)}
                  className="w-full text-right px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
