import { useRef, useState } from "react";

export type SaveIntent = "save" | "saveAndNew";

export function useSaveIntent() {
  const intentRef = useRef<SaveIntent>("save");
  const [pendingIntent, setPendingIntent] = useState<SaveIntent | null>(null);

  function setIntent(intent: SaveIntent) {
    intentRef.current = intent;
  }

  function beginSubmit(intent: SaveIntent) {
    setIntent(intent);
    setPendingIntent(intent);
  }

  function consumeIntent(): SaveIntent {
    const intent = intentRef.current;
    intentRef.current = "save";
    setPendingIntent(null);
    return intent;
  }

  function clearPendingIntent() {
    setPendingIntent(null);
  }

  return { beginSubmit, consumeIntent, clearPendingIntent, pendingIntent };
}

export function focusFormField(fieldId: string) {
  requestAnimationFrame(() => {
    document.getElementById(fieldId)?.focus();
  });
}
