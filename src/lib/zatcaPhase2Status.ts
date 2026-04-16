const APPROVED_PHASE2_STATUSES = new Set(['reported', 'cleared']);
const REJECTED_PHASE2_STATUSES = new Set(['rejected', 'failed', 'error', 'invalid']);
const PENDING_PHASE2_STATUSES = new Set(['pending', 'submitted', 'processing', 'queued', 'validating', 'ready']);

export interface ZatcaPhase2DisplayState {
  normalizedStatus: string | null;
  hasOfficialQr: boolean;
  isPhase2Approved: boolean;
  label: string;
  description: string;
}

export function normalizeZatcaStatus(status?: string | null): string | null {
  if (!status) return null;

  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || null;
}

export function getZatcaPhase2DisplayState(input: {
  officialQrData?: string | null;
  zatcaStatus?: string | null;
}): ZatcaPhase2DisplayState {
  const normalizedStatus = normalizeZatcaStatus(input.zatcaStatus);
  const hasOfficialQr = Boolean(input.officialQrData?.trim());

  // Show Phase 2 approved for cleared/reported status regardless of official QR
  if (normalizedStatus && APPROVED_PHASE2_STATUSES.has(normalizedStatus)) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: true,
      label: 'معتمد مرحلة ثانية',
      description: normalizedStatus === 'cleared'
        ? 'تم الاعتماد النهائي من هيئة الزكاة والضريبة والجمارك.'
        : 'تم التبليغ الرسمي لهيئة الزكاة والضريبة والجمارك.',
    };
  }

  if (normalizedStatus && REJECTED_PHASE2_STATUSES.has(normalizedStatus)) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: false,
      label: 'مرفوض مرحلة ثانية',
      description: 'الهيئة رفضت الإرسال أو الاعتماد.',
    };
  }

  if ((normalizedStatus && PENDING_PHASE2_STATUSES.has(normalizedStatus)) || hasOfficialQr) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: false,
      label: 'قيد اعتماد المرحلة الثانية',
      description: 'بانتظار اكتمال الاعتماد.',
    };
  }

  return {
    normalizedStatus,
    hasOfficialQr,
    isPhase2Approved: false,
    label: 'متوافق مع المرحلة الثانية',
    description: 'الباركود يحتوي على التوقيع الرقمي والهاش (Tags 1-9).',
  };
}
