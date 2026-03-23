/**
 * Shared Invoice Navigation Header
 * Record navigation (First/Prev/Next/Last) + title + status badge.
 */
import { ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type InvoiceColorTheme = 'sales' | 'purchase';

const THEME_CLASSES: Record<InvoiceColorTheme, string> = {
  sales: 'bg-gradient-to-l from-emerald-600 via-emerald-500 to-teal-500',
  purchase: 'bg-gradient-to-l from-blue-600 via-blue-500 to-indigo-500',
};

interface InvoiceNavHeaderProps {
  title: string;
  theme: InvoiceColorTheme;
  currentIndex: number;
  totalRecords: number;
  isViewingExisting: boolean;
  status?: 'draft' | 'approved' | string;
  statusLabels?: { approved: string; draft: string };
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  /** Extra actions rendered between nav controls and title */
  extraActions?: React.ReactNode;
}

export function InvoiceNavHeader({
  title, theme, currentIndex, totalRecords,
  isViewingExisting, status, statusLabels,
  onFirst, onPrevious, onNext, onLast, extraActions,
}: InvoiceNavHeaderProps) {
  return (
    <div className={`${THEME_CLASSES[theme]} text-white px-4 py-3`}>
      <div className="flex items-center justify-between">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={onLast} disabled={totalRecords === 0}>
            <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -mr-2.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={onNext} disabled={currentIndex >= totalRecords - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="px-3 py-1 text-xs bg-white/20 rounded-md min-w-[70px] text-center font-mono font-bold">
            {totalRecords > 0 ? currentIndex + 1 : 0} / {totalRecords}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={onPrevious} disabled={currentIndex <= 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-md" onClick={onFirst} disabled={totalRecords === 0}>
            <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
          </Button>
        </div>

        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 opacity-80" />
            <h1 className="text-lg font-bold tracking-wide">{title}</h1>
          </div>
          {isViewingExisting && statusLabels && (
            <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-sm ${
              status === 'approved'
                ? 'bg-white text-emerald-700'
                : 'bg-yellow-400 text-yellow-900 animate-pulse'
            }`}>
              {status === 'approved' ? `✓ ${statusLabels.approved}` : `⏳ ${statusLabels.draft}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
