import { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Loader2, Smartphone, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { 
  use2FAStatus, 
  useSetup2FA, 
  useVerify2FA, 
  useDisable2FA,
  useSetupSms2FA,
  useVerifySms2FA,
} from '@/hooks/use2FA';
import { toast } from 'sonner';

export function TwoFactorSetup() {
  const { data: statusData, isLoading: statusLoading } = use2FAStatus();
  const setupMutation = useSetup2FA();
  const verifyMutation = useVerify2FA();
  const disableMutation = useDisable2FA();
  const setupSmsMutation = useSetupSms2FA();
  const verifySmsMutation = useVerifySms2FA();

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [setupMethod, setSetupMethod] = useState<'totp' | 'sms'>('totp');
  const [setupData, setSetupData] = useState<{
    secret?: string;
    otpauthUrl?: string;
    backupCodes?: string[];
  } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [smsStep, setSmsStep] = useState<'phone' | 'verify'>('phone');

  const isEnabled = statusData?.isEnabled || false;
  const twoFaType = statusData?.twoFaType;
  const maskedPhone = statusData?.phoneNumber;

  const handleSetupTotp = async () => {
    const result = await setupMutation.mutateAsync();
    if (result.success) {
      setSetupData({
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
        backupCodes: result.backupCodes,
      });
      setSetupMethod('totp');
      setSetupDialogOpen(true);
    }
  };

  const handleSetupSms = () => {
    setSetupMethod('sms');
    setSmsStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setSetupDialogOpen(true);
  };

  const handleSendSmsOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    const result = await setupSmsMutation.mutateAsync(phoneNumber);
    if (result.success) {
      setSmsStep('verify');
    }
  };

  const handleVerifyTotp = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('يرجى إدخال رمز مكون من 6 أرقام');
      return;
    }

    const result = await verifyMutation.mutateAsync(verificationCode);
    if (result.success && result.isValid) {
      setShowBackupCodes(true);
    }
  };

  const handleVerifySms = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }

    const result = await verifySmsMutation.mutateAsync(verificationCode);
    if (result.success && result.isValid) {
      closeSetupDialog();
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length < 4) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }

    const result = await disableMutation.mutateAsync(disableCode);
    if (result.success) {
      setDisableDialogOpen(false);
      setDisableCode('');
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      toast.success('تم نسخ المفتاح السري');
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const closeSetupDialog = () => {
    setSetupDialogOpen(false);
    setSetupData(null);
    setVerificationCode('');
    setPhoneNumber('');
    setShowBackupCodes(false);
    setSmsStep('phone');
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>المصادقة الثنائية (2FA)</CardTitle>
                <CardDescription>
                  أضف طبقة حماية إضافية لحسابك
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEnabled && twoFaType === 'sms' && (
                <Badge variant="outline" className="gap-1">
                  <MessageSquare className="w-3 h-3" />
                  SMS
                </Badge>
              )}
              {isEnabled && twoFaType === 'totp' && (
                <Badge variant="outline" className="gap-1">
                  <Smartphone className="w-3 h-3" />
                  تطبيق
                </Badge>
              )}
              <Badge variant={isEnabled ? 'default' : 'secondary'}>
                {isEnabled ? 'مفعل' : 'غير مفعل'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? twoFaType === 'sms'
                    ? `حسابك محمي بالمصادقة الثنائية عبر SMS (${maskedPhone})`
                    : 'حسابك محمي بالمصادقة الثنائية عبر التطبيق. ستحتاج لإدخال رمز من تطبيق المصادقة عند تسجيل الدخول.'
                  : 'قم بتفعيل المصادقة الثنائية لحماية حسابك من الوصول غير المصرح به.'}
              </p>
            </div>
            {isEnabled ? (
              <Button
                variant="destructive"
                onClick={() => setDisableDialogOpen(true)}
              >
                <ShieldOff className="w-4 h-4 ml-2" />
                تعطيل
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSetupSms} 
                  disabled={setupSmsMutation.isPending}
                >
                  {setupSmsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4 ml-2" />
                  )}
                  SMS
                </Button>
                <Button onClick={handleSetupTotp} disabled={setupMutation.isPending}>
                  {setupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4 ml-2" />
                  )}
                  تطبيق
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupMethod === 'sms' ? 'إعداد المصادقة عبر SMS' : 'إعداد المصادقة الثنائية'}
            </DialogTitle>
            <DialogDescription>
              {setupMethod === 'sms'
                ? smsStep === 'phone'
                  ? 'أدخل رقم هاتفك لتلقي رموز التحقق'
                  : 'أدخل رمز التحقق المرسل إلى هاتفك'
                : showBackupCodes
                ? 'احتفظ بالرموز الاحتياطية في مكان آمن'
                : 'امسح رمز QR باستخدام تطبيق المصادقة (Google Authenticator, Authy, إلخ)'}
            </DialogDescription>
          </DialogHeader>

          {setupMethod === 'sms' ? (
            // SMS Setup
            <div className="space-y-4">
              {smsStep === 'phone' ? (
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-center text-lg"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم إرسال رمز التحقق عبر SMS إلى هذا الرقم
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>رمز التحقق</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="0000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
              )}
            </div>
          ) : !showBackupCodes ? (
            // TOTP Setup
            <div className="space-y-4">
              {setupData?.otpauthUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={setupData.otpauthUrl} size={200} />
                </div>
              )}

              <div className="space-y-2">
                <Label>أو أدخل المفتاح يدوياً:</Label>
                <div className="flex gap-2">
                  <Input
                    value={setupData?.secret || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>أدخل الرمز من التطبيق للتحقق:</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
            </div>
          ) : (
            // Backup Codes
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  هذه الرموز الاحتياطية يمكن استخدامها لتسجيل الدخول في حالة فقدان هاتفك.
                  كل رمز يمكن استخدامه مرة واحدة فقط.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {setupData?.backupCodes?.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded text-center">
                    {code}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (setupData?.backupCodes) {
                    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
                    toast.success('تم نسخ الرموز الاحتياطية');
                  }
                }}
              >
                <Copy className="w-4 h-4 ml-2" />
                نسخ جميع الرموز
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupMethod === 'sms' ? (
              smsStep === 'phone' ? (
                <>
                  <Button variant="outline" onClick={closeSetupDialog}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSendSmsOtp}
                    disabled={setupSmsMutation.isPending || phoneNumber.length < 9}
                  >
                    {setupSmsMutation.isPending && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    إرسال الرمز
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setSmsStep('phone')}>
                    رجوع
                  </Button>
                  <Button
                    onClick={handleVerifySms}
                    disabled={verifySmsMutation.isPending || verificationCode.length < 4}
                  >
                    {verifySmsMutation.isPending && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    تفعيل
                  </Button>
                </>
              )
            ) : !showBackupCodes ? (
              <>
                <Button variant="outline" onClick={closeSetupDialog}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleVerifyTotp}
                  disabled={verifyMutation.isPending || verificationCode.length !== 6}
                >
                  {verifyMutation.isPending && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                  تفعيل
                </Button>
              </>
            ) : (
              <Button onClick={closeSetupDialog} className="w-full">
                تم
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعطيل المصادقة الثنائية</DialogTitle>
            <DialogDescription>
              {twoFaType === 'sms'
                ? 'أدخل رمز التحقق المرسل إلى هاتفك لتأكيد تعطيل الميزة'
                : 'أدخل رمز التحقق من تطبيق المصادقة لتأكيد تعطيل الميزة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                تعطيل المصادقة الثنائية سيجعل حسابك أقل أماناً.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>رمز التحقق:</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableMutation.isPending || disableCode.length < 4}
            >
              {disableMutation.isPending && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              )}
              تعطيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
