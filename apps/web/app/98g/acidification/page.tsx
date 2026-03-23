"use client";

import { useMemo, useState } from "react";
import {
  runFertilizerAcidityAll,
  type FertAcidityRowInput,
} from "@calc-engine/core";

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function fmtUnits(n: unknown, dec?: number): string {
  if (!isNum(n)) return "—";
  const digits = dec ?? (n % 1 === 0 ? 0 : 1);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

const BRAND_RED = "#B21F2D";

type FertKey =
  | "Anhydrous Ammonia (AA)"
  | "Urea"
  | "Ammonium Sulfate (AMS)"
  | "Monoammonium Phosphate (MAP)"
  | "Diammonium Phosphate (DAP)"
  | "Ammonium Nitrate (AN)"
  | "32% UAN"
  | "28% UAN"
  | "Ammonium Polyphosphate (10-34-0)"
  | "Ammonium Thiosulfate (ATS)"
  | "Co-Granulated (12-40-0-10S-1Zn)"
  | "Co-Granulated (12-40-0-10S)"
  | "Co-Granulated (13-33-0-15S)"
  | "Elemental Sulfur (ES)";

type StandardNFert =
  | "Anhydrous Ammonia (AA)"
  | "Urea"
  | "Ammonium Sulfate (AMS)"
  | "Monoammonium Phosphate (MAP)"
  | "Diammonium Phosphate (DAP)"
  | "Ammonium Nitrate (AN)"
  | "32% UAN"
  | "28% UAN"
  | "Ammonium Polyphosphate (10-34-0)";

type CoGranulatedFert =
  | "Co-Granulated (12-40-0-10S-1Zn)"
  | "Co-Granulated (12-40-0-10S)"
  | "Co-Granulated (13-33-0-15S)";

type Mode = "units" | "rate";

type RowUnits = { fertilizer: FertKey; unitsN?: number; unitsS?: number };
type RowRate = { fertilizer: FertKey; rate_per_ac?: number };
type RowState = RowUnits | RowRate;

type Analysis = {
  N_pct?: number;
  S_pct?: number;
  liquid?: boolean;
  density_lb_gal?: number;
};

const ANALYSIS: Record<FertKey, Analysis> = {
  "Anhydrous Ammonia (AA)": { N_pct: 82 },
  Urea: { N_pct: 46 },
  "Ammonium Sulfate (AMS)": { N_pct: 21, S_pct: 24 },
  "Monoammonium Phosphate (MAP)": { N_pct: 11 },
  "Diammonium Phosphate (DAP)": { N_pct: 18 },
  "Ammonium Nitrate (AN)": { N_pct: 34 },
  "32% UAN": { N_pct: 32, liquid: true, density_lb_gal: 11.06 },
  "28% UAN": { N_pct: 28, liquid: true, density_lb_gal: 10.65 },
  "Ammonium Polyphosphate (10-34-0)": {
    N_pct: 10,
    liquid: true,
    density_lb_gal: 11.65,
  },
  "Ammonium Thiosulfate (ATS)": {
    N_pct: 12,
    S_pct: 26,
    liquid: true,
    density_lb_gal: 11.1,
  },
  "Co-Granulated (12-40-0-10S-1Zn)": { N_pct: 12, S_pct: 10 },
  "Co-Granulated (12-40-0-10S)": { N_pct: 12, S_pct: 10 },
  "Co-Granulated (13-33-0-15S)": { N_pct: 13, S_pct: 15 },
  "Elemental Sulfur (ES)": { S_pct: 90 },
};

const ALL_FERTILIZERS: FertKey[] = [
  "Anhydrous Ammonia (AA)",
  "Urea",
  "Ammonium Sulfate (AMS)",
  "Monoammonium Phosphate (MAP)",
  "Diammonium Phosphate (DAP)",
  "Ammonium Nitrate (AN)",
  "32% UAN",
  "28% UAN",
  "Ammonium Polyphosphate (10-34-0)",
  "Ammonium Thiosulfate (ATS)",
  "Co-Granulated (12-40-0-10S-1Zn)",
  "Co-Granulated (12-40-0-10S)",
  "Co-Granulated (13-33-0-15S)",
  "Elemental Sulfur (ES)",
];

const ALL_ROWS_UNITS: RowUnits[] = ALL_FERTILIZERS.map((fertilizer) => ({
  fertilizer,
}));
const ALL_ROWS_RATE: RowRate[] = ALL_FERTILIZERS.map((fertilizer) => ({
  fertilizer,
}));

const isCoGranulated = (f: FertKey): f is CoGranulatedFert =>
  f.startsWith("Co-Granulated");
const isES = (f: FertKey): f is "Elemental Sulfur (ES)" =>
  f === "Elemental Sulfur (ES)";
const isATS = (f: FertKey): f is "Ammonium Thiosulfate (ATS)" =>
  f === "Ammonium Thiosulfate (ATS)";
const isLiquid = (f: FertKey) => Boolean(ANALYSIS[f].liquid);

type Derived = {
  n?: number;
  s?: number;
  acidS?: number;
  rateLbAc?: number;
};

type EngineOutRow = {
  fertilizer: FertKey;
  lbs98gNeeded: number;
  contrib_N_lbs98g?: number;
  contrib_S_lbs98g?: number;
  debug?: {
    coGranulated_elemental_S_units?: number;
    ats_acidifying_S_units?: number;
  };
};

type EngineOut = {
  total_caco3_needed_per_ac: number;
  total_lbs98g_per_ac: number;
  rows: EngineOutRow[];
};

function buildStandardNRow(
  fertilizer: StandardNFert,
  unitsN?: number
): FertAcidityRowInput {
  return { fertilizer, unitsN };
}

function buildCoGranulatedUnitsRow(
  fertilizer: CoGranulatedFert,
  unitsN?: number
): FertAcidityRowInput {
  return { fertilizer, unitsN };
}

function buildCoGranulatedRateRow(
  fertilizer: CoGranulatedFert,
  unitsN?: number,
  coGranulatedProductRate_lbs_ac?: number
): FertAcidityRowInput {
  return { fertilizer, unitsN, coGranulatedProductRate_lbs_ac };
}

function buildATSUnitsRow(unitsN?: number): FertAcidityRowInput {
  return {
    fertilizer: "Ammonium Thiosulfate (ATS)",
    unitsN,
  };
}

function buildATSRateRow(
  unitsN?: number,
  atsProductRate_lbs_ac?: number
): FertAcidityRowInput {
  return {
    fertilizer: "Ammonium Thiosulfate (ATS)",
    unitsN,
    atsProductRate_lbs_ac,
  };
}

function buildESRow(unitsS?: number): FertAcidityRowInput {
  return {
    fertilizer: "Elemental Sulfur (ES)",
    unitsS,
  };
}

function BackButton() {
  return (
    <a
      href="/98g"
      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
    >
      Back to 98G Calculators
    </a>
  );
}

export default function FertilizerAcidityPage() {
  const ENP_98G = 0.94;
  const [mode, setMode] = useState<Mode>("units");
  const [rows, setRows] = useState<RowState[]>(ALL_ROWS_UNITS);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRows(m === "units" ? ALL_ROWS_UNITS : ALL_ROWS_RATE);
  };

  const update = (idx: number, patch: Partial<RowUnits> | Partial<RowRate>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? ({ ...r, ...patch } as RowState) : r)));

  const derivedUnits = useMemo(() => {
    const m = new Map<FertKey, Derived>();
    if (mode !== "rate") return m;

    for (const r of rows as RowRate[]) {
      const a = ANALYSIS[r.fertilizer];
      const enteredRate = r.rate_per_ac ?? 0;
      const rateLbAc = a.liquid
        ? enteredRate * (a.density_lb_gal ?? 0)
        : enteredRate;

      const n = a.N_pct ? rateLbAc * (a.N_pct / 100) : undefined;
      const totalS = a.S_pct ? rateLbAc * (a.S_pct / 100) : undefined;

      let acidS: number | undefined;
      if (isCoGranulated(r.fertilizer) && totalS !== undefined) acidS = totalS * 0.5;
      else if ((isES(r.fertilizer) || isATS(r.fertilizer)) && totalS !== undefined) {
        acidS = totalS;
      }

      m.set(r.fertilizer, { n, s: totalS, acidS, rateLbAc });
    }

    return m;
  }, [mode, rows]);

  const engineInput = useMemo<FertAcidityRowInput[]>(() => {
    if (mode === "units") {
      return (rows as RowUnits[]).map((r) => {
        if (isCoGranulated(r.fertilizer)) return buildCoGranulatedUnitsRow(r.fertilizer, r.unitsN);
        if (isATS(r.fertilizer)) return buildATSUnitsRow(r.unitsN);
        if (isES(r.fertilizer)) return buildESRow(r.unitsS);
        return buildStandardNRow(r.fertilizer, r.unitsN);
      });
    }

    return (rows as RowRate[]).map((r) => {
      const derived = derivedUnits.get(r.fertilizer);
      const nUnits = derived?.n;

      if (isCoGranulated(r.fertilizer)) {
        return buildCoGranulatedRateRow(r.fertilizer, nUnits, derived?.rateLbAc);
      }

      if (isATS(r.fertilizer)) {
        return buildATSRateRow(nUnits, derived?.rateLbAc);
      }

      if (isES(r.fertilizer)) {
        return buildESRow(derived?.acidS);
      }

      return buildStandardNRow(r.fertilizer, nUnits);
    });
  }, [mode, rows, derivedUnits]);

  const out = useMemo(() => {
    return runFertilizerAcidityAll({
      enpFraction98G: ENP_98G,
      rows: engineInput,
    }) as unknown as EngineOut;
  }, [engineInput]);

  const coGranulatedAcidSLookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of out.rows) {
      const v = r.debug?.coGranulated_elemental_S_units;
      if (typeof v === "number" && Number.isFinite(v)) m.set(r.fertilizer, v);
    }
    return m;
  }, [out.rows]);

  const atsAcidSLookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of out.rows) {
      const v = r.debug?.ats_acidifying_S_units;
      if (typeof v === "number" && Number.isFinite(v)) m.set(r.fertilizer, v);
    }
    return m;
  }, [out.rows]);

  const totalsUnits = useMemo(() => {
    let totalN = 0;
    let totalAcidS = 0;

    if (mode === "units") {
      for (const r of rows as RowUnits[]) {
        if (!isES(r.fertilizer)) {
          const uN = r.unitsN;
          if (typeof uN === "number" && Number.isFinite(uN)) totalN += Math.max(0, uN);
        } else {
          const uS = r.unitsS;
          if (typeof uS === "number" && Number.isFinite(uS)) totalAcidS += Math.max(0, uS);
        }

        if (isCoGranulated(r.fertilizer)) {
          const acidS = coGranulatedAcidSLookup.get(r.fertilizer);
          if (typeof acidS === "number" && Number.isFinite(acidS)) totalAcidS += Math.max(0, acidS);
        }

        if (isATS(r.fertilizer)) {
          const acidS = atsAcidSLookup.get(r.fertilizer);
          if (typeof acidS === "number" && Number.isFinite(acidS)) totalAcidS += Math.max(0, acidS);
        }
      }
    } else {
      for (const r of rows as RowRate[]) {
        const d = derivedUnits.get(r.fertilizer);
        if (d?.n !== undefined && Number.isFinite(d.n)) totalN += Math.max(0, d.n);

        const wantsAcidS = isCoGranulated(r.fertilizer) || isES(r.fertilizer) || isATS(r.fertilizer);
        if (wantsAcidS && d?.acidS !== undefined && Number.isFinite(d.acidS)) {
          totalAcidS += Math.max(0, d.acidS);
        }
      }
    }

    return { totalN, totalAcidS };
  }, [mode, rows, derivedUnits, coGranulatedAcidSLookup, atsAcidSLookup]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          98G — Fertilizer Acidity
        </h1>
        <p className="mb-6 max-w-3xl text-sm text-gray-600">
          Enter either <b>Units per acre (N/S)</b> or <b>Product Rate</b>. Co-granulated products 
          contribute acidity from the elemental part of their sulfur. Elemental sulfur therefore
          contributes 100% of its sulfur. Ammonium thiosulfate (ATS) sulfur is automatically included 
          in the calculation.
        </p>
        <p className="mb-6 max-w-3xl text-sm text-gray-600">
          The rate calculated here can be used as a true 98G maintenance rate for full neutralization
          of the acidity caused by the fertilizers used below.
        </p>


        <div className="mb-6 rounded-3xl bg-gray-100/70 p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Input Mode:</span>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={mode === "units"}
                  onChange={() => switchMode("units")}
                />
                Units per acre (N/S)
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={mode === "rate"}
                  onChange={() => switchMode("rate")}
                />
                Product Rate
              </label>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: BRAND_RED }}
          />
          <div className="grid gap-2">
            {rows.map((r, i) => {
              const fert = r.fertilizer as FertKey;
              const derived = mode === "rate" ? derivedUnits.get(fert) : undefined;
              const coGranulatedAcidS = mode === "rate" ? derived?.acidS : coGranulatedAcidSLookup.get(fert);
              const atsAcidS = mode === "rate" ? derived?.acidS : atsAcidSLookup.get(fert);
              const stripe = i % 2 === 0 ? "bg-white" : "bg-gray-50";

              const rowIsCoGranulated = isCoGranulated(fert);
              const rowIsES = isES(fert);
              const rowIsATS = isATS(fert);
              const rowIsLiquid = isLiquid(fert);

              const rateLabel = rowIsLiquid
                ? "Product Rate (gal/acre)"
                : "Product Rate (lb/acre)";

              return (
                <div
                  key={i}
                  className={`grid grid-cols-12 items-center gap-2 rounded border p-3 ${stripe}`}
                >
                  <div className="col-span-4 truncate pr-2 font-medium">{fert}</div>

                  {mode === "units" && (
                    <>
                      {!rowIsES && (
                        <div className={rowIsCoGranulated || rowIsATS ? "col-span-5" : "col-span-8"}>
                          <label className="block text-[11px]">Units N (lb/acre)</label>
                          <input
                            type="number"
                            value={(r as RowUnits).unitsN ?? ""}
                            onChange={(e) =>
                              update(i, {
                                unitsN: e.target.value ? Number(e.target.value) : undefined,
                              } as Partial<RowUnits>)
                            }
                            className="h-9 w-24 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 md:w-28"
                          />
                        </div>
                      )}

                      {rowIsES && (
                        <div className="col-span-8">
                          <label className="block text-[11px]">Units S (lb/acre)</label>
                          <input
                            type="number"
                            value={(r as RowUnits).unitsS ?? ""}
                            onChange={(e) =>
                              update(i, {
                                unitsS: e.target.value ? Number(e.target.value) : undefined,
                              } as Partial<RowUnits>)
                            }
                            className="h-9 w-24 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 md:w-28"
                          />
                        </div>
                      )}

                      {(rowIsCoGranulated || rowIsATS) && (
                        <div className="col-span-3">
                          <label className="block text-[11px]">Acidifying S (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={
                              rowIsCoGranulated
                                ? coGranulatedAcidS !== undefined
                                  ? fmtUnits(coGranulatedAcidS, 1)
                                  : ""
                                : atsAcidS !== undefined
                                  ? fmtUnits(atsAcidS, 1)
                                  : ""
                            }
                            className="h-9 w-24 rounded border border-gray-200 bg-gray-100 px-2 text-sm md:w-28"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {mode === "rate" && (
                    <>
                      <div className={rowIsCoGranulated || rowIsATS ? "col-span-3" : "col-span-4"}>
                        <label className="block text-[11px]">{rateLabel}</label>
                        <input
                          type="number"
                          value={(r as RowRate).rate_per_ac ?? ""}
                          onChange={(e) =>
                            update(i, {
                              rate_per_ac: e.target.value ? Number(e.target.value) : undefined,
                            } as Partial<RowRate>)
                          }
                          className="h-9 w-24 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 md:w-28"
                        />
                      </div>

                      {!rowIsES && (
                        <div className={rowIsCoGranulated || rowIsATS ? "col-span-2" : "col-span-4"}>
                          <label className="block text-[11px]">Derived N Units (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={derived?.n !== undefined ? fmtUnits(derived.n, 1) : ""}
                            className="h-9 w-24 rounded border border-gray-200 bg-gray-100 px-2 text-sm md:w-28"
                          />
                        </div>
                      )}

                      {(rowIsCoGranulated || rowIsATS || rowIsES) && (
                        <div className="col-span-3">
                          <label className="block text-[11px]">Acidifying S (auto)</label>
                          <input
                            type="text"
                            readOnly
                            value={derived?.acidS !== undefined ? fmtUnits(derived.acidS, 1) : ""}
                            className="h-9 w-24 rounded border border-gray-200 bg-gray-100 px-2 text-sm md:w-28"
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

        <div className="relative mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: BRAND_RED }}
          />
          <div className="space-y-2">
            <div className="text-md">
              <b>Total N Applied:</b> {fmtUnits(totalsUnits.totalN, 1)} lb/acre
            </div>
            <div className="text-md">
              <b>Total Acidifying S Applied:</b> {fmtUnits(totalsUnits.totalAcidS, 1)} lb/acre
            </div>
            <div className="text-md">
              <b>Total CaCO<sub>3</sub> Needed:</b> {fmtUnits(out.total_caco3_needed_per_ac, 1)} lb/acre
            </div>

            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-medium text-red-700">Total 98G Needed</div>
              <div className="mt-1 text-3xl font-bold text-red-800">
                {fmtUnits(out.total_lbs98g_per_ac, 1)} lb/acre
              </div>
            </div>

            <details className="group">
              <summary className="cursor-pointer rounded px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                Breakdown by Product
              </summary>
              <ul className="ml-6 mt-2 list-disc space-y-1.5 text-sm">
                {out.rows.map((r, idx) => (
                  <li key={idx}>
                    {r.fertilizer}: {fmtUnits(r.lbs98gNeeded, 1)} lb 98G/acre
                    {isNum(r.contrib_N_lbs98g) && <> (N: {fmtUnits(r.contrib_N_lbs98g, 1)})</>}
                    {isNum(r.contrib_S_lbs98g) && <> (S: {fmtUnits(r.contrib_S_lbs98g, 1)})</>}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        <div className="mt-8">
          <BackButton />
        </div>
      </section>
    </main>
  );
}