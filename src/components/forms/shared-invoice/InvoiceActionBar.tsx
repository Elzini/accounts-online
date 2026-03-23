/**
 * Shared Invoice Action Bar
 * The dual-row footer with operations/reports dropdowns and primary action buttons.
 */
import {
  Save, Plus, X, Printer, FileText, Trash2,
  FileSpreadsheet, ChevronDown, MessageSquare,
  RotateCcw, CheckCircle, FileEdit, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ActivePage } from '@/types';
import { InvoiceColorTheme } from './InvoiceNavHeader';

interface QuickMenuConfig {
  label: string;
  items: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }[];
}

interface InvoiceActionBarProps {
  theme: InvoiceColorTheme;
  isViewingExisting: boolean;
  isEditing: boolean;
  isApproved: boolean;
  isPending: boolean;
  setActivePage: (page: ActivePage) => void;
  searchBarRef: React.RefObject<HTMLDivElement>;
  // Actions
  onSubmit: () => void;
  onNewInvoice: () => void;
  onToggleEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onPrint: () => void;
  onUpdate?: () => void;
  onClose: () => void;
  closePage: ActivePage;
  // Quick menus
  quickMenus: QuickMenuConfig[];
  // Extra dropdown items
  moreItems?: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }[];
  // Labels
  labels: {
    add: string;
    saving: string;
    new: string;
    edit: string;
    cancelEdit: string;
    delete: string;
    accounting: string;
    search: string;
    print: string;
    more: string;
    close: string;
    saveChanges: string;
    approved: string;
  };
  // Update pending state
  updatePending?: boolean;
}

export function InvoiceActionBar(props: InvoiceActionBarProps) {
  const {
    theme, isViewingExisting, isEditing, isApproved, isPending,
    searchBarRef, onSubmit, onNewInvoice, onToggleEdit, onDelete,
    onApprove, onPrint, onUpdate, onClose, closePage,
    quickMenus, moreItems, labels, updatePending,
  } = props;

  const themeColor = theme === 'sales' ? 'emerald' : 'blue';
  const borderClass = theme === 'sales'
    ? 'border-emerald-100 dark:border-emerald-900'
    : 'border-blue-100 dark:border-blue-900';

  return (
    <div className={`border-t-2 ${borderClass} bg-gradient-to-b from-card to-muted/30`}>
      {/* Quick Menu Row */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50 overflow-x-auto">
        {quickMenus.map((menu, idx) => (
          <DropdownMenu key={idx}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-8 rounded-lg hover:bg-muted">
                {menu.label} <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {menu.items.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.onClick} disabled={item.disabled} className={item.className}>
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {/* Primary Action Buttons */}
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {isViewingExisting ? (
          <>
            {!isApproved && isEditing && onUpdate && (
              <Button onClick={onUpdate} size="sm" className={`gap-1.5 text-xs h-9 rounded-lg bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white shadow-md`} disabled={updatePending}>
                <Save className="w-3.5 h-3.5" />
                {updatePending ? labels.saving : labels.saveChanges}
              </Button>
            )}
            {isApproved && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 h-9">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{labels.approved}</span>
              </div>
            )}
          </>
        ) : (
          <Button onClick={onSubmit} size="sm" className={`gap-1.5 text-xs h-9 rounded-lg bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white shadow-md`} disabled={isPending}>
            <Plus className="w-3.5 h-3.5" />
            {isPending ? labels.saving : labels.add}
          </Button>
        )}

        <Button variant="outline" onClick={onNewInvoice} size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
          <FileText className={`w-3.5 h-3.5 text-${themeColor}-600`} /> {labels.new}
        </Button>

        <Button
          variant="outline" size="sm"
          className={`gap-1.5 text-xs h-9 rounded-lg shadow-sm ${isEditing ? `bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400` : ''}`}
          disabled={!isViewingExisting || isApproved}
          onClick={onToggleEdit}
        >
          <FileEdit className="w-3.5 h-3.5" />
          {isEditing ? labels.cancelEdit : labels.edit}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled={!isViewingExisting || isApproved} onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" /> {labels.delete}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm" disabled={!isViewingExisting || isApproved} onClick={onApprove}>
          <CheckCircle className="w-3.5 h-3.5" /> {labels.accounting}
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={() => { searchBarRef.current?.scrollIntoView({ behavior: 'smooth' }); const input = searchBarRef.current?.querySelector('input'); if (input) setTimeout(() => input.focus(), 300); }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground" /> {labels.search}
        </Button>

        <Button variant="outline" size="sm" className={`gap-1.5 text-xs h-9 rounded-lg bg-${themeColor}-50 dark:bg-${themeColor}-900/20 border-${themeColor}-200 dark:border-${themeColor}-800 shadow-sm`} disabled={!isViewingExisting} onClick={onPrint}>
          <Printer className={`w-3.5 h-3.5 text-${themeColor}-600`} /> {labels.print}
        </Button>

        {moreItems && moreItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm">
                {labels.more} <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {moreItems.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.onClick} disabled={item.disabled} className={item.className}>
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="outline" onClick={onClose} size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm">
          <X className="w-3.5 h-3.5" /> {labels.close}
        </Button>
      </div>
    </div>
  );
}
