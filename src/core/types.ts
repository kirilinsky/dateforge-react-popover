import type * as React from "react";

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";
export type PopoverState = "open" | "closed";
export type PopoverRole =
  | "dialog"
  | "menu"
  | "listbox"
  | "tooltip"
  | "presentation";

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  modal?: boolean;
  disabled?: boolean;

  closeOnEscape?: boolean;
  closeOnOutsidePress?: boolean;
  closeOnFocusOutside?: boolean;

  children: React.ReactNode;
};

export type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
  modal: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnFocusOutside: boolean;

  triggerId: string;
  contentId: string;

  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLElement | null>;
  onEscapeKeyDownRef: React.MutableRefObject<
    ((event: KeyboardEvent) => void) | undefined
  >;
  onInteractOutsideRef: React.MutableRefObject<
    ((event: Event) => void) | undefined
  >;
  onCloseAutoFocusRef: React.MutableRefObject<
    ((event: Event) => void) | undefined
  >;
};
