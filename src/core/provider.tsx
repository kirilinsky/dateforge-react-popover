import * as React from "react";
import { PopoverContext } from "./context";
import { createCancelableFocusEvent } from "./focus";
import { useControllableState } from "./use-controllable-state";
import { useEscapeKey } from "./use-escape-key";
import { useFocusOutside } from "./use-focus-outside";
import { useOutsidePress } from "./use-outside-press";
import type { PopoverContextValue, PopoverProps } from "./types";

export function Popover(props: PopoverProps): React.ReactElement {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    modal = false,
    disabled = false,
    closeOnEscape = true,
    closeOnOutsidePress = true,
    closeOnFocusOutside = false,
    children,
  } = props;

  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const reactId = React.useId();
  const triggerId = `df-popover-trigger-${reactId}`;
  const contentId = `df-popover-content-${reactId}`;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const onEscapeKeyDownRef =
    React.useRef<(event: KeyboardEvent) => void>();
  const onInteractOutsideRef = React.useRef<(event: Event) => void>();
  const onCloseAutoFocusRef = React.useRef<(event: Event) => void>();

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      setOpenState(next);
    },
    [disabled, setOpenState],
  );

  const closeAndFocusTrigger = React.useCallback(
    (options?: { delayFocus?: boolean }) => {
      const focusEvent = createCancelableFocusEvent(
        "df.popover.closeAutoFocus",
      );
      onCloseAutoFocusRef.current?.(focusEvent);

      setOpen(false);
      if (focusEvent.defaultPrevented) return;

      const focusTrigger = () => {
        triggerRef.current?.focus();
      };

      if (options?.delayFocus) {
        window.setTimeout(focusTrigger, 0);
        return;
      }

      focusTrigger();
    },
    [setOpen],
  );

  useEscapeKey(open && closeOnEscape, (event) => {
    onEscapeKeyDownRef.current?.(event);
    if (event.defaultPrevented) return;

    closeAndFocusTrigger();
  });

  useOutsidePress(
    open && closeOnOutsidePress,
    [triggerRef, contentRef],
    (event) => {
      onInteractOutsideRef.current?.(event);
      if (event.defaultPrevented) return;

      closeAndFocusTrigger({ delayFocus: true });
    },
  );

  useFocusOutside(
    open && closeOnFocusOutside,
    [triggerRef, contentRef],
    (event) => {
      onInteractOutsideRef.current?.(event);
      if (event.defaultPrevented) return;

      closeAndFocusTrigger();
    },
  );

  const value = React.useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      disabled,
      modal,
      closeOnEscape,
      closeOnOutsidePress,
      closeOnFocusOutside,
      triggerId,
      contentId,
      triggerRef,
      contentRef,
      onEscapeKeyDownRef,
      onInteractOutsideRef,
      onCloseAutoFocusRef,
    }),
    [
      open,
      setOpen,
      disabled,
      modal,
      closeOnEscape,
      closeOnOutsidePress,
      closeOnFocusOutside,
      triggerId,
      contentId,
      closeAndFocusTrigger,
    ],
  );

  return (
    <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
  );
}
