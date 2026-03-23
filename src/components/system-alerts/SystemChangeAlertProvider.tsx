import { useEffect, useState } from 'react';
import { useSystemChangeAlerts, SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeAlertModal } from './SystemChangeAlertModal';
import { SecurityTopBar } from './SecurityTopBar';
import { FreezeModeBanner } from './FreezeModeBanner';
import { toast } from 'sonner';

export function SystemChangeAlertProvider() {
  const {
    pendingAlerts, newAlert, dismissNewAlert, approveAlert, rejectAlert,
    isFrozen, securityStatus, alerts,
  } = useSystemChangeAlerts();
  const [activeAlert, setActiveAlert] = useState<SystemChangeAlert | null>(null);
  const [soundPlayed, setSoundPlayed] = useState<string | null>(null);
  const [showTopBar, setShowTopBar] = useState(true);

  // Auto-show popup when a new realtime alert arrives
  useEffect(() => {
    if (newAlert && newAlert.id !== soundPlayed) {
      setActiveAlert(newAlert);
      setSoundPlayed(newAlert.id);
      toast.error('⚠️ تنبيه أمني: تم اكتشاف تغيير في النظام!', {
        description: newAlert.description,
        duration: 15000,
      });
    }
  }, [newAlert, soundPlayed]);

  const handleApprove = (id: string, notes?: string) => {
    approveAlert.mutate({ id, notes });
    toast.success('✅ تمت الموافقة على التغيير وتطبيقه بنجاح');
    setActiveAlert(null);
    dismissNewAlert();
  };

  const handleReject = (id: string, notes?: string) => {
    rejectAlert.mutate({ id, notes });
    toast.info('🚫 تم رفض التغيير ومنعه بنجاح');
    setActiveAlert(null);
    dismissNewAlert();
  };

  return (
    <>
      {/* Freeze Mode Full-Screen Banner */}
      {isFrozen && <FreezeModeBanner />}

      {/* Top Security Status Bar */}
      {showTopBar && (securityStatus !== 'normal' || pendingAlerts.length > 0) && (
        <SecurityTopBar
          securityStatus={securityStatus}
          pendingCount={pendingAlerts.length}
          onViewAlert={() => {
            if (pendingAlerts.length > 0) setActiveAlert(pendingAlerts[0]);
          }}
          onClose={() => setShowTopBar(false)}
        />
      )}

      {/* Alert Modal */}
      {activeAlert && (
        <SystemChangeAlertModal
          alert={activeAlert}
          allPendingAlerts={pendingAlerts}
          open={!!activeAlert}
          onClose={() => {
            setActiveAlert(null);
            dismissNewAlert();
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveAlert.isPending}
          isRejecting={rejectAlert.isPending}
          onNavigate={(alert) => setActiveAlert(alert)}
        />
      )}
    </>
  );
}
