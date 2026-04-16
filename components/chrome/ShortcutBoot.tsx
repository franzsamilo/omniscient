"use client";

/**
 * Global keyboard shortcuts (CLAUDE.md §6.H).
 * Mounts once at the root.
 */

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { useUi } from "@/lib/stores/useUi";
import { play } from "@/lib/sound";

export function ShortcutBoot() {
  const router = useRouter();
  const pathname = usePathname();
  const togglePalette = useUi((s) => s.togglePalette);
  const setPalette = useUi((s) => s.setPalette);
  const togglePresenter = useUi((s) => s.togglePresenter);
  const toggleMute = useUi((s) => s.toggleMute);
  const setShortcutCheat = useUi((s) => s.setShortcutCheat);

  // Sequential "G + <X>" navigation.
  const seqRef = useRef<{ key: string | null; ts: number }>({ key: null, ts: 0 });

  // ⌘K / Ctrl+K
  useHotkeys(
    "meta+k, ctrl+k",
    (e) => {
      e.preventDefault();
      togglePalette();
      play("tick-on");
    },
    { enableOnFormTags: true },
    [togglePalette],
  );

  // Esc closes palette + cheat
  useHotkeys(
    "esc",
    () => {
      setPalette(false);
      setShortcutCheat(false);
    },
    { enableOnFormTags: true },
    [setPalette, setShortcutCheat],
  );

  // Period → toggle mute
  useHotkeys(
    ".",
    () => {
      toggleMute();
    },
    [],
  );

  // Presenter mode toggle
  useHotkeys("p", () => togglePresenter(), [togglePresenter]);

  // Shortcut cheat sheet
  useHotkeys("shift+slash", () => setShortcutCheat(true), [setShortcutCheat]);

  // M — toggle PLAN/SPATIAL on /map (broadcasted via custom event)
  useHotkeys(
    "m",
    () => {
      if (!pathname.startsWith("/map")) return;
      window.dispatchEvent(new CustomEvent("omni:map:toggle-mode"));
      play("whoosh");
    },
    [pathname],
  );

  // L — cycle layers on /map
  useHotkeys(
    "l",
    () => {
      if (!pathname.startsWith("/map")) return;
      window.dispatchEvent(new CustomEvent("omni:map:cycle-layer"));
      play("tick-on");
    },
    [pathname],
  );

  // G + <key> sequential nav.
  useEffect(() => {
    const ROUTE_MAP: Record<string, string> = {
      o: "/overview",
      m: "/map",
      p: "/power",
      c: "/controls",
      a: "/activity",
      s: "/safety",
      i: "/ai",
      t: "/maintenance",
      u: "/security",
      ",": "/settings",
    };
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const now = performance.now();
      if (e.key.toLowerCase() === "g") {
        seqRef.current = { key: "g", ts: now };
        return;
      }
      if (seqRef.current.key === "g" && now - seqRef.current.ts < 1500) {
        const path = ROUTE_MAP[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
          play("whoosh");
        }
        seqRef.current = { key: null, ts: 0 };
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
