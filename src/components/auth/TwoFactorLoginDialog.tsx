import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, MessageSquare } from 'lucide-react';
import { verifyLogin2FA, verifyLoginSms2FA, sendLoginOtp } from '@/services/twoFactorAuth';
import { toast } from 'sonner';

interface TwoFactorLoginDialogProps {
  open: boolean;
  twoFaType: 'totp' | 'sms' | null;
  phoneNumber?: string | null;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorLoginDialog({ open, twoFaType, phoneNumber, onVerified, onCancel }: TwoFactorLoginDialogProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }
    setVerifying(true);
    try {
      const result = twoFaType === 'sms'
        ? await verifyLoginSms2FA(code.trim())
        : await verifyLogin2FA(code.trim());

      if (result.success && result.isValid) {
        onVerified();
      } else {
        toast.error('رمز التحقق غير صحيح');
        setCode('');
      }
    } catch {
      toast.error('حدث خطأ أثناء التحقق');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendSmsOtp = async () => {
    setSendingOtp(true);
    try {
      const result = await sendLoginOtp();
      if (result.success) {
        toast.success('تم إرسال رمز التحقق إلى هاتفك');
      } else {
        toast.error(result.error || 'فشل في إرسال رمز التحقق');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-primary" />
            المصادقة الثنائية
          </DialogTitle>
          <DialogDescription>
            {twoFaType === 'sms'
              ? `أدخل رمز التحقق المرسل إلى ${phoneNumber || 'هاتفك'}`
              : 'أدخل رمز التحقق من تطبيق المصادقة'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={twoFaType === 'sms' ? 'رمز التحقق (6 أرقام)' : 'رمز التحقق أو رمز احتياطي'}
            className="text-center text-lg tracking-widest font-mono"
            maxLength={8}
            autoFocus
            dir="ltr"
          />

          {twoFaType === 'sms' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendSmsOtp}
              disabled={sendingOtp}
              className="w-full gap-2"
            >
              {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              إرسال رمز جديد
            </Button>
          )}

          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={verifying || !code.trim()} className="flex-1">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحقق'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
