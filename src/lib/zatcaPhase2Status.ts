const APPROVED_PHASE2_STATUSES = new Set(['reported', 'cleared']);
const REJECTED_PHASE2_STATUSES = new Set(['rejected', 'failed', 'error', 'invalid']);
const PENDING_PHASE2_STATUSES = new Set(['pending', 'submitted', 'processing', 'queued', 'validating', 'ready']);

export type SignatureSource = 'official' | 'local' | 'none';

export interface ZatcaPhase2DisplayState {
  normalizedStatus: string | null;
  hasOfficialQr: boolean;
  isPhase2Approved: boolean;
  label: string;
  description: string;
  signatureSource: SignatureSource;
  signatureLabel: string;
  hasComplianceCsid: boolean;
  hasProductionCsid: boolean;
  csidLabel: string;
  onboardingLabel: string;
}

export function normalizeZatcaStatus(status?: string | null): string | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || null;
}

export function getZatcaPhase2DisplayState(input: {
  officialQrData?: string | null;
  zatcaStatus?: string | null;
  hasComplianceCsid?: boolean;
  hasProductionCsid?: boolean;
  onboardingStatus?: string | null;
}): ZatcaPhase2DisplayState {
  const normalizedStatus = normalizeZatcaStatus(input.zatcaStatus);
  const hasOfficialQr = Boolean(input.officialQrData?.trim());
  const hasComplianceCsid = Boolean(input.hasComplianceCsid);
  const hasProductionCsid = Boolean(input.hasProductionCsid);

  // Signature source
  let signatureSource: SignatureSource = 'none';
  let signatureLabel = 'لا يوجد QR';
  if (hasOfficialQr && hasProductionCsid) {
    signatureSource = 'official';
    signatureLabel = 'موقّع رسميًا بشهادة الإنتاج';
  } else if (hasOfficialQr && hasComplianceCsid) {
    signatureSource = 'official';
    signatureLabel = 'موقّع بشهادة الامتثال (Compliance)';
  } else if (hasOfficialQr) {
    signatureSource = 'local';
    signatureLabel = 'QR محلي - بدون شهادة معتمدة';
  } else {
    signatureSource = 'none';
    signatureLabel = 'لا يوجد QR محفوظ';
  }

  // CSID label
  let csidLabel = 'لا توجد شهادة CSID';
  if (hasProductionCsid) csidLabel = 'شهادة الإنتاج (Production CSID) ✔';
  else if (hasComplianceCsid) csidLabel = 'شهادة الامتثال فقط (Compliance CSID)';

  const onboardingLabel = input.onboardingStatus?.trim() || 'لم يبدأ التسجيل';

  // Approval label
  if (normalizedStatus && APPROVED_PHASE2_STATUSES.has(normalizedStatus)) {
    return {
      normalizedStatus, hasOfficialQr,
      isPhase2Approved: true,
      label: '✅ مطابق ومعتمد - مرحلة ثانية',
      description: normalizedStatus === 'cleared'
        ? 'تم الاعتماد النهائي من هيئة الزكاة والضريبة والجمارك.'
        : 'تم التبليغ الرسمي لهيئة الزكاة والضريبة والجمارك.',
      signatureSource, signatureLabel, hasComplianceCsid, hasProductionCsid, csidLabel, onboardingLabel,
    };
  }

  if (normalizedStatus && REJECTED_PHASE2_STATUSES.has(normalizedStatus)) {
    return {
      normalizedStatus, hasOfficialQr,
      isPhase2Approved: false,
      label: 'مرفوض مرحلة ثانية',
      description: 'الهيئة رفضت الإرسال أو الاعتماد.',
      signatureSource, signatureLabel, hasComplianceCsid, hasProductionCsid, csidLabel, onboardingLabel,
    };
  }

  if ((normalizedStatus && PENDING_PHASE2_STATUSES.has(normalizedStatus)) || hasOfficialQr) {
    return {
      normalizedStatus, hasOfficialQr,
      isPhase2Approved: false,
      label: 'قيد اعتماد المرحلة الثانية',
      description: 'بانتظار اكتمال الاعتماد.',
      signatureSource, signatureLabel, hasComplianceCsid, hasProductionCsid, csidLabel, onboardingLabel,
    };
  }

  return {
    normalizedStatus, hasOfficialQr,
    isPhase2Approved: false,
    label: 'متوافق مع المرحلة الثانية',
    description: 'الباركود يحتوي على Tags 1-9 لكن لم يُعتمد رسميًا من ZATCA.',
    signatureSource, signatureLabel, hasComplianceCsid, hasProductionCsid, csidLabel, onboardingLabel,
  };
}
