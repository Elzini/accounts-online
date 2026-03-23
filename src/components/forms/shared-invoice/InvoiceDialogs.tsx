/**
 * Shared Invoice Confirmation Dialogs
 * Delete, Reverse, and Approve confirmation dialogs.
 */
import { RotateCcw, CheckCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InvoiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  dir: string;
  labels: { title: string; description: string; cancel: string; delete: string; deleting: string };
}

export function InvoiceDeleteDialog({ open, onOpenChange, onConfirm, isPending, dir, labels }: InvoiceDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={dir}>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription>{labels.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isPending ? labels.deleting : labels.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface InvoiceReverseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  dir: string;
  labels: {
    title: string;
    description: string;
    bulletPoints: string[];
    warning: string;
    cancel: string;
    confirm: string;
    confirming: string;
  };
}

export function InvoiceReverseDialog({ open, onOpenChange, onConfirm, isPending, dir, labels }: InvoiceReverseDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={dir}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-warning" />
            {labels.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{labels.description}</p>
            <ul className="list-disc list-inside text-muted-foreground">
              {labels.bulletPoints.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
            <p className="text-destructive font-medium">{labels.warning}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-warning text-warning-foreground hover:bg-warning/90">
            {isPending ? labels.confirming : labels.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface InvoiceApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  dir: string;
  labels: { title: string; description: string; cancel: string; confirm: string; confirming: string };
}

export function InvoiceApproveDialog({ open, onOpenChange, onConfirm, isPending, dir, labels }: InvoiceApproveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={dir}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            {labels.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{labels.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-success text-success-foreground hover:bg-success/90">
            {isPending ? labels.confirming : labels.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
