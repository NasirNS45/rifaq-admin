import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/useTheme";

/** Elegant stand-in when a catalog image is missing or fails to load. */
export function ProductImageFallback({
  className,
  label = "Image coming soon",
}: {
  className?: string;
  label?: string;
}) {
  const { resolved } = useTheme();
  return (
    <span
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-surface-sunken px-2 text-center",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <BrandMark className="h-7 w-7 opacity-70" dark={resolved === "dark"} />
      <span className="text-2xs font-medium tracking-[0.2em] text-foreground uppercase">RIFAQ ATELIER</span>
    </span>
  );
}
