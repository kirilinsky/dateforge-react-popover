import * as React from "react";
import type { PopoverContextValue } from "./types";

export const PopoverContext = React.createContext<PopoverContextValue | null>(
  null,
);

export function usePopoverContext(component: string): PopoverContextValue {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <Popover>.`);
  }
  return ctx;
}
