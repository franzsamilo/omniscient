"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X as XIcon, Search } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { USERS, ROLE_CAPABILITIES, type Role, type User } from "@/lib/mock/users";
import { BUILDINGS } from "@/lib/mock/buildings";
import { streamRng, pick } from "@/lib/mock/seed";
import { time, pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type RfidEntry = {
  id: string;
  ts: number;
  user: User;
  buildingId: number;
  room: string;
  granted: boolean;
};

const ROLE_TONE: Record<Role, "signal" | "warn" | "ok" | "neutral"> = {
  admin: "signal",
  engineer: "warn",
  facilities: "ok",
  viewer: "neutral",
};

function makeEntry(): RfidEntry {
  const rng = streamRng(`rfid:${Date.now()}:${Math.random()}`);
  const u = pick(rng, USERS);
  const b = pick(rng, BUILDINGS);
  return {
    id: `R-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
    ts: Date.now(),
    user: u,
    buildingId: b.id,
    room: `${["GF", "1F", "2F", "3F"][Math.floor(rng() * 4)]}-${100 + Math.floor(rng() * 240)}`,
    granted: rng() > 0.06,
  };
}

export default function SecurityPage() {
  const [log, setLog] = useState<RfidEntry[]>(() =>
    Array.from({ length: 6 }, () => {
      const e = makeEntry();
      e.ts = Date.now() - Math.floor(Math.random() * 600_000);
      return e;
    }).sort((a, b) => b.ts - a.ts),
  );
  const [filter, setFilter] = useState("");

  // Append a new RFID event every 8s.
  useEffect(() => {
    const id = setInterval(() => {
      setLog((prev) => [makeEntry(), ...prev].slice(0, 80));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const filteredUsers = useMemo(
    () =>
      USERS.filter((u) =>
        filter
          ? `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(filter.toLowerCase())
          : true,
      ),
    [filter],
  );

  const totals = useMemo(() => {
    const active = USERS.filter((u) => u.active).length;
    const admins = USERS.filter((u) => u.role === "admin").length;
    return { active, admins, denied: log.filter((e) => !e.granted).length };
  }, [log]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="09" label="Access & RBAC" />
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          <Pill tone="signal" pulse>
            {totals.active} active
          </Pill>
          <Pill tone={totals.denied > 0 ? "danger" : "ok"}>
            {totals.denied} denied · 24h
          </Pill>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Users */}
        <Card surface={1} className="xl:col-span-7 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <SectionHeader index="09A" label="Users" />
            <div className="relative">
              <Search size={12} strokeWidth={1.5} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search…"
                className="rounded-[var(--radius-sm)] border bg-[var(--color-bg)] py-1 pl-7 pr-3 text-[12px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
                style={{ borderColor: "var(--color-border-strong)" }}
              />
            </div>
          </div>
          <table className="w-full text-[12px]">
            <thead className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">RFID UID</th>
                <th className="px-5 py-3 text-right">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                    "hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]",
                  )}
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid size-7 place-items-center rounded-full text-[10px] font-medium uppercase",
                        "bg-[var(--color-surface-3)] ring-1 ring-[var(--color-border-strong)]",
                      )}>
                        {u.initials}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--color-fg)]">{u.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-2.5"><Pill tone={ROLE_TONE[u.role]}>{u.role}</Pill></td>
                  <td className="px-5 py-2.5 font-mono tabular-nums text-[var(--color-fg-muted)]">{u.rfidUid}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)] tabular-nums">
                    {u.active ? `${Math.round(u.lastSeen / 60_000)}m ago` : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* RFID log (live) */}
        <Card surface={1} className="omni-live xl:col-span-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <SectionHeader index="09B" label="RFID access log" />
            <Pill tone="signal" pulse>Live</Pill>
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {log.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-2.5 last:border-b-0"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0",
                      e.granted ? "bg-[var(--color-ok)]" : "bg-[var(--color-danger)]",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-[var(--color-fg)] truncate">{e.user.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                        {e.user.role}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
                      BLDG {pad(e.buildingId)} · {e.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <Pill tone={e.granted ? "ok" : "danger"}>
                      {e.granted ? "GRANTED" : "DENIED"}
                    </Pill>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)] tabular-nums">
                      {time(new Date(e.ts))}
                    </p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      </div>

      {/* Role × capability matrix */}
      <Card surface={1} className="mt-4 overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <SectionHeader index="09C" label="Role × capability" />
        </div>
        <table className="w-full text-[12px]">
          <thead className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-5 py-3 text-left">Capability</th>
              <th className="px-5 py-3 text-center">Admin</th>
              <th className="px-5 py-3 text-center">Engineer</th>
              <th className="px-5 py-3 text-center">Facilities</th>
              <th className="px-5 py-3 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {ROLE_CAPABILITIES.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-[var(--color-border)] last:border-b-0",
                  i % 2 === 1 && "bg-[color-mix(in_oklch,var(--color-surface-2)_50%,transparent)]",
                )}
              >
                <td className="px-5 py-2.5 text-[var(--color-fg)]">{row.capability}</td>
                <Cell on={row.admin} />
                <Cell on={row.engineer} />
                <Cell on={row.facilities} />
                <Cell on={row.viewer} />
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Cell({ on }: { on: boolean }) {
  return (
    <td className="px-5 py-2.5 text-center">
      {on ? (
        <Check size={14} strokeWidth={1.8} className="inline text-[var(--color-ok)]" />
      ) : (
        <XIcon size={14} strokeWidth={1.8} className="inline text-[var(--color-fg-subtle)] opacity-50" />
      )}
    </td>
  );
}
