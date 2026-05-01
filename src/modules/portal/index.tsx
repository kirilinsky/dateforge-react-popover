import * as React from "react";
import { createPortal } from "react-dom";

export type PopoverPortalProps = {
  container?: HTMLElement | null;
  disabled?: boolean;
  children: React.ReactNode;
};

export function PopoverPortal(props: PopoverPortalProps): React.ReactNode {
  const { container, disabled = false, children } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (disabled) return <>{children}</>;
  if (!mounted) return null;

  const target = container ?? document.body;
  return createPortal(children, target);
}
