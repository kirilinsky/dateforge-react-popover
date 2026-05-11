import "../../styles/base.css";
import * as React from "react";
import {
  useFloating,
  autoUpdate,
  offset as offsetMiddleware,
  flip,
  shift,
  size as sizeMiddleware,
} from "@floating-ui/react-dom";
import { usePopoverContext } from "@/context";
import { composeRefs } from "../../core/compose-refs";
import {
  createCancelableFocusEvent,
  focusFirst,
  getFocusableElements,
} from "../../core/focus";
import type {
  PopoverAlign,
  PopoverContextValue,
  PopoverRole,
  PopoverSide,
} from "@/context";

export type PopoverContentProps = {
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
  matchTriggerWidth?: boolean;

  role?: PopoverRole;

  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onInteractOutside?: (event: Event) => void;

  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
};

function toPlacement(side: PopoverSide, align: PopoverAlign) {
  if (align === "center") return side;
  return `${side}-${align}` as const;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(props, forwardedRef) {
    const ctx = usePopoverContext("PopoverContent");
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!ctx.open) return null;
    if (!mounted) {
      return (
        <PopoverContentStatic
          {...props}
          ctx={ctx}
          forwardedRef={forwardedRef}
        />
      );
    }

    return (
      <PopoverContentImpl {...props} ctx={ctx} forwardedRef={forwardedRef} />
    );
  },
);

function PopoverContentStatic(
  props: PopoverContentProps & {
    ctx: PopoverContextValue;
    forwardedRef: React.ForwardedRef<HTMLDivElement>;
  },
) {
  const {
    ctx,
    forwardedRef,
    side = "bottom",
    align = "center",
    role = "dialog",
    style,
    className,
    children,
  } = props;

  const setRefs = composeRefs<HTMLDivElement>(forwardedRef, (node) => {
    ctx.contentRef.current = node;
  });

  return (
    <div
      ref={setRefs}
      id={ctx.contentId}
      role={role}
      data-df-popover-content=""
      data-state={ctx.open ? "open" : "closed"}
      data-side={side}
      data-align={align}
      className={className}
      style={style}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

function PopoverContentImpl(
  props: PopoverContentProps & {
    ctx: PopoverContextValue;
    forwardedRef: React.ForwardedRef<HTMLDivElement>;
  },
) {
  const {
    ctx,
    forwardedRef,
    side = "bottom",
    align = "center",
    sideOffset = 8,
    alignOffset = 0,
    collisionPadding = 8,
    avoidCollisions = true,
    matchTriggerWidth = false,
    role = "dialog",
    onOpenAutoFocus,
    onCloseAutoFocus,
    onEscapeKeyDown,
    onInteractOutside,
    style,
    className,
    children,
  } = props;

  const middleware = [
    offsetMiddleware({ mainAxis: sideOffset, crossAxis: alignOffset }),
    avoidCollisions && flip({ padding: collisionPadding }),
    avoidCollisions && shift({ padding: collisionPadding }),
    matchTriggerWidth &&
      sizeMiddleware({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
  ].filter(Boolean) as NonNullable<Parameters<typeof useFloating>[0]>["middleware"];

  const { refs, floatingStyles, placement } = useFloating({
    open: ctx.open,
    placement: toPlacement(side, align),
    middleware,
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    refs.setReference(ctx.triggerRef.current);
  }, [refs, ctx.triggerRef]);

  React.useEffect(() => {
    ctx.onEscapeKeyDownRef.current = onEscapeKeyDown;
    return () => {
      if (ctx.onEscapeKeyDownRef.current === onEscapeKeyDown) {
        ctx.onEscapeKeyDownRef.current = undefined;
      }
    };
  }, [ctx.onEscapeKeyDownRef, onEscapeKeyDown]);

  React.useEffect(() => {
    ctx.onInteractOutsideRef.current = onInteractOutside;
    return () => {
      if (ctx.onInteractOutsideRef.current === onInteractOutside) {
        ctx.onInteractOutsideRef.current = undefined;
      }
    };
  }, [ctx.onInteractOutsideRef, onInteractOutside]);

  React.useEffect(() => {
    ctx.onCloseAutoFocusRef.current = onCloseAutoFocus;
    return () => {
      if (ctx.onCloseAutoFocusRef.current === onCloseAutoFocus) {
        ctx.onCloseAutoFocusRef.current = undefined;
      }
    };
  }, [ctx.onCloseAutoFocusRef, onCloseAutoFocus]);

  React.useEffect(() => {
    const content = ctx.contentRef.current;
    if (!content) return;

    const event = createCancelableFocusEvent("df.popover.openAutoFocus");
    onOpenAutoFocus?.(event);
    if (event.defaultPrevented) return;

    focusFirst(content);
  }, [ctx.contentRef, onOpenAutoFocus]);

  React.useEffect(() => {
    if (!ctx.modal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const content = ctx.contentRef.current;
      if (!content) return;

      const focusable = getFocusableElements(content);
      if (focusable.length === 0) {
        event.preventDefault();
        content.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !content.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last || !content.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ctx.contentRef, ctx.modal]);

  const [resolvedSide, resolvedAlign = "center"] = placement.split("-") as [
    PopoverSide,
    PopoverAlign | undefined,
  ];

  const setRefs = composeRefs<HTMLDivElement>(forwardedRef, (node) => {
    ctx.contentRef.current = node;
    refs.setFloating(node);
  });

  return (
    <div
      ref={setRefs}
      id={ctx.contentId}
      role={role}
      data-df-popover-content=""
      data-state={ctx.open ? "open" : "closed"}
      data-side={resolvedSide}
      data-align={resolvedAlign}
      className={className}
      style={{ ...floatingStyles, ...style }}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
