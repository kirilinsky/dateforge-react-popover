import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "../index";

function mockViewport(width: number, height: number) {
  const element = document.documentElement;
  const elementWidth = Object.getOwnPropertyDescriptor(element, "clientWidth");
  const elementHeight = Object.getOwnPropertyDescriptor(element, "clientHeight");
  const windowWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");
  const windowHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");

  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });

  return () => {
    if (elementWidth) Object.defineProperty(element, "clientWidth", elementWidth);
    else delete (element as unknown as Record<string, unknown>).clientWidth;

    if (elementHeight) Object.defineProperty(element, "clientHeight", elementHeight);
    else delete (element as unknown as Record<string, unknown>).clientHeight;

    if (windowWidth) Object.defineProperty(window, "innerWidth", windowWidth);
    else delete (window as unknown as Record<string, unknown>).innerWidth;

    if (windowHeight) Object.defineProperty(window, "innerHeight", windowHeight);
    else delete (window as unknown as Record<string, unknown>).innerHeight;
  };
}

describe("Popover", () => {
  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("sets trigger aria state and controls only while open", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");

    await user.click(trigger);
    const content = screen.getByRole("dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", content.id);
  });

  it("closes on second trigger click", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Body")).toBeInTheDocument();

    await user.click(screen.getByText("Open"));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open");
    await user.click(trigger);
    expect(screen.getByText("Body")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on outside click", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>Body</PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Body")).toBeInTheDocument();

    await user.click(screen.getByText("Outside"));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger after outside click", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>Body</PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    const trigger = screen.getByText("Open");
    await user.click(trigger);
    expect(screen.getByText("Body")).toBeInTheDocument();

    await user.click(screen.getByText("Outside"));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("does not close on inside click", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Inside")).toBeInTheDocument();

    await user.click(screen.getByText("Inside"));
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("renders open with defaultOpen", () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Popover disabled>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("follows controlled open prop", () => {
    const { rerender } = render(
      <Popover open={false}>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Body")).not.toBeInTheDocument();

    rerender(
      <Popover open>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("calls onOpenChange with the next open value", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    await user.click(screen.getByText("Open"));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it("lets onEscapeKeyDown prevent Escape close", async () => {
    const user = userEvent.setup();
    const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => {
      event.preventDefault();
    });
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent onEscapeKeyDown={onEscapeKeyDown}>Body</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    await user.keyboard("{Escape}");

    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("lets onInteractOutside prevent outside close", async () => {
    const user = userEvent.setup();
    const onInteractOutside = vi.fn((event: Event) => {
      event.preventDefault();
    });
    render(
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent onInteractOutside={onInteractOutside}>
            Body
          </PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByText("Open"));
    await user.click(screen.getByText("Outside"));

    expect(onInteractOutside).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("closes on focus outside when enabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover closeOnFocusOutside defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>
            <button type="button">Inside</button>
          </PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    const trigger = screen.getByText("Open");
    await user.click(screen.getByText("Inside"));
    expect(screen.getByText("Inside")).toHaveFocus();

    await user.tab();
    expect(screen.queryByText("Inside")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not trap focus when non-modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>
            <button type="button">Inside</button>
          </PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    screen.getByText("Open").focus();
    await user.tab();
    expect(screen.getByText("Inside")).toHaveFocus();

    await user.tab();
    expect(screen.getByText("Outside")).toHaveFocus();
  });

  it("auto focuses the first focusable content element on open", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));
    await waitFor(() => {
      expect(screen.getByText("Inside")).toHaveFocus();
    });
  });

  it("lets onOpenAutoFocus prevent initial content focus", async () => {
    const user = userEvent.setup();
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
    });
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent onOpenAutoFocus={onOpenAutoFocus}>
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open");
    await user.click(trigger);

    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("lets onCloseAutoFocus prevent focus returning to the trigger", async () => {
    const user = userEvent.setup();
    const onCloseAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
    });
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent onCloseAutoFocus={onCloseAutoFocus}>
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Inside")).not.toBeInTheDocument();
    expect(trigger).not.toHaveFocus();
  });

  it("traps tab focus when modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover modal defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>
            <button type="button">First</button>
            <button type="button">Second</button>
          </PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("First")).toHaveFocus();
    });

    await user.tab();
    expect(screen.getByText("Second")).toHaveFocus();

    await user.tab();
    expect(screen.getByText("First")).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByText("Second")).toHaveFocus();
  });

  it.each([
    ["top", "start"],
    ["top", "center"],
    ["top", "end"],
    ["right", "start"],
    ["right", "center"],
    ["right", "end"],
    ["bottom", "start"],
    ["bottom", "center"],
    ["bottom", "end"],
    ["left", "start"],
    ["left", "center"],
    ["left", "end"],
  ] as const)("sets data-side and data-align for %s/%s", (side, align) => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent side={side} align={align}>
          Body
        </PopoverContent>
      </Popover>,
    );

    const content = screen.getByRole("dialog");
    expect(content).toHaveAttribute("data-side", side);
    expect(content).toHaveAttribute("data-align", align);
  });

  it("applies sideOffset and alignOffset to floating position", async () => {
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(this: Element) {
        if (this.textContent?.includes("Open")) {
          return new DOMRect(20, 30, 100, 40);
        }
        if (this instanceof HTMLElement && this.dataset.dfPopoverContent !== undefined) {
          return new DOMRect(0, 0, 80, 30);
        }
        return new DOMRect();
      });

    try {
      render(
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            alignOffset={6}
            avoidCollisions={false}
            side="bottom"
            sideOffset={12}
          >
            Body
          </PopoverContent>
        </Popover>,
      );

      const content = screen.getByRole("dialog");
      await waitFor(() => {
        expect(content).toHaveStyle({ transform: "translate(6px, 52px)" });
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("matches trigger width when matchTriggerWidth is enabled", async () => {
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(this: Element) {
        if (this.textContent?.includes("Open")) {
          return new DOMRect(0, 0, 144, 32);
        }
        if (this instanceof HTMLElement && this.dataset.dfPopoverContent !== undefined) {
          return new DOMRect(0, 0, 80, 24);
        }
        return new DOMRect();
      });

    try {
      render(
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent matchTriggerWidth>Body</PopoverContent>
        </Popover>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveStyle({ minWidth: "144px" });
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("flips away from viewport collisions when avoidCollisions is enabled", async () => {
    const restoreViewport = mockViewport(1024, 768);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockImplementation(function offsetWidth(this: HTMLElement) {
        if (this.dataset.dfPopoverContent !== undefined) return 120;
        if (this instanceof HTMLButtonElement) return 100;
        return 0;
      });
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function offsetHeight(this: HTMLElement) {
        if (this.dataset.dfPopoverContent !== undefined) return 40;
        if (this instanceof HTMLButtonElement) return 24;
        return 0;
      });
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(this: Element) {
        if (this instanceof HTMLButtonElement && this.textContent?.includes("Open")) {
          return new DOMRect(200, 740, 100, 24);
        }
        if (this instanceof HTMLElement && this.dataset.dfPopoverContent !== undefined) {
          return new DOMRect(0, 0, 120, 40);
        }
        return new DOMRect();
      });

    try {
      render(
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent
            collisionPadding={8}
            side="bottom"
            sideOffset={8}
          >
            Body
          </PopoverContent>
        </Popover>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "top");
      });
    } finally {
      rectSpy.mockRestore();
      offsetHeightSpy.mockRestore();
      offsetWidthSpy.mockRestore();
      restoreViewport();
    }
  });

  it("shifts inside the viewport when aligned content would overflow", async () => {
    const restoreViewport = mockViewport(1024, 768);
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, "offsetWidth", "get")
      .mockImplementation(function offsetWidth(this: HTMLElement) {
        if (this.dataset.dfPopoverContent !== undefined) return 80;
        if (this instanceof HTMLButtonElement) return 20;
        return 0;
      });
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function offsetHeight(this: HTMLElement) {
        if (this.dataset.dfPopoverContent !== undefined) return 32;
        if (this instanceof HTMLButtonElement) return 24;
        return 0;
      });
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(this: Element) {
        if (this instanceof HTMLButtonElement && this.textContent?.includes("Open")) {
          return new DOMRect(990, 20, 20, 24);
        }
        if (this instanceof HTMLElement && this.dataset.dfPopoverContent !== undefined) {
          return new DOMRect(0, 0, 80, 32);
        }
        return new DOMRect();
      });

    try {
      render(
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            collisionPadding={8}
            side="bottom"
            sideOffset={8}
          >
            Body
          </PopoverContent>
        </Popover>,
      );

      const content = screen.getByRole("dialog");
      await waitFor(() => {
        expect(content).toHaveStyle({ transform: "translate(936px, 52px)" });
      });
    } finally {
      rectSpy.mockRestore();
      offsetHeightSpy.mockRestore();
      offsetWidthSpy.mockRestore();
      restoreViewport();
    }
  });

  it("renders portal content in document.body by default", async () => {
    const { container } = render(
      <div>
        <PopoverPortal>
          <div>Portal body</div>
        </PopoverPortal>
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByText("Portal body")).toBeInTheDocument();
    });
    expect(document.body).toContainElement(screen.getByText("Portal body"));
    expect(container).not.toContainElement(screen.getByText("Portal body"));
  });

  it("renders portal content in a custom container", async () => {
    const target = document.createElement("div");
    document.body.append(target);

    render(
      <PopoverPortal container={target}>
        <div>Portal custom</div>
      </PopoverPortal>,
    );

    await waitFor(() => {
      expect(screen.getByText("Portal custom")).toBeInTheDocument();
    });
    expect(target).toContainElement(screen.getByText("Portal custom"));
    target.remove();
  });

  it("renders portal content inline when disabled", () => {
    const { container } = render(
      <div>
        <PopoverPortal disabled>
          <div>Portal inline</div>
        </PopoverPortal>
      </div>,
    );

    expect(container).toContainElement(screen.getByText("Portal inline"));
  });

  it("does not crash during server render with portal", () => {
    expect(() =>
      renderToString(
        <PopoverPortal>
          <div>Portal SSR</div>
        </PopoverPortal>,
      ),
    ).not.toThrow();
  });

  it("does not crash during server render with popover", () => {
    expect(() =>
      renderToString(
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverContent>Body</PopoverContent>
        </Popover>,
      ),
    ).not.toThrow();
  });

  it("renders deterministic defaultOpen markup on the server", () => {
    const html = renderToString(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    expect(html).toContain("Body");
    expect(html).not.toMatch(/undefined|NaN|Invalid Date/);
  });

  it("hydrates basic defaultOpen markup without mismatch warnings", async () => {
    const element = (
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let root: Root | undefined;

    try {
      root = hydrateRoot(container, element);
      await waitFor(() => {
        const messages = consoleError.mock.calls.flat().join("\n");
        expect(messages).not.toMatch(
          /Hydration failed|did not match|Text content does not match/,
        );
      });
    } finally {
      root?.unmount();
      consoleError.mockRestore();
      container.remove();
    }
  });
});
