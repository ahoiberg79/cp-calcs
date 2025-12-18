"use client";
import { useMemo, useState } from "react";
import { runFertilizerAcidityAll } from "@calc-engine/core";

/* ---------- tiny number helpers (keep in-file for now) ---------- */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
function fmtUnits(n: unknown, dec?: number): string {
  if (!isNum(n)) return "—";
  const digits = dec ?? (n % 1 === 0 ? 0 : 1);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}
/* ---------------------------------------------------------------- */

const BRAND_RED = "#B21F2D";

type FertKey =
  | "Anhydrous Ammonia (AA)"
  | "Urea"
  | "Ammonium Sulfate (AMS)"
  | "Monoammonium Phosphate (MAP)"
  | "Diammonium Phosphate (DAP)"
  | "Ammonium Nitrate (AN)"
  | "Urea Ammonium Nitrate (UAN)"
  | "MicroEssentials SZ (MES-SZ)"
  | "MicroEssentials S10 (MES-S10)"
  | "MicroEssentials S15 (MES-S15)"
  | "Elemental Sulfur (ES)";

type RowUnits =
  | { fertilizer: Exclude<FertKey, "Elemental Sulfur (ES)">; unitsN?: number }
  | { fertilizer: "Elemental Sulfur (ES)"; unitsS?: number };

type RowRate = { fertilizer: FertKey; rate_lbs_ac?: number };
type RowState = RowUnits | RowRate;

const CAP = new Map<FertKey, { acceptsN: boolean; hasMES?: boolean; acceptsS?: boolean }>([
  ["Anhydrous Ammonia (AA)", { acceptsN: true }],
  ["Urea", { acceptsN: true }],
  ["Ammonium Sulfate (AMS)", { acceptsN: true }],
  ["Monoammonium Phosphate (MAP)", { acceptsN: true }],
  ["Diammonium Phosphate (DAP)", { acceptsN: true }],
  ["Ammonium Nitrate (AN)", { acceptsN: true }],
  ["Urea Ammonium Nitrate (UAN)", { acceptsN: true }],
  ["MicroEssentials SZ (MES-SZ)", { acceptsN: true, hasMES: true }],
  ["MicroEssentials S10 (MES-S10)", { acceptsN: true, hasMES: true }],
  ["MicroEssentials S15 (MES-S15)", { acceptsN: true, hasMES: true }],
  ["Elemental Sulfur (ES)", { acceptsN: false, acceptsS: true }],
]);

// Analyses for RATE mode (edit if your labels differ)
const ANALYSIS: Record<FertKey, { N_pct?: number; S_pct?: number }> = {
  "Anhydrous Ammonia (AA)": { N_pct: 82 },
  "Urea": { N_pct: 46 },
  "Ammonium Sulfate (AMS)": { N_pct: 21, S_pct: 24 }, // S (sulfate) does not acidify
  "Monoammonium Phosphate (MAP)": { N_pct: 11 },
  "Diammonium Phosphate (DAP)": { N_pct: 18 },
  "Ammonium Nitrate (AN)": { N_pct: 34 },
  "Urea Ammonium Nitrate (UAN)": { N_pct: 32 }, // using 32% default
  "MicroEssentials SZ (MES-SZ)": { N_pct: 12, S_pct: 10 },
  "MicroEssentials S10 (MES-S10)": { N_pct: 12, S_pct: 10 },
  "MicroEssentials S15 (MES-S15)": { N_pct: 13, S_pct: 15 },
  "Elemental Sulfur (ES)": { S_pct: 90 }, // ✅ 90% S
};

const ALL_ROWS_UNITS: RowState[] = Array.from(CAP.keys()).map((k) =>
  k === "Elemental Sulfur (ES)" ? ({ fertilizer: k } as RowUnits) : ({ fertilizer: k } as RowUnits)
);
const ALL_ROWS_RATE: RowState[] = Array.from(CAP.keys()).map((k) => ({ fertilizer: k } as RowRate));

