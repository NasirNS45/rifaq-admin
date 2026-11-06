import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { FrameSpinner } from "@/components/loading";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-[transform,opacity,colors] motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-offset-background",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 ring-offset-background focus-visible:ring-offset-background",
        outline: "border border-input bg-card ring-offset-background hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground ring-offset-background hover:bg-secondary/80",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 px-4 py-2 sm:h-10 sm:min-h-10",
        sm: "h-9 min-h-9 px-3 text-xs sm:h-8 sm:min-h-8",
        lg: "h-12 min-h-12 px-8 sm:h-11 sm:min-h-11",
        icon: "h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  pending?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, pending = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {pending ? <FrameSpinner /> : null}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
