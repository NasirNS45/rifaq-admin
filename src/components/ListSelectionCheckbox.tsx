import { Checkbox } from "@/components/ui/checkbox";

export function ListSelectAllCheckbox({
  allSelected,
  someSelected,
  onToggle,
  label = "Select all on this page",
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <Checkbox
      checked={allSelected ? true : someSelected ? "indeterminate" : false}
      onCheckedChange={() => onToggle()}
      aria-label={label}
    />
  );
}

export function ListRowCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return <Checkbox checked={checked} onCheckedChange={() => onToggle()} aria-label={label} />;
}
