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

  if (normalizedStatus && APPROVED_PHASE2_STATUSES.has(normalizedStatus) && hasOfficialQr) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: true,
      label: 'معتمد مرحلة ثانية',
      description: normalizedStatus === 'cleared'
        ? 'تم عرض QR الرسمي بعد الاعتماد النهائي.'
        : 'تم عرض QR الرسمي بعد التبليغ الرسمي.',
    };
  }

  if (normalizedStatus && APPROVED_PHASE2_STATUSES.has(normalizedStatus) && !hasOfficialQr) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: false,
      label: 'حالة معتمدة بدون QR رسمي',
      description: 'تم حفظ الحالة لكن QR الرسمي غير موجود في الفاتورة بعد.',
    };
  }

  if (normalizedStatus && REJECTED_PHASE2_STATUSES.has(normalizedStatus)) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: false,
      label: 'مرفوض مرحلة ثانية',
      description: 'الهيئة رفضت الإرسال أو الاعتماد، لذلك تم إبقاء QR المحلي فقط.',
    };
  }

  if ((normalizedStatus && PENDING_PHASE2_STATUSES.has(normalizedStatus)) || hasOfficialQr) {
    return {
      normalizedStatus,
      hasOfficialQr,
      isPhase2Approved: false,
      label: 'قيد اعتماد المرحلة الثانية',
      description: hasOfficialQr
        ? 'تم حفظ QR من الربط الخلفي لكن الحالة النهائية لم تكتمل بعد.'
        : 'بانتظار QR الرسمي من الربط الخلفي بعد التبليغ أو الاعتماد.',
    };
  }

  return {
    normalizedStatus,
    hasOfficialQr,
    isPhase2Approved: true,
    label: 'معتمد مرحلة ثانية',
    description: 'تم توليد QR متوافق مع متطلبات المرحلة الثانية.',
  };
}