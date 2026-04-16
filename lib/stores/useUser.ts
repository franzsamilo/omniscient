"use client";

import { create } from "zustand";

type Role = "admin" | "engineer" | "facilities" | "viewer";

type UserState = {
  name: string;
  role: Role;
  initials: string;
};

export const useUser = create<UserState>(() => ({
  name: "Atty. Maria Santos",
  role: "admin",
  initials: "MS",
}));
