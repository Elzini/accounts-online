import { useEffect, useState } from 'react';
import { useSystemChangeAlerts, SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { SystemChangeAlertModal } from './SystemChangeAlertModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function SystemChangeAlertProvider() {
  const { pendingAlerts, newAlert, dismissNewAlert, approveAlert, rejectAlert } = useSystemChangeAlerts();
  const [activeAlert, setActiveAlert] = useState<SystemChangeAlert | null>(null);
  const [soundPlayed, setSoundPlayed] = useState<string | null>(null);

  // Auto-show popup when a new realtime alert arrives
  useEffect(() => {
    if (newAlert && newAlert.id !== soundPlayed) {
      setActiveAlert(newAlert);
      setSoundPlayed(newAlert.id);
      toast.error('تنبيه أمني: تم اكتشاف تغيير في النظام!', {
        description: newAlert.description,
        duration: 10000,
      });
    }
  }, [newAlert, soundPlayed]);

  // Show first pending on mount if any
  useEffect(() => {
    if (!activeAlert && pendingAlerts.length > 0) {
      setActiveAlert(pendingAlerts[0]);
    }
  }, [pendingAlerts, activeAlert]);

  const handleApprove = (id: string, notes?: string) => {
    approveAlert.mutate({ id, notes }, {
      onSuccess: () => {
        toast.success('تمت الموافقة على التغيير وتطبيقه بنجاح');
        setActiveAlert(null);
        dismissNewAlert();
      },
    });
  };

  const handleReject = (id: string, notes?: string) => {
    rejectAlert.mutate({ id, notes }, {
      onSuccess: () => {
        toast.info('تم رفض التغيير ومنعه بنجاح');
        setActiveAlert(null);
        dismissNewAlert();
      },
    });
  };

  return (
    <>
      {/* Floating badge for pending alerts */}
      {pendingAlerts.length > 0 && !activeAlert && (
        <div className="fixed bottom-20 left-4 z-50 animate-bounce">
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 shadow-lg"
            onClick={() => setActiveAlert(pendingAlerts[0])}
          >
            <AlertTriangle className="w-4 h-4" />
            تنبيهات تغيير معلقة
            <Badge variant="secondary" className="bg-white text-destructive">
              {pendingAlerts.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Alert Modal */}
      {activeAlert && (
        <SystemChangeAlertModal
          alert={activeAlert}
          open={!!activeAlert}
          onClose={() => {
            setActiveAlert(null);
            dismissNewAlert();
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveAlert.isPending}
          isRejecting={rejectAlert.isPending}
        />
      )}
    </>
  );
}
