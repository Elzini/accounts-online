import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, Apple, Chrome, Share, MoreVertical, PlusSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      // Store globally for desktop fallback
      (window as any).deferredPrompt = prompt;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: '🚗', text: 'إدارة المخزون والسيارات' },
    { icon: '💰', text: 'المبيعات والمشتريات' },
    { icon: '👥', text: 'العملاء والموردين' },
    { icon: '📊', text: 'التقارير المالية' },
    { icon: '📱', text: 'يعمل بدون إنترنت' },
    { icon: '🔔', text: 'إشعارات فورية' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Elzini SaaS</CardTitle>
          <CardDescription>
            ثبّت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Install Status */}
          {isInstalled ? (
            <div className="flex flex-col items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <div className="text-center">
                <p className="font-semibold text-primary">تم تثبيت التطبيق بنجاح!</p>
                <p className="text-sm text-muted-foreground">يمكنك الآن فتحه من الشاشة الرئيسية</p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full">
                فتح التطبيق
              </Button>
            </div>
          ) : (
            <>
              {/* Android/Chrome Install */}
              {deferredPrompt && (
                <Button 
                  onClick={handleInstall} 
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  تثبيت التطبيق
                </Button>
              )}

              {/* iOS Instructions */}
              {isIOS && !deferredPrompt && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Apple className="w-5 h-5" />
                    <span className="font-semibold">تثبيت على iPhone/iPad</span>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</span>
                      <span className="flex items-center gap-2">
                        اضغط على زر المشاركة
                        <Share className="w-4 h-4 text-primary" />
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</span>
                      <span>مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</span>
                      <span>اضغط "إضافة" في الأعلى</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Manual Instructions */}
              {isAndroid && !deferredPrompt && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Chrome className="w-5 h-5" />
                    <span className="font-semibold">تثبيت على Android</span>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</span>
                      <span className="flex items-center gap-2">
                        اضغط على قائمة المتصفح
                        <MoreVertical className="w-4 h-4 text-primary" />
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</span>
                      <span className="flex items-center gap-2">
                        اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"
                        <PlusSquare className="w-4 h-4 text-primary" />
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</span>
                      <span>اضغط "تثبيت" للتأكيد</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop Instructions - show when no prompt available */}
              {!isIOS && !isAndroid && !deferredPrompt && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Chrome className="w-5 h-5" />
                    <span className="font-semibold">تثبيت على الكمبيوتر</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    انقر على زر التثبيت أدناه أو ابحث عن أيقونة التثبيت <Download className="w-4 h-4 inline mx-1" /> في شريط العنوان.
                  </p>
                  <Button 
                    onClick={() => {
                      // Try to trigger install if available, otherwise show alert
                      if ((window as any).deferredPrompt) {
                        (window as any).deferredPrompt.prompt();
                      } else {
                        alert('لتثبيت التطبيق:\n1. افتح قائمة المتصفح (⋮ أو ⋯)\n2. اختر "تثبيت التطبيق" أو "Install App"');
                      }
                    }}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Download className="w-5 h-5" />
                    تثبيت التطبيق
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Continue to App */}
          {!isInstalled && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              متابعة بدون تثبيت
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
