"use client";
import { useMemo, useState } from "react";
import { runSo4HighMg } from "@calc-engine/core";

/* helpers */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (n: unknown, d = 2) => (isNum(n) ? n.toFixed(d) : "—");
const SO4_GREEN = "#2E7D32";

// ppm Mg per (meq/100g) of Mg
const PPM_PER_MEQ_PER_100G_MG = 120 as const;

type Basis = "percent" | "ppm";

/** Central place to change defaults */
const DEFAULTS = {
  cec: 20,
  currentPct: 25,
  currentPpm: 700,
  desiredPct: 15,
} as const;

export default function SO4HighMgPage() {
  // Basis for CURRENT only
  const [basisCurrent, setBasisCurrent] = useState<Basis>("percent");

  // Defaults chosen based on basis for current
  const [cec, setCec] = useState<number>(DEFAULTS.cec);
  const [currentMg, setCurrentMg] = useState<number>(
    basisCurrent === "ppm" ? DEFAULTS.currentPpm : DEFAULTS.currentPct
  );
  const [desiredMgPct, setDesiredMgPct] = useState<number>(DEFAULTS.desiredPct);

  // When the user flips basis, load the appropriate default for current Mg.
  const switchBasis = (b: Basis) => {
    setBasisCurrent(b);
    setCurrentMg(b === "ppm" ? DEFAULTS.currentPpm : DEFAULTS.currentPct);
  };

  // Build engine input: engine expects one basis for both values
  const engineInput = useMemo(() => {
    const c = Number(cec) || 0;
    if (basisCurrent === "ppm") {
      const currPpm = Number(currentMg) || 0;
      const desiredPpm = ((Number(desiredMgPct) || 0) / 100) * c * PPM_PER_MEQ_PER_100G_MG;
      return {
        cec_cmolkg: c,
        basis: "ppm" as const,
        currentMg: currPpm,
        desiredMg: desiredPpm,
      };
    } else {
      return {
        cec_cmolkg: c,
        basis: "percent" as const,
        currentMg: Number(currentMg) || 0,
        desiredMg: Number(desiredMgPct) || 0,
      };
    }
  }, [cec, basisCurrent, currentMg, desiredMgPct]);

  const out = useMemo(() => runSo4HighMg(engineInput), [engineInput]);

  // Derived current %Mg to show (read-only)
  const derivedCurrentPct =
    basisCurrent === "ppm"
      ? (Number(currentMg) / (Number(cec) || 1)) / (PPM_PER_MEQ_PER_100G_MG / 100)
      : Number(currentMg);

  const warnDesiredHigher =
    isNum(out.details?.desiredMgPct) &&
    isNum(out.details?.currentMgPct) &&
    out.details.desiredMgPct >= out.details.currentMgPct;

  const unitsCurrent = basisCurrent === "ppm" ? "ppm" : "% base saturation";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* slim brand bar */}
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-2xl font-bold">SO4 Pelletized Gypsum — High Mg Amendment</h1>
        <p className="mb-4 text-sm text-gray-600">
          Enter <b>CEC</b>, <b>current Mg</b> as % base saturation or ppm, and <b>desired Mg</b> as % base saturation.
          We convert as needed and compute gypsum required to lower %Mg via Ca displacement.
        </p>

        {/* Inputs */}
        <div className="mb-4 grid grid-cols-1 gap-4">
          {/* CEC */}
          <label className="space-y-1">
            <span className="text-sm text-gray-600">CEC (cmolc/kg)</span>
            <input
              type="number"
              step={0.1}
              min={0}
              value={cec}
              onChange={(e) => setCec(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>

          {/* Basis toggle for CURRENT only */}
          <fieldset className="rounded border border-gray-200 p-3">
            <legend className="text-sm font-medium">Enter current Mg as</legend>
            <div className="mt-1 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="basisCurrent"
                  value="percent"
                  checked={basisCurrent === "percent"}
                  onChange={() => switchBasis("percent")}
                />
                % base saturation
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="basisCurrent"
                  value="ppm"
                  checked={basisCurrent === "ppm"}
                  onChange={() => switchBasis("ppm")}
                />
                ppm (soil test Mg)
              </label>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {basisCurrent === "ppm"
                ? "We convert ppm ↔ % base saturation using CEC (Mg factor = 120 ppm per meq/100g)."
                : "Calculations use % base saturation directly."}
            </div>
          </fieldset>

          {/* Editable inputs row */}
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            {/* Current Mg */}
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Current Mg ({unitsCurrent})</span>
              <input
                type="number"
                step={basisCurrent === "ppm" ? 1 : 0.1}
                min={0}
                value={currentMg}
                onChange={(e) => setCurrentMg(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>

            {/* Desired Mg — always % base saturation */}
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Desired Mg (% base saturation)</span>
              <input
                type="number"
                step={0.1}
                min={0}
                value={desiredMgPct}
                onChange={(e) => setDesiredMgPct(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>

          {/* Calculated (read-only) */}
          <div className="grid grid-cols-1 gap-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Calculated %Mg (used)</span>
              <input
                type="text"
                readOnly
                aria-readonly="true"
                value={`${fmt(derivedCurrentPct, 2)}%`}
                className="h-9 w-full cursor-not-allowed rounded border border-gray-200 bg-gray-100 px-2 text-sm"
              />
            </label>
            <div className="text-xs text-gray-500">
              Read-only. This is the %Mg the calculator actually uses (derived from Current Mg and CEC).
            </div>
          </div>

          {warnDesiredHigher && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              Desired %Mg is ≥ current; rate will be 0.
            </div>
          )}
        </div>

        <hr className="my-4" />

        {/* Output */}
        <div className="grid gap-2">
          <div className="text-lg">
            <b>Gypsum rate:</b>{" "}
            {fmt(out.rate_ton_ac, 2)} <span className="text-gray-600">tons/ac</span>{" "}
            <span className="text-gray-400">|</span>{" "}
            {fmt(out.rate_lbs_ac, 0)} <span className="text-gray-600">lb/ac</span>
          </div>

          <details className="group">
            <summary className="cursor-pointer rounded px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              Show calculation terms
            </summary>
            <div className="mt-2 grid gap-1 text-sm">
              <div>Current %Mg (normalized): {fmt(out.details.currentMgPct, 2)}%</div>
              <div>Desired %Mg (normalized): {fmt(out.details.desiredMgPct, 2)}%</div>
              <div>meq Mg (Calc 1): {fmt(out.details.meqMg, 3)}</div>
              <div>%Mg to lower (Calc 2): {fmt(out.details.pctToLower, 3)}</div>
              <div>Fraction of current (Calc 3): {fmt(out.details.fractionOfCurrent, 3)}</div>
              <div>meq to displace (Calc 4): {fmt(out.details.meqToDisplace, 3)}</div>
              <div>Factor (tons per meq): {out.details.factor_ton_per_meq}</div>
            </div>
          </details>
        </div>

        <div className="mt-6">
          <a href="/so4" className="text-sm text-blue-600 hover:underline">
            ← Back to SO4 calculators
          </a>
        </div>
      </section>
    </main>
  );
}