type Mode = "units" | "rate";

export default function FertilizerAcidityPage() {
  const [enp, setEnp] = useState<number>(0.94);
  const [mode, setMode] = useState<Mode>("units");
  const [rows, setRows] = useState<RowState[]>(ALL_ROWS_UNITS);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRows(m === "units" ? ALL_ROWS_UNITS : ALL_ROWS_RATE);
  };

  const update = (idx: number, patch: Partial<RowState>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? ({ ...r, ...patch } as RowState) : r)));

  // Derived units in RATE mode
  const derivedUnits = useMemo(() => {
    if (mode !== "rate") return new Map<FertKey, { n?: number; s?: number; acidS?: number }>();
    const m = new Map<FertKey, { n?: number; s?: number; acidS?: number }>();
    for (const r of rows as RowRate[]) {
      const a = ANALYSIS[r.fertilizer];
      const rate = (r as any).rate_lbs_ac ?? 0;
      const n = a.N_pct ? rate * (a.N_pct / 100) : undefined;
      const totalS = a.S_pct ? rate * (a.S_pct / 100) : undefined;
      let acidS: number | undefined;
      if (r.fertilizer.startsWith("MicroEssentials") && totalS !== undefined) acidS = totalS * 0.5; // MES: 1/2 of S
      else if (r.fertilizer === "Elemental Sulfur (ES)" && totalS !== undefined) acidS = totalS; // ES: 100% of S
      m.set(r.fertilizer, { n, s: totalS, acidS });
    }
    return m;
  }, [mode, rows]);

  // Build engine input from UI state
  const engineInput = useMemo(() => {
    if (mode === "units") {
      return (rows as RowUnits[]).map((r) =>
        r.fertilizer === "Elemental Sulfur (ES)"
          ? { fertilizer: r.fertilizer, unitsS: r.unitsS }
          : { fertilizer: r.fertilizer, unitsN: (r as any).unitsN }
      );
    } else {
      const list: any[] = [];
      for (const r of rows as RowRate[]) {
        const rate = (r as any).rate_lbs_ac ?? 0;
        const a = ANALYSIS[r.fertilizer];
        const nUnits = a.N_pct ? rate * (a.N_pct / 100) : undefined;

        if (r.fertilizer.startsWith("MicroEssentials")) {
          list.push({ fertilizer: r.fertilizer, unitsN: nUnits, mesProductRate_lbs_ac: rate });
        } else if (r.fertilizer === "Elemental Sulfur (ES)") {
          // with 90% S analysis, unitsS = rate * 0.90
          const sUnits = a.S_pct ? rate * (a.S_pct / 100) : rate;
          list.push({ fertilizer: r.fertilizer, unitsS: sUnits });
        } else {
          list.push({ fertilizer: r.fertilizer, unitsN: nUnits });
        }
      }
      return list;
    }
  }, [mode, rows]);

  const out = useMemo(
    () => runFertilizerAcidityAll({ enpFraction98G: enp, rows: engineInput as any }),
    [engineInput, enp]
  );

  // MES acidifying S lookup (from engine debug) used in Units mode
  const mesAcidSLookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of out.rows)
      if (r.debug?.mes_elemental_S_units !== undefined) m.set(r.fertilizer, r.debug.mes_elemental_S_units);
    return m;
  }, [out.rows]);

  // Totals of N units and acidifying S units (works in both modes)
  const totalsUnits = useMemo(() => {
    let totalN = 0;
    let totalAcidS = 0;

    if (mode === "units") {
      for (const r of rows as RowUnits[]) {
        const isES = r.fertilizer === "Elemental Sulfur (ES)";
        const isMES = r.fertilizer.startsWith("MicroEssentials");

        if (!isES) {
          const uN = (r as any).unitsN;
          if (typeof uN === "number" && Number.isFinite(uN)) totalN += Math.max(0, uN);
        } else {
          const uS = (r as any).unitsS;
          if (typeof uS === "number" && Number.isFinite(uS)) totalAcidS += Math.max(0, uS); // ES = 100% acidifying
        }

        if (isMES) {
          const acidS = mesAcidSLookup.get(r.fertilizer);
          if (typeof acidS === "number" && Number.isFinite(acidS)) totalAcidS += Math.max(0, acidS); // MES = ½ label S
        }
      }
    } else {
      // mode === "rate"
      for (const r of rows as RowRate[]) {
        const d = derivedUnits.get(r.fertilizer as FertKey);
        if (d?.n && Number.isFinite(d.n)) totalN += Math.max(0, d.n);

        const isMES = r.fertilizer.startsWith("MicroEssentials");
        const isES = r.fertilizer === "Elemental Sulfur (ES)";
        if ((isMES || isES) && d?.acidS && Number.isFinite(d.acidS)) {
          totalAcidS += Math.max(0, d.acidS);
        }
      }
    }

    return { totalN, totalAcidS };
  }, [mode, rows, derivedUnits, mesAcidSLookup]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* brand bar (red) */}
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <h1 className="mb-2 text-2xl font-bold">98G — Fertilizer Acidity</h1>
        <p className="mb-6 max-w-3xl text-sm text-gray-600">
          Enter either <b>Units</b> (N/S) or <b>Product rate</b> (lbs/ac). MicroEssentials contributes acidity from the
          elemental half of its sulfur; Elemental S contributes 100%. The calculator converts everything to required{" "}
          <b>98G</b>.
        </p>

        {/* settings panel */}
        <div className="mb-6 rounded-3xl bg-gray-100/70 p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Input mode:</span>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={mode === "units"} onChange={() => switchMode("units")} />
                Units (N / S)
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={mode === "rate"} onChange={() => switchMode("rate")} />
                Product rate (lbs/ac)
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              CCE (fraction):
              <input
                type="number"
                step={0.01}
                min={0.1}
                max={1.0}
                value={enp}
                onChange={(e) => setEnp(Number(e.target.value))}
                className="h-9 w-24 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* rows panel */}
        <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: BRAND_RED }}
          />
          <div className="grid gap-2">
            {rows.map((r, i) => {
              const derived = mode === "rate" ? derivedUnits.get(r.fertilizer as FertKey) : undefined;
              const mesAcidS = mode === "rate" ? derived?.acidS : mesAcidSLookup.get(r.fertilizer);
              const stripe = i % 2 === 0 ? "bg-white" : "bg-gray-50";

              const isMES = r.fertilizer.startsWith("MicroEssentials");
              const isES = r.fertilizer === "Elemental Sulfur (ES)";

              return (
                <div key={i} className={`grid grid-cols-12 items-center gap-2 rounded border p-3 ${stripe}`}>
                  {/* Name */}
                  <div className="col-span-4 pr-2 font-medium truncate">{r.fertilizer}</div>

                  {/* UNITS MODE */}
                  {mode === "units" && (
                    <>
                      {/* AA/Urea/... (N) */}
                      {!isES && (
                        <div className={isMES ? "col-span-5" : "col-span-8"}>
                          <label className="block text-[11px]">Units N (lb/ac)</label>
                          <input
                            type="number"
                            value={(r as any).unitsN ?? ""}
                            onChange={(e) =>
                              update(i, { unitsN: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className="h-9 w-24 md:w-28 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      )}

                      {/* ES (S) */}
                      {isES && (
                        <div className="col-span-8">
                          <label className="block text-[11px]">Units S (lb/ac)</label>
                          <input
                            type="number"
                            value={(r as any).unitsS ?? ""}
                            onChange={(e) =>
                              update(i, { unitsS: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className="h-9 w-24 md:w-28 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      )}

                      {/* MES acidifying S (auto) */}
                      {isMES && (
                        <div className="col-span-3">
                          <label className="block text-[11px]">Acidifying S (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={mesAcidS !== undefined ? fmtUnits(mesAcidS, 1) : ""}
                            className="h-9 w-24 md:w-28 rounded border border-gray-200 bg-gray-100 px-2 text-sm"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* RATE MODE */}
                  {mode === "rate" && (
                    <>
                      {/* Product rate */}
                      <div className={isMES ? "col-span-3" : "col-span-4"}>
                        <label className="block text-[11px]">Product rate (lb/ac)</label>
                        <input
                          type="number"
                          value={(r as any).rate_lbs_ac ?? ""}
                          onChange={(e) =>
                            update(i, { rate_lbs_ac: e.target.value ? Number(e.target.value) : undefined })
                          }
                          className="h-9 w-24 md:w-28 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* Derived N (skip for ES) */}
                      {!isES && (
                        <div className={isMES ? "col-span-3" : "col-span-4"}>
                          <label className="block text-[11px]">Derived N units (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={derived?.n !== undefined ? fmtUnits(derived.n, 1) : ""}
                            className="h-9 w-24 md:w-28 rounded border border-gray-200 bg-gray-100 px-2 text-sm"
                          />
                        </div>
                      )}

                      {/* MES acid S / ES S (auto) */}
                      {isMES && (
                        <div className="col-span-3">
                          <label className="block text-[11px]">Acidifying S (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={mesAcidS !== undefined ? fmtUnits(mesAcidS, 1) : ""}
                            className="h-9 w-24 md:w-28 rounded border border-gray-200 bg-gray-100 px-2 text-sm"
                          />
                        </div>
                      )}
                      {isES && (
                        <div className="col-span-4">
                          <label className="block text-[11px]">S units (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={derived?.acidS !== undefined ? fmtUnits(derived.acidS, 1) : ""}
                            className="h-9 w-24 md:w-28 rounded border border-gray-200 bg-gray-100 px-2 text-sm"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* results card */}
        <div className="relative mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: BRAND_RED }}
          />
          <div className="space-y-2">
            <div className="text-md">
              <b>Total N units:</b> {fmtUnits(totalsUnits.totalN, 1)} lbs/ac
            </div>
            <div className="text-md">
              <b>Total acidifying S units:</b> {fmtUnits(totalsUnits.totalAcidS, 1)} lbs/ac
            </div>
            <div className="pt-1 text-lg">
              <b>Total 98G needed:</b> {fmtUnits(out.total_lbs98g_per_ac, 1)} lbs/ac
            </div>

            <details className="group">
              <summary className="cursor-pointer rounded px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                Breakdown by product
              </summary>
              <ul className="ml-6 mt-2 list-disc space-y-1.5 text-sm">
                {out.rows.map((r, idx) => (
                  <li key={idx}>
                    {r.fertilizer}: {fmtUnits(r.lbs98gNeeded, 1)} lbs/ac
                    {isNum(r.contrib_N_lbs98g) && <> (N: {fmtUnits(r.contrib_N_lbs98g, 1)})</>}
                    {isNum(r.contrib_S_lbs98g) && <> (S: {fmtUnits(r.contrib_S_lbs98g, 1)})</>}
                  </li>
                ))}
              </ul>
            </details>

            <div className="text-xs text-gray-600">
              Rate-mode analyses (defaults): AA 82N, Urea 46N, AMS 21N/24S, MAP 11N, DAP 18N, AN 34N, UAN 32N, MES-SZ
              12N/10S, MES-S10 12N/10S, MES-S15 13N/15S, ES 90S. Only MES (½ of S) and ES contribute S acidity.
            </div>
          </div>
        </div>

        {/* back link */}
        <div className="mt-8">
          <a href="/98g" className="text-sm text-blue-600 hover:underline">
            ← Back to 98G calculators
          </a>
        </div>
      </section>
    </main>
  );
}
