import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPassword() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
        navigate('/auth/company', { replace: true });
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(210,15%,93%)] flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRtl ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
            </p>
          </div>

          {!isRecovery ? (
            <div className="text-center text-muted-foreground">
              <p>{isRtl ? 'رابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.' : 'Invalid or expired link. Please request a new one.'}</p>
              <Button onClick={() => navigate('/auth/company')} className="mt-4" variant="outline">
                {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 text-lg gradient-primary">
                {loading
                  ? (isRtl ? 'جاري التحديث...' : 'Updating...')
                  : (isRtl ? 'تحديث كلمة المرور' : 'Update Password')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
