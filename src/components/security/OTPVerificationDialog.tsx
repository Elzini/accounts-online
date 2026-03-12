import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Clock, Mail, Loader2, AlertTriangle } from 'lucide-react';

interface OTPVerificationDialogProps {
  isOpen: boolean;
  isSending: boolean;
  isLoading: boolean;
  adminEmail: string | null;
  expiresAt: string | null;
  error: string | null;
  onVerify: (code: string) => Promise<boolean>;
  onClose: () => void;
}

export function OTPVerificationDialog({
  isOpen,
  isSending,
  isLoading,
  adminEmail,
  expiresAt,
  error,
  onVerify,
  onClose,
}: OTPVerificationDialogProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    await onVerify(code);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            تحقق أمني - عملية حساسة
          </DialogTitle>
          <DialogDescription>
            يجب إدخال كود التحقق المرسل للمسؤول لإتمام هذه العملية
          </DialogDescription>
        </DialogHeader>

        {isSending ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري إرسال كود التحقق...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {adminEmail && (
              <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>تم الإرسال إلى: <strong>{adminEmail}</strong></span>
              </div>
            )}

            <div className="flex justify-center gap-2" dir="ltr">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-primary"
                  disabled={isLoading || timeLeft <= 0}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {timeLeft > 0 ? (
                <span className={timeLeft < 60 ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                  ينتهي خلال {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-destructive font-bold">انتهت صلاحية الكود</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={otp.join('').length !== 6 || isLoading || timeLeft <= 0}
                className="flex-1"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري التحقق...</>
                ) : (
                  'تأكيد'
                )}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
