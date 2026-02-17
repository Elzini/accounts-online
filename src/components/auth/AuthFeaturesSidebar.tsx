import { CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';

const features = [
  { ar: 'المبيعات ونقاط البيع', en: 'Sales & POS' },
  { ar: 'الفاتورة الإلكترونية', en: 'E-Invoicing' },
  { ar: 'الحسابات العامة', en: 'General Accounting' },
  { ar: 'المخزون', en: 'Inventory' },
  { ar: 'إدارة العملاء', en: 'Customer Management' },
  { ar: 'الموارد البشرية', en: 'Human Resources' },
  { ar: 'الفروع', en: 'Branches' },
  { ar: 'التقارير المالية', en: 'Financial Reports' },
];

interface Props {
  isRtl: boolean;
}

export function AuthFeaturesSidebar({ isRtl }: Props) {
  const { settings, loading } = usePublicAuthSettings();

  return (
    <div className="hidden lg:flex flex-col items-center justify-center p-10 space-y-8">
      {/* Logo */}
      {!loading && (
        <img
          src={settings.login_logo_url || logo}
          alt="Logo"
          className="w-24 h-24 object-contain"
        />
      )}

      {/* Tagline */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-[hsl(215,40%,25%)]">
          {isRtl ? 'كل ما تحتاجه لإدارة أعمالك في برنامج واحد!' : 'Everything you need to manage your business in one app!'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRtl
            ? 'يدعم أكثر من 50 مجالاً مختلفاً وأكثر من 20 تطبيق لإدارة الأعمال باحترافية!'
            : 'Supports 50+ industries with 20+ professional business management modules!'}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRtl ? 'جميع هذه الميزات مخصصة حسب مجال عملك!' : 'All features customized for your industry!'}
      </p>

      {/* Feature list */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-[hsl(210,70%,50%)] shrink-0" />
            <span className="text-[hsl(215,40%,25%)] font-medium">{isRtl ? f.ar : f.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
