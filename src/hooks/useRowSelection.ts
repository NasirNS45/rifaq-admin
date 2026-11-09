import { useCallback, useEffect, useMemo, useState } from "react";

export function useRowSelection(pageIds: string[], resetKey: string) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [resetKey]);

  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (pageIds.length === 0) return prev;
      const every = pageIds.every((id) => prev.has(id));
      if (every) return new Set();
      return new Set(pageIds);
    });
  }, [pageIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectedIds = useMemo(() => [...selected], [selected]);

  return {
    selectedIds,
    selectedCount: selected.size,
    allSelected,
    someSelected,
    toggleAll,
    toggle,
    clear,
    isSelected: (id: string) => selected.has(id),
  };
}
