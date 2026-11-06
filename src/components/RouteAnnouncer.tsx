import { useEffect } from "react";
import { useLocation } from "react-router";

export function RouteAnnouncer() {
  const { pathname } = useLocation();

  return (
    <div role="status" aria-live="polite" aria-atomic className="sr-only">
      Navigated to {pathname}
    </div>
  );
}

export function RouteFocusMain() {
  const { pathname } = useLocation();

  useEffect(() => {
    const el = document.getElementById("main");
    if (el && document.activeElement !== el) {
      el.focus();
    }
  }, [pathname]);

  return null;
}
