import * as React from "react";
import { cn } from "@/lib/utils";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-10 w-full rounded-none border border-input bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));
NativeSelect.displayName = "NativeSelect";
