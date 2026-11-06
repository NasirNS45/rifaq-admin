import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

function mergeParams<T extends Record<string, string>>(defaults: T, params: URLSearchParams): T {
  const out = { ...defaults };
  (Object.keys(defaults) as (keyof T & string)[]).forEach((key) => {
    const raw = params.get(key);
    if (raw !== null) {
      (out as Record<string, string>)[key] = raw;
    }
  });
  return out;
}

/**
 * URL-synced filter state. Pass a stable `defaults` object (module scope or useMemo).
 */
export function useListFilters<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => mergeParams(defaults, params), [defaults, params]);

  const set = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch) as [keyof T & string, string | undefined][]) {
            if (v === undefined || v === "") {
              next.delete(k);
            } else {
              next.set(k, String(v));
            }
          }
          next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const setPage = useCallback(
    (page: number) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (page <= 1) next.delete("page");
          else next.set("page", String(page));
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  return { values, set, clear, page, setPage };
}
