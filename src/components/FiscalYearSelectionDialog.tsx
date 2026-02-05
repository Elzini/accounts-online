import { useState, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FiscalYear } from '@/services/fiscalYears';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FiscalYearSelectionDialogProps {
  open: boolean;
  fiscalYears: FiscalYear[];
  currentSelectedId?: string;
  onSelect: (fiscalYear: FiscalYear) => void;
}

export function FiscalYearSelectionDialog({
  open,
  fiscalYears,
  currentSelectedId,
  onSelect,
}: FiscalYearSelectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(() => {
    // Default to current selection, then current year, then first one
    if (currentSelectedId) return currentSelectedId;
    const currentYear = fiscalYears.find(fy => fy.is_current);
    return currentYear?.id || fiscalYears[0]?.id || '';
  });

  // Update selection when currentSelectedId changes
  useEffect(() => {
    if (currentSelectedId) {
      setSelectedId(currentSelectedId);
    }
  }, [currentSelectedId]);

  const handleConfirm = () => {
    const selected = fiscalYears.find(fy => fy.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            اختر السنة المالية
          </DialogTitle>
          <DialogDescription>
            اختر السنة المالية التي تريد العمل عليها
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedId}
            onValueChange={setSelectedId}
            className="space-y-3"
          >
            {fiscalYears.map((fy) => (
              <div
                key={fy.id}
                className={`flex items-center space-x-3 space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedId === fy.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedId(fy.id)}
              >
                <RadioGroupItem value={fy.id} id={fy.id} />
                <Label
                  htmlFor={fy.id}
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{fy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(fy.start_date)} - {formatDate(fy.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {fy.is_current && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        الحالية
                      </span>
                    )}
                    {fy.status === 'closed' && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                        مغلقة
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button onClick={handleConfirm} className="w-full gap-2">
          <Check className="w-4 h-4" />
          تأكيد الاختيار
        </Button>
      </DialogContent>
    </Dialog>
  );
}
