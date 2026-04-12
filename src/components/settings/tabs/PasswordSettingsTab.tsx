/**
 * Password Settings Tab - Extracted from AppSettings
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function PasswordSettingsTab() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error(t.settings_fill_all_fields); return; }
    if (newPassword.length < 6) { toast.error(t.settings_password_min); return; }
    if (newPassword !== confirmPassword) { toast.error(t.settings_password_mismatch); return; }
    setChanging(true);
    try {
      // Ensure we have a valid session before calling the edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        return;
      }

      // Verify current password via edge function to avoid session interference
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-password', {
        body: { currentPassword },
      });

      if (verifyError || !verifyData?.valid) {
        // Check if it's a session/auth error vs wrong password
        const errorMsg = verifyError?.message || verifyData?.error || '';
        if (errorMsg.includes('User not found') || errorMsg.includes('No auth') || errorMsg.includes('session')) {
          toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        } else {
          toast.error(t.settings_current_password_wrong);
        }
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Password update error:', error.message);
        toast.error(error.message || t.settings_save_error);
        return;
      }
      toast.success(t.settings_password_changed);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(t.settings_save_error);
    }
    finally { setChanging(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />{t.settings_change_password}</CardTitle>
        <CardDescription>{t.settings_change_password_desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>{t.settings_current_password}</Label>
          <div className="relative">
            <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pl-10" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t.settings_new_password}</Label>
          <div className="relative">
            <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t.settings_confirm_password}</Label>
          <div className="relative">
            <Input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button onClick={handleChange} disabled={changing} className="w-full gradient-primary">
          <Save className="w-4 h-4 ml-2" />{changing ? t.settings_saving : t.settings_change_password}
        </Button>
      </CardContent>
    </Card>
  );
}
