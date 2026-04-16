"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/primitives/Button";
import { BUILDINGS } from "@/lib/mock/buildings";
import { useMaintenance } from "@/lib/stores/useMaintenance";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const Schema = z.object({
  buildingId: z.number().int().min(1).max(101),
  kind: z.enum(["electrical", "hvac", "plumbing", "carpentry", "data", "lighting"]),
  priority: z.enum(["low", "medium", "high"]),
  title: z.string().min(8, "Be a bit more specific.").max(80),
  description: z.string().max(400).optional(),
  requestedBy: z.string().min(2),
});

type FormValues = z.infer<typeof Schema>;

type Props = {
  onSubmitted: () => void;
};

export function NewRequestForm({ onSubmitted }: Props) {
  const add = useMaintenance((s) => s.add);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(Schema) as never,
    defaultValues: {
      buildingId: 1,
      kind: "electrical",
      priority: "medium",
      title: "",
      description: "",
      requestedBy: "Atty. M. Santos",
    },
  });

  const onSubmit = (v: FormValues) => {
    add({
      id: `M-${Date.now().toString(36).toUpperCase()}`,
      title: v.title,
      buildingId: v.buildingId,
      kind: v.kind,
      priority: v.priority,
      status: "Requested",
      requestedBy: v.requestedBy,
      requestedAt: Date.now(),
      description: v.description,
    });
    reset();
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          placeholder="What needs doing?"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Building" error={errors.buildingId?.message}>
          <select {...register("buildingId", { valueAsNumber: true })} className={cn(inputCls)}>
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {pad(b.id)} · {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kind">
          <select {...register("kind")} className={inputCls}>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
            <option value="carpentry">Carpentry</option>
            <option value="data">Data / IT</option>
            <option value="lighting">Lighting</option>
          </select>
        </Field>
        <Field label="Priority">
          <select {...register("priority")} className={inputCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          {...register("description")}
          rows={4}
          className={cn(inputCls, "resize-none")}
        />
      </Field>

      <Field label="Requested by" error={errors.requestedBy?.message}>
        <input {...register("requestedBy")} className={inputCls} />
      </Field>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          File request
        </Button>
      </div>
    </form>
  );
}

const inputCls = cn(
  "block w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-3 py-2",
  "text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]",
  "border-[var(--color-border-strong)] focus:border-[var(--color-signal)] focus:outline-none",
);

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </span>
      {children}
      {error && (
        <span className="font-mono text-[10px] text-[var(--color-danger)]">{error}</span>
      )}
    </label>
  );
}
