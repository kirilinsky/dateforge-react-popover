import * as React from "react";

export function useFocusOutside(
  enabled: boolean,
  refs: React.RefObject<HTMLElement | null>[],
  onOutside: (event: FocusEvent) => void,
): void {
  const onOutsideRef = React.useRef(onOutside);
  React.useEffect(() => {
    onOutsideRef.current = onOutside;
  });

  React.useEffect(() => {
    if (!enabled) return;
    const handler = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      for (const ref of refs) {
        const el = ref.current;
        if (el && el.contains(target)) return;
      }
      onOutsideRef.current(event);
    };
    document.addEventListener("focusin", handler, true);
    return () => document.removeEventListener("focusin", handler, true);
  }, [enabled, refs]);
}
