import * as React from "react";
import { usePopoverContext } from "@/context";

export type PopoverCloseProps = {
  asChild?: boolean;
  children: React.ReactElement;
};

export function PopoverClose(props: PopoverCloseProps): React.ReactElement {
  const { asChild = false, children } = props;
  const ctx = usePopoverContext("PopoverClose");

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  >;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    const original = child.props.onClick as
      | ((e: React.MouseEvent<HTMLElement>) => void)
      | undefined;
    original?.(event);
    if (event.defaultPrevented) return;
    ctx.setOpen(false);
  };

  const merged: Record<string, unknown> = {
    ...child.props,
    "data-df-popover-close": "",
    onClick: handleClick,
  };

  if (asChild) return React.cloneElement(child, merged);

  return (
    <button
      type="button"
      {...(merged as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {child}
    </button>
  );
}
