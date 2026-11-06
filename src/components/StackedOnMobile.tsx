import type { ReactNode } from "react";

export function StackedOnMobile({
  table,
  stack,
}: {
  table: ReactNode;
  stack: ReactNode;
}) {
  return (
    <>
      <div className="hidden md:block">{table}</div>
      <div className="space-y-3 md:hidden">{stack}</div>
    </>
  );
}
