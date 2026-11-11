"use client";

import { useEffect, useId, useState, type RefObject } from "react";

/**
 * Shared behavior for the three-dot "more actions" popover used by the
 * movie/series (WatchReadContent) and comics/novels (ReadContent) detail
 * headers. Manages open state, outside-pointer dismissal, Escape-to-close,
 * and the popover's DOM id. The wrapper ref is created by the caller and
 * passed in so the returned object stays ref-free for react-hooks/refs.
 */
export function useMoreMenu(wrapperRef: RefObject<HTMLDivElement | null>) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current !== null &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, wrapperRef]);

  return {
    open,
    toggle: () => setOpen((current) => !current),
    close: () => setOpen(false),
    popoverId,
  };
}
