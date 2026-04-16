"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Table2, LayoutGrid, X } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { SegmentedControl } from "@/components/primitives/SegmentedControl";
import { NewRequestForm } from "@/components/forms/NewRequestForm";
import { useMaintenance } from "@/lib/stores/useMaintenance";
import type { TicketStatus, MaintenanceTicket, Priority } from "@/lib/mock/maintenance";
import { BUILDINGS } from "@/lib/mock/buildings";
import { time, pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const COLUMNS: TicketStatus[] = ["Requested", "Scheduled", "In Progress", "Done"];

const PRIORITY_TONE: Record<Priority, "ok" | "warn" | "danger"> = {
  low: "ok",
  medium: "warn",
  high: "danger",
};

type View = "kanban" | "table";

export default function MaintenancePage() {
  const tickets = useMaintenance((s) => s.tickets);
  const move = useMaintenance((s) => s.move);
  const [view, setView] = useState<View>("kanban");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MaintenanceTicket | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const m: Record<TicketStatus, MaintenanceTicket[]> = {
      Requested: [],
      Scheduled: [],
      "In Progress": [],
      Done: [],
    };
    for (const t of tickets) m[t.status].push(t);
    return m;
  }, [tickets]);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const ticketId = String(e.active.id);
    const target = e.over.id as TicketStatus;
    if (COLUMNS.includes(target)) move(ticketId, target);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="08" label="Maintenance" />
        <div className="flex items-center gap-3">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v)}
            options={[
              { value: "kanban", label: "Kanban" },
              { value: "table", label: "Log" },
            ]}
            size="sm"
          />
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            <Plus size={14} strokeWidth={1.6} /> New request
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {COLUMNS.map((c) => (
          <div key={c} className="text-right">
            {grouped[c].length} {c.toLowerCase()}
          </div>
        ))}
      </div>

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActive(tickets.find((t) => t.id === e.active.id) ?? null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col} status={col} tickets={grouped[col]} />
            ))}
          </div>

          <DragOverlay>
            {active && <KanbanCard ticket={active} dragging />}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView tickets={tickets} />
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2"
                >
                  <Card surface={1} className="overflow-hidden">
                    <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
                      <Dialog.Title className="font-serif italic text-[20px] text-[var(--color-fg)]">
                        File a maintenance request
                      </Dialog.Title>
                      <Dialog.Close className="rounded-full p-1.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)]">
                        <X size={16} strokeWidth={1.6} />
                      </Dialog.Close>
                    </div>
                    <div className="px-6 py-5">
                      <NewRequestForm onSubmitted={() => setOpen(false)} />
                    </div>
                  </Card>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

function KanbanColumn({ status, tickets }: { status: TicketStatus; tickets: MaintenanceTicket[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] flex-col rounded-[var(--radius-md)] border bg-[var(--color-surface-1)] p-2",
        "transition-colors",
        isOver ? "border-[var(--color-signal)]" : "border-[var(--color-border)]",
      )}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        <span>{status}</span>
        <span className="tabular-nums">{tickets.length}</span>
      </div>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {tickets.map((t) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <KanbanCard ticket={t} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function KanbanCard({ ticket, dragging }: { ticket: MaintenanceTicket; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ticket.id });
  const b = BUILDINGS.find((x) => x.id === ticket.buildingId);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-[var(--radius-sm)] border bg-[var(--color-surface-2)] p-3 cursor-grab active:cursor-grabbing",
        "transition-colors hover:border-[var(--color-border-strong)]",
        (isDragging || dragging) && "opacity-90 shadow-lg",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-[var(--color-fg)]">{ticket.title}</p>
        <Pill tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority}</Pill>
      </div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
        BLDG {pad(ticket.buildingId)} · {b?.name}
      </p>
      <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        <span>{ticket.kind}</span>
        <span className="tabular-nums">{time(new Date(ticket.requestedAt))}</span>
      </div>
    </div>
  );
}

function TableView({ tickets }: { tickets: MaintenanceTicket[] }) {
  return (
    <Card surface={1} className="mt-4 overflow-hidden">
      <table className="w-full text-[12px]">
        <thead className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Building</th>
            <th className="px-4 py-3 text-left">Kind</th>
            <th className="px-4 py-3 text-left">Priority</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Requested</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, i) => {
            const b = BUILDINGS.find((x) => x.id === t.buildingId);
            return (
              <tr
                key={t.id}
                className={cn(
                  "border-b border-[var(--color-border)] last:border-b-0",
                  i % 2 === 0 ? "bg-transparent" : "bg-[color-mix(in_oklch,var(--color-surface-2)_50%,transparent)]",
                )}
              >
                <td className="px-4 py-2 font-mono tabular-nums text-[var(--color-fg-subtle)]">{t.id}</td>
                <td className="px-4 py-2 text-[var(--color-fg)]">{t.title}</td>
                <td className="px-4 py-2 font-mono text-[var(--color-fg-muted)]">
                  BLDG {pad(t.buildingId)} · {b?.name}
                </td>
                <td className="px-4 py-2 font-mono uppercase tracking-[0.18em] text-[10px] text-[var(--color-fg-subtle)]">{t.kind}</td>
                <td className="px-4 py-2"><Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill></td>
                <td className="px-4 py-2"><Pill tone="signal">{t.status}</Pill></td>
                <td className="px-4 py-2 text-right font-mono tabular-nums text-[var(--color-fg-subtle)]">
                  {time(new Date(t.requestedAt))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
