import * as React from "react";
import { PopoverContext } from "./context";
import { useControllableState } from "./use-controllable-state";
import { useEscapeKey } from "./use-escape-key";
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

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      setOpenState(next);
    },
    [disabled, setOpenState],
  );

  useEscapeKey(open && closeOnEscape, () => {
    setOpen(false);
    triggerRef.current?.focus();
  });

  useOutsidePress(
    open && closeOnOutsidePress,
    [triggerRef, contentRef],
    () => setOpen(false),
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
    ],
  );

  return (
    <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
  );
}
