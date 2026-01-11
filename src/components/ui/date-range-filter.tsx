import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear?: () => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasFilter = startDate || endDate;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          {hasFilter ? (
            <span className="text-sm">
              {startDate ? formatDisplayDate(startDate) : 'البداية'} - {endDate ? formatDisplayDate(endDate) : 'النهاية'}
            </span>
          ) : (
            <span>فلترة بالتاريخ</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" dir="rtl">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">فلترة حسب التاريخ</h4>
            <p className="text-sm text-muted-foreground">
              حدد نطاق التواريخ لعرض البيانات
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="start-date">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
                onClear?.();
              }}
            >
              مسح الفلتر
            </Button>
            <Button className="flex-1" onClick={() => setIsOpen(false)}>
              تطبيق
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
