"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { runSo4Sulfur, type So4SulfurInput } from "@calc-engine/core";

const SO4_GREEN = "#2E7D32";

type Crop = So4SulfurInput["crop"];
const CROPS: Crop[] = ["Corn", "Soybean", "Wheat", "Alfalfa"];

const DEFAULT_YIELDS: Record<Crop, number> = {
  Corn: 200,
  Soybean: 70,
  Wheat: 60,
  Alfalfa: 4.0,
};

const fmt = (n: number, dec = 0) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);

function BackButton() {
  return (
    <Link
      href="/so4"
      className="inline-flex items-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
    >
      ← Back to SO4 calculators
    </Link>
  );
}

function ResultCard(props: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-600">{props.label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{props.value}</div>
      {props.subtext ? (
        <div className="mt-1 text-sm text-gray-500">{props.subtext}</div>
      ) : null}
    </div>
  );
}

export default function SO4SulfurRatePage() {
  const [crop, setCrop] = useState<Crop>("Corn");
  const [yieldGoal, setYieldGoal] = useState<number>(DEFAULT_YIELDS.Corn);
  const [omPct, setOmPct] = useState<number>(2.5);

  const sulfurPpm = 0;

  useEffect(() => {
    setYieldGoal(DEFAULT_YIELDS[crop]);
  }, [crop]);

  const out = useMemo(
    () =>
      runSo4Sulfur({
        crop,
        yieldGoal: Number(yieldGoal),
        organicMatterPct: Number(omPct),
        sulfurPpm,
      }),
    [crop, yieldGoal, omPct]
  );

  const yieldUnit = crop === "Alfalfa" ? "tons/acre" : "bushels/acre";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <BackButton />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SO4 Sulfur Rate Calculator
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Estimate sulfur need from crop uptake, yield goal, and organic
            matter, then convert that requirement into a recommended SO4 Rate.
            Soil test sulfate-S is not used in this web version due to limited
            reliability in practice. Crop sulfur demand is based on values
            from Ward Labs.
          </p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Inputs</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Crop</span>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value as Crop)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                Yield goal ({yieldUnit})
              </span>
              <input
                type="number"
                min={0}
                step={crop === "Alfalfa" ? 0.1 : 1}
                value={yieldGoal}
                onChange={(e) =>
                  setYieldGoal(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-gray-600">Organic matter (%)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={omPct}
                onChange={(e) =>
                  setOmPct(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ResultCard
            label="Crop sulfur demand"
            value={`${fmt(out.details.sulfurDemandLbPerA, 1)} lb S/acre`}
          />

          <ResultCard
            label="Organic matter credit"
            value={`${fmt(out.details.sulfurCreditFromOMLbPerA, 1)} lb S/acre`}
          />

          <ResultCard
            label="Total sulfur needed"
            value={`${fmt(out.sulfurNeededLbPerA, 1)} lb S/acre`}
          />
        </div>

        <div className="relative mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <span
            className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-full"
            style={{ backgroundColor: SO4_GREEN }}
          />

          <div className="mb-4 text-center text-lg font-semibold text-gray-900">
            Recommended SO4 Rate
          </div>

          <div className="flex justify-center">
            <div className="min-w-[260px] rounded-2xl border border-green-100 bg-green-50 px-8 py-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-700">
                {fmt(out.rateLbPerA, 0)} lb/acre
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
            Based on crop sulfur demand minus organic matter credit, the
            calculator estimates total sulfur needed and converts that to a
            recommended SO4 Rate using 17% sulfur.
          </div>
        </div>

        <details className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Calculation breakdown
              </h2>
              <span className="text-sm text-green-700">▼</span>
            </div>
          </summary>

          <div className="px-5 pb-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Crop sulfur demand</div>
                <div className="mt-1 text-gray-600">
                  {fmt(yieldGoal, crop === "Alfalfa" ? 1 : 0)} {yieldUnit} ×{" "}
                  {fmt(out.details.cropCoefficient, crop === "Alfalfa" ? 1 : 2)}
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.sulfurDemandLbPerA, 1)} lb S/acre
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Organic matter credit</div>
                <div className="mt-1 text-gray-600">{fmt(omPct, 1)} × 3</div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.sulfurCreditFromOMLbPerA, 1)} lb S/acre
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Sulfur needed</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.details.sulfurDemandLbPerA, 1)} -{" "}
                  {fmt(out.details.sulfurCreditFromOMLbPerA, 1)} -{" "}
                  {fmt(out.details.sulfurCreditFromSoilLbPerA, 1)}
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.sulfurNeededLbPerA, 1)} lb S/acre
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">SO4 Product Rate</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.sulfurNeededLbPerA, 1)} × (100 ÷ 17)
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.rateLbPerA, 0)} lb/acre
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Soil test sulfate-S is fixed at 0 in this web version.
            </div>
          </div>
        </details>

        <div className="mt-8">
          <BackButton />
        </div>
      </section>
    </main>
  );
}