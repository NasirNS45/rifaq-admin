import { Button } from "@/components/ui/button";
import type { SaveIntent } from "@/hooks/useSaveIntent";
import { cn } from "@/lib/utils";

type FormSaveActionsProps = {
  isNew: boolean;
  primaryLabel: string;
  isPending: boolean;
  pendingIntent: SaveIntent | null;
  onPrimaryClick: () => void;
  onSaveAndNewClick: () => void;
  className?: string;
};

export function FormSaveActions({
  isNew,
  primaryLabel,
  isPending,
  pendingIntent,
  onPrimaryClick,
  onSaveAndNewClick,
  className,
}: FormSaveActionsProps) {
  const secondaryLabel = isNew ? "Save & add another" : "Save & add new";

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Button
        type="submit"
        pending={isPending && pendingIntent === "save"}
        onClick={onPrimaryClick}
      >
        {isPending && pendingIntent === "save" ? "Saving" : primaryLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        pending={isPending && pendingIntent === "saveAndNew"}
        disabled={isPending}
        onClick={onSaveAndNewClick}
      >
        {isPending && pendingIntent === "saveAndNew" ? "Saving" : secondaryLabel}
      </Button>
    </div>
  );
}
