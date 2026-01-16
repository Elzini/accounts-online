// Car status utilities

export type CarStatus = 'available' | 'sold' | 'transferred';

export const getCarStatusLabel = (status: string): string => {
  switch (status) {
    case 'available':
      return 'متاحة';
    case 'sold':
      return 'مباعة';
    case 'transferred':
      return 'محولة';
    default:
      return status;
  }
};

export const getCarStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-success hover:bg-success/90';
    case 'sold':
      return 'bg-muted';
    case 'transferred':
      return 'bg-orange-500 hover:bg-orange-600';
    default:
      return '';
  }
};

export const getCarStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'available':
      return 'default';
    case 'sold':
      return 'secondary';
    case 'transferred':
      return 'default';
    default:
      return 'outline';
  }
};
