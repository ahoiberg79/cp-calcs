"use client";
import { useMemo, useState } from "react";
import { runSo4Sulfur, type Crop } from "@calc-engine/core";

/* helpers */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (n: unknown, d = 1) => (isNum(n) ? n.toFixed(d) : "—");
const SO4_GREEN = "#2E7D32";

const CROPS: Crop[] = ["Corn", "Soybean", "Wheat", "Alfalfa"];

export default function SO4SulfurRatePage() {
  const [crop, setCrop] = useState<Crop>("Corn");
  const [yieldGoal, setYieldGoal] = useState<number>(200); // you can change to 0 if you prefer
  const [sulfurPpm, setSulfurPpm] = useState<number>(0);   // default 0 as requested
  const [omPct, setOmPct] = useState<number>(0);           // default 0 as requested

  const out = useMemo(
    () =>
      runSo4Sulfur({
        crop,
        yieldGoal: Number(yieldGoal),
        sulfurPpm: Number(sulfurPpm),
        organicMatterPct: Number(omPct),
      }),
    [crop, yieldGoal, sulfurPpm, omPct]
  );

  const recLbs = out.rate_lbs_SO4_per_ac;
  const recTons = recLbs / 2000;

  const yieldUnit = crop === "Alfalfa" ? "tons/ac" : "bu/ac";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* slim brand bar */}
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-2xl font-bold">SO4 Pelletized Gypsum — Sulfur Rate</h1>
        <p className="mb-4 text-sm text-gray-600">
          Inputs: <b>Crop</b>, <b>Yield goal</b>, <b>Soil test sulfate-S (ppm)</b>, and <b>Organic matter (%)</b>.
          Output is a <b>recommended SO4 product rate</b> (lbs/ac). Negative results are floored to 0.
        </p>

        {/* Inputs */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Crop</span>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value as Crop)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">
              Yield goal <span className="text-gray-500">({yieldUnit})</span>
            </span>
            <input
              type="number"
              step={crop === "Alfalfa" ? 0.1 : 1}
              min={0}
              value={yieldGoal}
              onChange={(e) => setYieldGoal(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Sulfur (soil test, ppm)</span>
            <input
              type="number"
              step={0.1}
              min={0}
              value={sulfurPpm}
              onChange={(e) => setSulfurPpm(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Organic matter (%)</span>
            <input
              type="number"
              step={0.1}
              min={0}
              value={omPct}
              onChange={(e) => setOmPct(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
        </div>

        <hr className="my-4" />

        {/* Output */}
        <div className="grid gap-2">
          <div className="text-lg">
            <b>Recommended SO4 rate:</b>{" "}
            {fmt(recLbs, 0)} <span className="text-gray-600">lb/ac</span>{" "}
            <span className="text-gray-400">|</span>{" "}
            {fmt(recTons, 2)} <span className="text-gray-600">tons/ac</span>
          </div>

          <details className="group">
            <summary className="cursor-pointer rounded px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              Show calculation terms
            </summary>
            <div className="mt-2 grid gap-1 text-sm">
              <div>Yield term: {fmt(out.details.yieldTerm, 3)}</div>
              <div>S-ppm term: {fmt(out.details.sulfurTerm, 3)}</div>
              <div>OM term: {fmt(out.details.omTerm, 3)}</div>
              <div>Pre-conversion (S basis): {fmt(out.details.preConversion, 3)}</div>
              <div>Conversion used: ×(100/17)</div>
            </div>
          </details>

          <div className="text-xs text-gray-600">
            Note: If the computed value is negative, the tool returns 0 lbs/ac.
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
