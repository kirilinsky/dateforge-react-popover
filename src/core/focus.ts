const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.hidden) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    return element.tabIndex >= 0;
  });
}

export function focusFirst(container: HTMLElement): void {
  const [first] = getFocusableElements(container);
  (first ?? container).focus();
}

export function createCancelableFocusEvent(type: string): Event {
  return new Event(type, { cancelable: true });
}
