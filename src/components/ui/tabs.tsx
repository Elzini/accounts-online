import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs(props: React.PropsWithChildren<React.ComponentPropsWithRef<typeof TabsPrimitive.Root> & { className?: string }>) {
  const { className, ...rest } = props;
  return <TabsPrimitive.Root className={className} {...rest as any} />;
}

function TabsList(props: React.PropsWithChildren<{ className?: string; [key: string]: any }>) {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...rest as any}
    />
  );
}

function TabsTrigger(props: React.PropsWithChildren<{ className?: string; value: string; [key: string]: any }>) {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest as any}
    />
  );
}

function TabsContent(props: React.PropsWithChildren<{ className?: string; value: string; [key: string]: any }>) {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...rest as any}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
