type SeoTextGuidanceProps = {
  value: string;
  kind: "title" | "description";
};

export function SeoTextGuidance({ value, kind }: SeoTextGuidanceProps) {
  const max = kind === "title" ? 60 : 160;
  const min = kind === "title" ? 50 : 150;
  const length = value.trim().length;
  const overLimit = length > max;
  const status = overLimit
    ? `Shorten by ${length - max} characters`
    : length < min
      ? `Add ${min - length} characters for the suggested range`
      : "Within the suggested range";

  return (
    <p
      aria-live="polite"
      className={`flex justify-between gap-2 text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
    >
      <span>{status}</span>
      <span>
        {length}/{max}
      </span>
    </p>
  );
}
