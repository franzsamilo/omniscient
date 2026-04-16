"use client";

import { useEffect } from "react";
import { useUi } from "@/lib/stores/useUi";

/**
 * Presenter mode side-effects only — no visible pill (intentionally removed
 * per user feedback; the corner badge was noisy on every route). Pressing
 * `P` still toggles the cursor-auto-hide + animation-slowdown behaviors.
 */
export function PresenterIndicator() {
  const presenter = useUi((s) => s.presenter);

  // Auto-hide cursor after 2s of no movement when in presenter mode.
  useEffect(() => {
    if (!presenter) {
      document.body.style.cursor = "";
      return;
    }
    let timer: number | null = null;
    const showCursor = () => {
      document.body.style.cursor = "";
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        document.body.style.cursor = "none";
      }, 2000);
    };
    window.addEventListener("mousemove", showCursor);
    showCursor();
    return () => {
      window.removeEventListener("mousemove", showCursor);
      if (timer) window.clearTimeout(timer);
      document.body.style.cursor = "";
    };
  }, [presenter]);

  // Apply 0.85× animation speed via CSS variable.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--omni-anim-speed",
      presenter ? "0.85" : "1",
    );
  }, [presenter]);

  return null;
}
