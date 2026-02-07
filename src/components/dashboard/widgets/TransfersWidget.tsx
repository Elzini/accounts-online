import { Car, ArrowDownLeft, ArrowUpRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';
import { CarTransfer } from '@/services/transfers';

interface TransfersWidgetProps {
  transfers: CarTransfer[];
  setActivePage: (page: ActivePage) => void;
}

export function TransfersWidget({ transfers, setActivePage }: TransfersWidgetProps) {
  const incomingCars = transfers?.filter(t => t.transfer_type === 'incoming' && t.status === 'pending') || [];
  const outgoingCars = transfers?.filter(t => t.transfer_type === 'outgoing' && t.status === 'pending') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
      {/* Incoming Cars */}
      <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground flex items-center gap-1.5 sm:gap-2">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              السيارات الواردة من المعارض
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              <span className="font-semibold text-primary">{incomingCars.length}</span> سيارة قيد الانتظار
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActivePage('car-transfers')}
            className="text-primary h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          >
            عرض الكل
          </Button>
        </div>
        {incomingCars.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">لا توجد سيارات واردة قيد الانتظار</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {incomingCars.map((car) => (
              <div 
                key={car.id} 
                className="p-2.5 sm:p-3 bg-primary/5 dark:bg-primary/10 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer transition-colors"
                onClick={() => setActivePage('car-transfers')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">{car.car?.name} {car.car?.model}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">شاسيه: {car.car?.chassis_number}</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-[10px] sm:text-xs font-medium text-primary truncate max-w-[80px] sm:max-w-none">{car.partner_dealership?.name}</p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs h-5">قيد الانتظار</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Cars */}
      <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground flex items-center gap-1.5 sm:gap-2">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              السيارات الصادرة للمعارض
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              <span className="font-semibold text-warning">{outgoingCars.length}</span> سيارة قيد الانتظار
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActivePage('car-transfers')}
            className="text-primary h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          >
            عرض الكل
          </Button>
        </div>
        {outgoingCars.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">لا توجد سيارات صادرة قيد الانتظار</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {outgoingCars.map((car) => (
              <div 
                key={car.id} 
                className="p-2.5 sm:p-3 bg-warning/5 dark:bg-warning/10 rounded-lg hover:bg-warning/10 dark:hover:bg-warning/20 cursor-pointer transition-colors"
                onClick={() => setActivePage('car-transfers')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">{car.car?.name} {car.car?.model}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">شاسيه: {car.car?.chassis_number}</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-[10px] sm:text-xs font-medium text-warning truncate max-w-[80px] sm:max-w-none">{car.partner_dealership?.name}</p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs h-5">قيد الانتظار</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
