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
  borderColor: string;
  iconBg: string;
  iconColor: string;
  actions: { label: string; page: ActivePage }[];
}

const CARD_THEMES = {
  blue:    { borderColor: 'hsl(220 90% 56%)', iconBg: 'hsl(220 90% 56% / 0.12)', iconColor: 'hsl(220 90% 56%)' },
  purple:  { borderColor: 'hsl(270 75% 55%)', iconBg: 'hsl(270 75% 55% / 0.12)', iconColor: 'hsl(270 75% 55%)' },
  orange:  { borderColor: 'hsl(20 90% 52%)',  iconBg: 'hsl(20 90% 52% / 0.12)',  iconColor: 'hsl(20 90% 52%)' },
  green:   { borderColor: 'hsl(155 70% 42%)', iconBg: 'hsl(155 70% 42% / 0.12)', iconColor: 'hsl(155 70% 42%)' },
  rose:    { borderColor: 'hsl(340 75% 55%)', iconBg: 'hsl(340 75% 55% / 0.12)', iconColor: 'hsl(340 75% 55%)' },
  cyan:    { borderColor: 'hsl(190 85% 45%)', iconBg: 'hsl(190 85% 45% / 0.12)', iconColor: 'hsl(190 85% 45%)' },
};

function getQuickAccessCards(companyType: CompanyActivityType, labels: ReturnType<typeof useIndustryLabels>): QuickAccessCard[] {
  const baseCards: QuickAccessCard[] = [
    {
      id: 'customers',
      title: 'العملاء',
      icon: Users,
      ...CARD_THEMES.blue,
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
      ...CARD_THEMES.purple,
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
          ...CARD_THEMES.cyan,
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
          ...CARD_THEMES.orange,
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
          ...CARD_THEMES.cyan,
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
          ...CARD_THEMES.orange,
          actions: [
            { label: 'فاتورة واردات', page: 'add-purchase-invoice' },
            { label: 'الواردات', page: 'purchases' },
            { label: 'الموردين', page: 'suppliers' },
          ],
        },
      ];

    default:
      return [
        {
          id: 'sales',
          title: 'المبيعات',
          icon: ShoppingCart,
          ...CARD_THEMES.purple,
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
          ...CARD_THEMES.orange,
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
          ...CARD_THEMES.green,
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
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 p-3 sm:p-4 md:p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex items-center justify-end gap-3 sm:gap-4">
          <div className="text-right">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">الوصول السريع</h2>
            <p className="text-white/80 text-[10px] sm:text-sm">اختصارات للعمليات الشائعة</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
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
            className="group relative overflow-hidden bg-card hover:shadow-xl transition-all duration-300 rounded-xl border border-border/60"
          >
            {/* Colored Top Border */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: card.borderColor }}
            />

            {/* Card Header */}
            <div className="flex items-center justify-end gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <span className="font-bold text-sm sm:text-base text-foreground truncate">{card.title}</span>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: card.iconBg }}
              >
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.iconColor }} />
              </div>
            </div>

            {/* Actions List */}
            <div className="px-2 sm:px-3 pb-3 sm:pb-4 space-y-0.5">
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
