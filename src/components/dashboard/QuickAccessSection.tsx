import { ShoppingCart, Users, Package, Wallet, Boxes, FileText, CreditCard, UserPlus, Truck, ArrowLeftRight, FileCheck, TrendingUp, LucideIcon, HardHat, Building2, Ship } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ActivePage } from '@/types';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKeys } from '@/i18n/types';

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

function getQuickAccessCards(companyType: CompanyActivityType, labels: ReturnType<typeof useIndustryLabels>, t: TranslationKeys): QuickAccessCard[] {
  const baseCards: QuickAccessCard[] = [
    {
      id: 'customers',
      title: t.nav_customers,
      icon: Users,
      ...CARD_THEMES.blue,
      actions: [
        { label: t.add_customer, page: 'add-customer' },
        { label: t.customer_list, page: 'customers' },
        { label: t.nav_installments, page: 'installments' },
      ],
    },
    {
      id: 'treasury',
      title: t.treasury,
      icon: Wallet,
      ...CARD_THEMES.purple,
      actions: [
        { label: t.receipts, page: 'vouchers' },
        { label: t.banks, page: 'banking' },
        { label: t.nav_expenses, page: 'expenses' },
      ],
    },
  ];

  switch (companyType) {
    case 'construction':
      return [
        {
          id: 'projects',
          title: t.projects_label,
          icon: HardHat,
          ...CARD_THEMES.cyan,
          actions: [
            { label: t.projects_label, page: 'projects' },
            { label: t.contracts_label, page: 'contracts' },
            { label: t.billings_label, page: 'progress-billings' },
          ],
        },
        ...baseCards,
        {
          id: 'suppliers',
          title: t.nav_suppliers,
          icon: Truck,
          ...CARD_THEMES.orange,
          actions: [
            { label: t.add_supplier, page: 'add-supplier' },
            { label: t.supplier_list, page: 'suppliers' },
          ],
        },
      ];

    case 'export_import':
      return [
        {
          id: 'shipments',
          title: t.shipments_label,
          icon: Ship,
          ...CARD_THEMES.cyan,
          actions: [
            { label: t.shipments_label, page: 'shipments' },
            { label: t.lc_label, page: 'letters-of-credit' },
            { label: t.customs_label, page: 'customs-clearance' },
          ],
        },
        ...baseCards,
        {
          id: 'purchases',
          title: t.imports_label,
          icon: Truck,
          ...CARD_THEMES.orange,
          actions: [
            { label: t.import_invoice, page: 'add-purchase-invoice' },
            { label: t.imports_label, page: 'purchases' },
            { label: t.suppliers_label, page: 'suppliers' },
          ],
        },
      ];

    default:
      return [
        {
          id: 'sales',
          title: t.nav_sales,
          icon: ShoppingCart,
          ...CARD_THEMES.purple,
          actions: [
            { label: t.new_sale_invoice, page: 'add-sale-invoice' },
            { label: t.nav_sales, page: 'sales' },
          ],
        },
        ...baseCards,
        {
          id: 'purchases',
          title: t.nav_purchases,
          icon: Truck,
          ...CARD_THEMES.orange,
          actions: [
            { label: t.purchase_invoice, page: 'add-purchase-invoice' },
            { label: t.nav_purchases, page: 'purchases' },
            { label: t.suppliers_label, page: 'suppliers' },
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
  const { t } = useLanguage();
  const quickAccessCards = getQuickAccessCards(companyType, labels, t);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 p-3 sm:p-4 md:p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex items-center justify-end gap-3 sm:gap-4">
          <div className="text-right">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">{t.quick_access}</h2>
            <p className="text-white/80 text-[10px] sm:text-sm">{t.quick_access_subtitle}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-3 sm:gap-4",
        quickAccessCards.length <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      )}>
        {quickAccessCards.map((card) => (
          <Card key={card.id} className="group relative overflow-hidden bg-card hover:shadow-xl transition-all duration-300 rounded-xl border border-border/60">
            <div className="h-1 w-full" style={{ backgroundColor: card.borderColor }} />
            <div className="flex items-center justify-end gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <span className="font-bold text-sm sm:text-base text-foreground truncate">{card.title}</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: card.iconBg }}>
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.iconColor }} />
              </div>
            </div>
            <div className="px-2 sm:px-3 pb-3 sm:pb-4 space-y-0.5">
              {card.actions.map((action, index) => (
                <button key={index} onClick={() => setActivePage(action.page)} className="w-full text-right px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200">
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
