import * as React from "react";
import { usePopoverContext } from "@/context";
import { composeRefs } from "../../core/compose-refs";

export type PopoverTriggerProps = {
  asChild?: boolean;
  children: React.ReactElement;
};

export function PopoverTrigger(
  props: PopoverTriggerProps,
): React.ReactElement {
  const { asChild = false, children } = props;
  const ctx = usePopoverContext("PopoverTrigger");

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown> & { ref?: React.Ref<HTMLElement> }
  >;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    const original = child.props.onClick as
      | ((e: React.MouseEvent<HTMLElement>) => void)
      | undefined;
    original?.(event);
    if (event.defaultPrevented) return;
    if (ctx.disabled) return;
    ctx.setOpen(!ctx.open);
  };

  const mergedProps: Record<string, unknown> = {
    ...child.props,
    id: ctx.triggerId,
    "aria-haspopup": "dialog",
    "aria-expanded": ctx.open,
    "aria-controls": ctx.open ? ctx.contentId : undefined,
    "data-state": ctx.open ? "open" : "closed",
    "data-df-popover-trigger": "",
    onClick: handleClick,
    ref: composeRefs(
      (child as unknown as { ref?: React.Ref<HTMLElement> }).ref,
      (node: HTMLElement | null) => {
        ctx.triggerRef.current = node;
      },
    ),
  };

  if (asChild) {
    return React.cloneElement(child, mergedProps);
  }

  return (
    <button type="button" {...(mergedProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {child}
    </button>
  );
}
