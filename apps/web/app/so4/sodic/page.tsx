"use client";
import { useMemo, useState } from "react";
import { runSo4Sodic, type So4SodicInput } from "@calc-engine/core";

/* helpers */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (n: unknown, d = 2) => (isNum(n) ? n.toFixed(d) : "—");
const SO4_GREEN = "#2E7D32";

type Mode = "ppm" | "basesat";

export default function SO4SodicPage() {
  const [mode, setMode] = useState<Mode>("ppm");
  const [cec, setCec] = useState<number>(0);        // meq/100 g
  const [naPpm, setNaPpm] = useState<number>(0);    // ppm (when mode = ppm)
  const [naPct, setNaPct] = useState<number>(0);    // % base sat Na (when mode = basesat)

  const out = useMemo(() => {
    const input: So4SodicInput =
      mode === "ppm"
        ? { cec_meq_per_100g: Number(cec), sodium_ppm: Number(naPpm) }
        : { cec_meq_per_100g: Number(cec), baseSatNa_pct: Number(naPct) };

    return runSo4Sodic(input);
  }, [mode, cec, naPpm, naPct]);

  // derived counterpart for display (always defined by the engine)
  const derivedPct = out.baseSatNa_pct;
  const derivedPpm = out.sodium_ppm;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* slim brand bar */}
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-2xl font-bold">
          SO4 Pelletized Gypsum — Sodic Soil Remediation
        </h1>
        <p className="mb-4 text-sm text-gray-600">
          Enter <b>CEC</b> and either <b>Sodium (ppm)</b> or <b>% Base Saturation (Na)</b>.
          Internally the calculator uses <b>%Na</b>, deriving it from ppm when needed.
        </p>

        {/* Mode toggle */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Na input:</span>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              checked={mode === "ppm"}
              onChange={() => setMode("ppm")}
            />
            ppm
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              checked={mode === "basesat"}
              onChange={() => setMode("basesat")}
            />
            % Base Sat (Na)
          </label>
        </div>

        {/* Inputs (aligned) */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">CEC (meq/100 g)</span>
            <input
              type="number"
              step={0.1}
              min={0}
              value={cec}
              onChange={(e) => setCec(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>

          {mode === "ppm" ? (
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Sodium (ppm)</span>
              <input
                type="number"
                step={1}
                min={0}
                value={naPpm}
                onChange={(e) => setNaPpm(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          ) : (
            <label className="space-y-1">
              <span className="text-sm text-gray-600">% Base Sat (Na)</span>
              <input
                type="number"
                step={0.01}
                min={0}
                value={naPct}
                onChange={(e) => setNaPct(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          )}

          {/* Derived counterpart as read-only input so it aligns exactly */}
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Derived counterpart</span>
            <input
              type="text"
              readOnly
              value={mode === "ppm" ? `%Na ≈ ${fmt(derivedPct, 3)}%` : `ppm ≈ ${fmt(derivedPpm, 0)}`}
              className="h-9 w-full rounded border border-gray-200 bg-gray-100 px-2 text-sm"
            />
          </label>
        </div>

        <hr className="my-4" />

        {/* Output */}
        <div className="grid gap-2">
          <div className="text-lg">
            <b>Recommended SO4 rate:</b>{" "}
            {fmt(out.rate_tons_per_ac, 2)} <span className="text-gray-600">tons/ac</span>{" "}
            <span className="text-gray-400">|</span>{" "}
            {fmt(out.rate_lbs_so4_per_ac, 0)} <span className="text-gray-600">lb/ac</span>
          </div>

          <details className="group">
            <summary className="cursor-pointer rounded px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              Show calculation terms
            </summary>
            <div className="mt-2 grid gap-1 text-sm">
              <div>% Base Sat Na (used): {fmt(out.baseSatNa_pct, 3)}%</div>
              <div>Na (ppm): {fmt(out.sodium_ppm, 0)}</div>
              <div>Na (meq/L): {fmt(out.na_meq_per_L, 3)}</div>
              <div>Na (meq/100 g): {fmt(out.na_meq_per_100g, 3)}</div>
              <div>ESP (fraction): {fmt(out.esp, 4)}</div>
              <div>Rate (tons/ac) = meq Na/100 g × 1.7 → {fmt(out.rate_tons_per_ac, 3)}</div>
              <div>Rate (lb/ac) = tons/ac × 2000 → {fmt(out.rate_lbs_so4_per_ac, 0)}</div>
            </div>
          </details>

          {out.notes?.length ? (
            <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
              {out.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}

          <div className="text-xs text-gray-600">
            Note: If CEC ≤ 0, % base saturation can’t be computed; the tool returns a 0 recommendation.
          </div>
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
