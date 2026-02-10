import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md transition-all hover:border-primary/20",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, icon, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 px-1", className)}>
      <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function MobileCardHeader({ title, subtitle, badge, actions }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
