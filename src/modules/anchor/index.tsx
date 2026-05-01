import * as React from "react";
import { usePopoverContext } from "@/context";
import { composeRefs } from "../../core/compose-refs";

export type PopoverAnchorProps = {
  asChild?: boolean;
  children: React.ReactElement;
};

export function PopoverAnchor(props: PopoverAnchorProps): React.ReactElement {
  const { asChild = false, children } = props;
  const ctx = usePopoverContext("PopoverAnchor");

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown> & { ref?: React.Ref<HTMLElement> }
  >;

  const merged: Record<string, unknown> = {
    ...child.props,
    "data-df-popover-anchor": "",
    ref: composeRefs(
      (child as unknown as { ref?: React.Ref<HTMLElement> }).ref,
      (node: HTMLElement | null) => {
        ctx.triggerRef.current = node;
      },
    ),
  };

  if (asChild) return React.cloneElement(child, merged);

  return <div {...(merged as React.HTMLAttributes<HTMLDivElement>)}>{child}</div>;
}
