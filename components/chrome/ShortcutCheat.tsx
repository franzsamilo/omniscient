"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useUi } from "@/lib/stores/useUi";
import { Card } from "@/components/primitives/Card";

const SHORTCUTS = [
  { keys: "⌘ K", label: "Command palette" },
  { keys: "G O", label: "Go to overview" },
  { keys: "G M", label: "Go to map" },
  { keys: "G P", label: "Go to power" },
  { keys: "G S", label: "Go to safety" },
  { keys: "G C", label: "Go to controls" },
  { keys: "G I", label: "Go to AI" },
  { keys: "M", label: "Toggle PLAN / SPATIAL on /map" },
  { keys: "L", label: "Cycle map layers" },
  { keys: ".", label: "Toggle mute" },
  { keys: "P", label: "Toggle presenter mode" },
  { keys: "?", label: "Show this cheat sheet" },
  { keys: "Esc", label: "Close any modal" },
];

export function ShortcutCheat() {
  const open = useUi((s) => s.shortcutCheatOpen);
  const setOpen = useUi((s) => s.setShortcutCheat);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2"
              >
                <Card surface={1} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--color-border)" }}>
                    <Dialog.Title className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                      Keyboard shortcuts
                    </Dialog.Title>
                    <Dialog.Close className="rounded-full p-1.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)]">
                      <X size={16} strokeWidth={1.6} />
                    </Dialog.Close>
                  </div>
                  <ul className="px-5 py-4">
                    {SHORTCUTS.map((s) => (
                      <li
                        key={s.keys}
                        className="flex items-center justify-between border-b border-[var(--color-border)] py-2 text-[12px] last:border-b-0"
                      >
                        <span className="text-[var(--color-fg)]">{s.label}</span>
                        <kbd className="rounded border border-[var(--color-border-strong)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
                          {s.keys}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
