"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type UiState = {
  paletteOpen: boolean;
  presenter: boolean;
  muted: boolean;
  shortcutCheatOpen: boolean;
  setPalette: (v: boolean) => void;
  togglePalette: () => void;
  togglePresenter: () => void;
  toggleMute: () => void;
  setShortcutCheat: (v: boolean) => void;
};

export const useUi = create<UiState>()(
  subscribeWithSelector((set) => ({
    paletteOpen: false,
    presenter: false,
    muted: true,
    shortcutCheatOpen: false,
    setPalette: (v) => set({ paletteOpen: v }),
    togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
    togglePresenter: () => set((s) => ({ presenter: !s.presenter })),
    toggleMute: () => set((s) => ({ muted: !s.muted })),
    setShortcutCheat: (v) => set({ shortcutCheatOpen: v }),
  })),
);
