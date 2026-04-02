// Fix for Radix UI v1.1.x type compatibility
// These versions export types that don't include standard HTML attributes
// This declaration adds them back for all Radix primitives used in the project

declare module "@radix-ui/react-dialog" {
  export interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
}

declare module "@radix-ui/react-alert-dialog" {
  export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
  export interface AlertDialogCancelProps extends React.HTMLAttributes<HTMLButtonElement> {}
  export interface AlertDialogActionProps extends React.HTMLAttributes<HTMLButtonElement> {}
}

declare module "@radix-ui/react-dropdown-menu" {
  export interface DropdownMenuTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}
}

declare module "@radix-ui/react-tooltip" {
  export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
}

declare module "@radix-ui/react-label" {
  export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
}

declare module "@radix-ui/react-radio-group" {
  export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    onValueChange?: (value: string) => void;
  }
  export interface RadioGroupItemProps extends React.HTMLAttributes<HTMLButtonElement> {
    value: string;
  }
}

declare module "@radix-ui/react-scroll-area" {
  export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}
}

declare module "@radix-ui/react-tabs" {
  export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }
  export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
  export interface TabsTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    value: string;
  }
  export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
  }
}

declare module "@radix-ui/react-select" {
  export interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
  }
  export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    placeholder?: string;
  }
}

declare module "@radix-ui/react-checkbox" {
  export interface CheckboxProps extends React.HTMLAttributes<HTMLButtonElement> {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean | "indeterminate") => void;
  }
}

declare module "@radix-ui/react-switch" {
  export interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
}

declare module "@radix-ui/react-popover" {
  export interface PopoverTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
    sideOffset?: number;
  }
}

declare module "@radix-ui/react-accordion" {
  export interface AccordionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}
  export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
  }
}

declare module "@radix-ui/react-collapsible" {
  export interface CollapsibleTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}
}

declare module "@radix-ui/react-separator" {
  export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  }
}

declare module "@radix-ui/react-progress" {
  export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
  }
  export interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {}
}

declare module "@radix-ui/react-avatar" {
  export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {}
  export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}
  export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}
}

declare module "@radix-ui/react-slider" {
  export interface SliderProps extends React.HTMLAttributes<HTMLSpanElement> {
    value?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
  }
}
