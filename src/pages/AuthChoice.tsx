import { Link } from 'react-router-dom';
import { Shield, Menu, Globe, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import { usePublicAuthSettings } from '@/hooks/usePublicAuthSettings';
import { isAdminSubdomain, getAdminUrl, getBaseDomain } from '@/lib/tenantResolver';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function AuthChoice() {
  const { settings, loading: logoLoading } = usePublicAuthSettings();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const onAdminSubdomain = isAdminSubdomain();
  const baseDomain = getBaseDomain();

  // Admin subdomain layout (unchanged)
  if (onAdminSubdomain) {
    return (
      <div className="min-h-screen bg-[hsl(210,15%,90%)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="relative h-40 flex items-center justify-center bg-[hsl(215,50%,35%)]">
            <div className="relative z-10 flex flex-col items-center gap-2">
              <Shield className="w-10 h-10 text-amber-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide uppercase">
                {isRtl ? 'مدير النظام' : 'System Admin'}
              </h1>
              <p className="text-white/70 text-sm">
                {isRtl ? 'لوحة تحكم مدير النظام' : 'Admin Control Panel'}
              </p>
            </div>
          </div>
          <div className="p-8 flex justify-center">
            <Link to="/auth/super-admin">
              <Button className="px-12 h-11 bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold tracking-wider rounded-full border-none shadow-md">
                {isRtl ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </Link>
          </div>
          <div className="py-3 text-center border-t border-[hsl(210,15%,90%)]">
            <p className="text-[11px] text-[hsl(215,15%,65%)]">
              © {new Date().getFullYear()} <span className="text-[hsl(210,70%,50%)]">Elzini SaaS</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const features = isRtl
    ? ['تجربة مجانية', 'لا حاجة لبطاقة ائتمان', 'جاهز للعمل فوراً', 'شامل لجميع التطبيقات']
    : ['Free Trial', 'No Credit Card Needed', 'Ready Instantly', 'All Apps Included'];


  return (
    <div className="min-h-screen bg-[hsl(210,10%,97%)] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-[hsl(210,15%,90%)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {!logoLoading && (
              <img
                src={settings.login_logo_url || logo}
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            )}
            <span className="text-xl font-black text-[hsl(215,40%,20%)] hidden sm:inline">
              Elzini ERP
            </span>
          </div>


          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <Link to="/auth/company">
              <Button variant="ghost" className="text-sm font-medium text-[hsl(215,20%,40%)] hover:text-[hsl(215,40%,25%)] gap-1.5">
                <BarChart3 className="w-4 h-4" />
                {isRtl ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold text-sm px-6 h-10 rounded-md border-none shadow-sm">
                {isRtl ? 'ابدأ الاستخدام مجاناً' : 'Start Free'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[hsl(215,40%,15%)] leading-tight tracking-tight">
            {isRtl
              ? <>نظام <span className="text-[hsl(210,70%,50%)]">ERP</span> متكامل لإدارة أعمالك</>
              : <>Complete <span className="text-[hsl(210,70%,50%)]">ERP</span> System for Your Business</>
            }
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-[hsl(215,15%,45%)] leading-relaxed max-w-3xl mx-auto">
            {isRtl
              ? 'شريكك الرقمي الأمثل لإدارة جميع جوانب أعمالك. برنامج سحابي آمن بهوية عربية أصيلة وواجهة عصرية تدعم العربية والإنجليزية، يضمن سلامة بياناتك ويرافقك أينما كنت. أصدر الفواتير الإلكترونية المعتمدة وأدر مبيعاتك، مخزونك، عملاءك، موظفيك، حساباتك، ودورة عملك من مكان واحد.'
              : 'Your ultimate digital partner for managing every aspect of your business. A secure cloud-based system with a modern bilingual interface, ensuring data safety wherever you go. Issue certified e-invoices, manage sales, inventory, customers, employees, and accounting — all from one place.'
            }
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Link to="/register">
              <Button className="bg-[hsl(140,50%,45%)] hover:bg-[hsl(140,50%,40%)] text-white font-bold text-lg sm:text-xl px-12 sm:px-20 h-14 sm:h-16 rounded-lg border-none shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                {isRtl ? 'ابدأ الاستخدام مجاناً' : 'Start Free Now'}
              </Button>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-[hsl(215,20%,45%)]">
                <Sparkles className="w-4 h-4 text-[hsl(210,70%,50%)]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[hsl(210,15%,90%)] bg-white">
        <p className="text-xs text-[hsl(215,15%,65%)]">
          © {new Date().getFullYear()} <span className="text-[hsl(210,70%,50%)]">Elzini SaaS</span>. {isRtl ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}
        </p>
      </footer>
    </div>
  );
}
