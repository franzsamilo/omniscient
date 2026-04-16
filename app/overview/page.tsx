"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/primitives/KpiCard";
import { LoadCurve } from "@/components/charts/LoadCurve";
import { CampusMap } from "@/components/map/CampusMap";
import { AlertFeed } from "@/components/chrome/AlertFeed";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { CardTitle } from "@/components/primitives/CardTitle";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { StoryStrip } from "@/components/primitives/StoryStrip";
import {
  kpiSnapshot,
  recentSparkline,
  flaggedBuildings,
  HEADLINE_MONTHLY_BILL,
} from "@/lib/mock/telemetry";
import { useAlerts } from "@/lib/stores/useAlerts";
import { pesoShort, kw } from "@/lib/utils/format";

export default function OverviewPage() {
  const snap = useMemo(() => kpiSnapshot(), []);
  const sparkLoad = useMemo(() => recentSparkline("total"), []);
  const sparkCost = useMemo(() => recentSparkline("cost"), []);
  const sparkSolar = useMemo(() => recentSparkline("solar"), []);
  const alertCount = useAlerts((s) => s.alerts.filter((a) => !a.acknowledged).length);

  const loadDelta = pctDelta(snap.currentLoadKw, snap.yesterdayLoadKw);
  const costDelta = pctDelta(snap.todayCostPhp, snap.yesterdayCostPhp);
  const solarDelta = pctDelta(snap.solarSharePct, snap.yesterdaySolarSharePct);
  const flaggedCount = useMemo(() => flaggedBuildings().size, []);

  // Plain-English narrative built from the snapshot.
  const loadVerb = loadDelta > 1.5 ? "running hot" : loadDelta < -1.5 ? "running cool" : "tracking yesterday";
  const solarPhrase = snap.solarSharePct > 0.3
    ? `Solar covering ${(snap.solarSharePct * 100).toFixed(0)}% of demand`
    : `Solar contributing ${(snap.solarSharePct * 100).toFixed(0)}% — most load on grid`;
  const flagPhrase = flaggedCount === 0
    ? "no buildings flagged"
    : `${flaggedCount} building${flaggedCount > 1 ? "s" : ""} flagged for unusual draw`;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="01" label="Baseline" />
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-subtle)]">
          <Pill tone="signal" pulse>Live</Pill>
          <span>Monthly bill — {pesoShort(HEADLINE_MONTHLY_BILL)}</span>
        </div>
      </div>

      {/* Story strip — plain-English current state */}
      <StoryStrip
        className="mt-5"
        eyebrow="Right now"
        headline={
          <>
            Campus is drawing <span className="font-mono tabular-nums text-[var(--color-signal)]">{kw(snap.currentLoadKw)}</span>{" "}
            and {loadVerb}. {solarPhrase}; {flagPhrase}.
          </>
        }
        detail="Hover any KPI for a 24-hour trend. Click into the map for spatial context."
        stats={[
          { label: "Bldgs observed", value: "101", tone: "default" },
          { label: "Flagged", value: String(flaggedCount), tone: flaggedCount > 0 ? "danger" : "ok" },
          { label: "Alerts open", value: String(alertCount), tone: alertCount > 0 ? "warn" : "ok" },
        ]}
      />

      {/* Row 1 — KPI strip (4 cards) */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index="K1"
          label="Current load"
          value={snap.currentLoadKw}
          unit="kW"
          decimals={1}
          delta={loadDelta}
          invertDelta
          spark={sparkLoad}
          sparkColor="var(--color-fg-muted)"
        />
        <KpiCard
          index="K2"
          label="Today's cost"
          value={Math.round(snap.todayCostPhp)}
          unit="₱"
          decimals={0}
          delta={costDelta}
          invertDelta
          display={pesoShort(snap.todayCostPhp)}
          spark={sparkCost}
          sparkColor="var(--color-warn)"
        />
        <KpiCard
          index="K3"
          label="Solar contribution"
          value={snap.solarSharePct * 100}
          unit="%"
          decimals={1}
          delta={solarDelta}
          spark={sparkSolar}
          sparkColor="var(--color-solar)"
        />
        <KpiCard
          index="K4"
          label="Active alerts"
          value={alertCount}
          unit="events"
          decimals={0}
          delta={alertCount > 0 ? 12 : -8}
          invertDelta
          spark={Array.from({ length: 24 }, (_, i) => alertCount + Math.sin(i) * 1.5)}
          sparkColor={alertCount > 0 ? "var(--color-danger)" : "var(--color-ok)"}
        />
      </div>

      {/* Row 2 — campus map (8) + alert feed (4) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8 flex flex-col p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <CardTitle>Campus observed</CardTitle>
            <Link
              href="/map"
              className="inline-flex items-center gap-1 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-signal)]"
            >
              Open full map <ArrowRight size={11} strokeWidth={1.6} />
            </Link>
          </div>
          <div className="relative h-[460px] flex-1 px-5 pb-5">
            <div className="h-full w-full">
              <CampusMap size="contain" allowModeToggle showScrubber={false} />
            </div>
          </div>
        </Card>

        <div className="xl:col-span-4">
          <AlertFeed limit={8} />
        </div>
      </div>

      {/* Row 3 — load curve */}
      <Card className="mt-4">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <CardTitle>Today's load — grid + solar</CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-subtle)]">
            <Legend swatch="var(--color-grid)" label="Grid" />
            <Legend swatch="var(--color-solar)" label="Solar" />
            <span className="font-mono text-[10px] tabular-nums">5-min · PHT</span>
          </div>
        </div>
        <div className="px-3 pb-3">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoadCurve height={220} />
          </motion.div>
        </div>
      </Card>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
      <span className="size-2 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  );
}

function pctDelta(now: number, prev: number): number {
  if (prev === 0) return 0;
  return ((now - prev) / prev) * 100;
}
