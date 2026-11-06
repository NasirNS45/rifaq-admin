import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const slideIn =
  "data-[state=open]:motion-safe:animate-[rifaq-sheet-in-left_200ms_ease-out] data-[state=closed]:motion-safe:animate-[rifaq-sheet-out-left_200ms_ease-in_forwards]";
const slideInBottom =
  "data-[state=open]:motion-safe:animate-[rifaq-sheet-in-bottom_200ms_ease-out] data-[state=closed]:motion-safe:animate-[rifaq-sheet-out-bottom_200ms_ease-in_forwards]";

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "left" | "bottom";
  }
>(({ className, children, side = "left", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-foreground/40 data-[state=closed]:motion-safe:animate-[rifaq-overlay-out_150ms_ease-out_forwards] data-[state=open]:motion-safe:animate-[rifaq-overlay-in_150ms_ease-out]",
      )}
    />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 border-border bg-card p-4",
        side === "left" &&
          "inset-y-0 left-0 h-full w-72 border-r motion-safe:will-change-transform",
        side === "bottom" &&
          "inset-x-0 bottom-0 max-h-[85dvh] w-full overflow-y-auto border-t motion-safe:will-change-transform",
        side === "left" ? slideIn : slideInBottom,
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-2 top-2 touch-target cursor-pointer rounded-none opacity-70 after:absolute after:-inset-3 after:content-[''] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1", className)} {...props} />
);

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("font-display text-lg leading-none tracking-wide text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
