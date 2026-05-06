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
import type { PopoverAlign, PopoverRole, PopoverSide } from "@/context";

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
    const {
      side = "bottom",
      align = "center",
      sideOffset = 8,
      alignOffset = 0,
      collisionPadding = 8,
      avoidCollisions = true,
      matchTriggerWidth = false,
      role = "dialog",
      style,
      className,
      children,
    } = props;

    const ctx = usePopoverContext("PopoverContent");

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

    if (!ctx.open) return null;

    const [resolvedSide, resolvedAlign = "center"] = placement.split("-") as [
      PopoverSide,
      PopoverAlign | undefined,
    ];

    const setRefs = composeRefs<HTMLDivElement>(
      forwardedRef,
      (node) => {
        ctx.contentRef.current = node;
        refs.setFloating(node);
      },
    );

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
      >
        {children}
      </div>
    );
  },
);
