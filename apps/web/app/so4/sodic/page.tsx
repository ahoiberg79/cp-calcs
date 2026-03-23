"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { runSo4Sodic, type So4SodicInput } from "@calc-engine/core";

const SO4_GREEN = "#2E7D32";

type Mode = "ppm" | "basesat";

const fmt = (n: number, d = 2) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);

function BackButton() {
  return (
    <Link
      href="/so4"
      className="inline-flex items-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
    >
      Back to SO4 calculators
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

export default function SO4SodicPage() {
  const [mode, setMode] = useState<Mode>("ppm");
  const [cec, setCec] = useState<number>(15);
  const [naPpm, setNaPpm] = useState<number>(300);
  const [naPct, setNaPct] = useState<number>(8);

  const out = useMemo(() => {
    const input: So4SodicInput =
      mode === "ppm"
        ? { cec_meq_per_100g: Number(cec), sodium_ppm: Number(naPpm) }
        : { cec_meq_per_100g: Number(cec), baseSatNa_pct: Number(naPct) };

    return runSo4Sodic(input);
  }, [mode, cec, naPpm, naPct]);

  const derivedPct = out.baseSatNa_pct;
  const derivedPpm = out.sodium_ppm;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <BackButton />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SO4 Sodic Soil Amelioration Calculator
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Estimate a recommended SO4 Rate for sodic soil remediation using CEC
            and either sodium ppm or % Na. The calculator normalizes sodium to a
            % Na basis, then converts exchangeable sodium to an SO4 requirement.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Yearly application rates should be based on economic and operational
            considerations. In general, rates in excess of 600 lb/acre will not be 
            practical for economic and logistical reasons. Rates in excess of 600
            lb/acre can be split over multiple years.
          </p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Inputs</h2>

          <div className="mb-4">
            <fieldset className="rounded-2xl border border-gray-200 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">
                Sodium input method
              </legend>

              <div className="mt-1 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={mode === "ppm"}
                    onChange={() => setMode("ppm")}
                  />
                  Sodium (ppm)
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={mode === "basesat"}
                    onChange={() => setMode("basesat")}
                  />
                  % Na
                </label>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                The calculator uses % Na internally and derives the counterpart
                value when needed.
              </div>
            </fieldset>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">CEC (meq/100g)</span>
              <input
                type="number"
                step={0.1}
                min={0}
                value={cec}
                onChange={(e) =>
                  setCec(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  onChange={(e) =>
                    setNaPpm(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </label>
            ) : (
              <label className="space-y-1">
                <span className="text-sm text-gray-600">% Na</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={naPct}
                  onChange={(e) =>
                    setNaPct(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </label>
            )}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-700">
                Derived counterpart
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {mode === "ppm"
                  ? `${fmt(derivedPct, 2)}% Na`
                  : `${fmt(derivedPpm, 0)} ppm`}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Read-only value derived from the selected sodium input method.
              </div>
            </div>
          </div>

          {out.notes?.length ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {out.notes.join(" ")}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ResultCard
            label="% Na used"
            value={`${fmt(out.baseSatNa_pct, 2)}%`}
          />

          <ResultCard
            label="Exchangeable sodium"
            value={`${fmt(out.na_meq_per_100g, 2)} meq/100g`}
          />

          <ResultCard
            label="ESP"
            value={`${fmt(out.esp, 3)}`}
          />
        </div>

        <div className="relative mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <span
            className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-full"
            style={{ backgroundColor: SO4_GREEN }}
          />

          <div className="mb-4 text-center text-lg font-semibold text-gray-900">
            SO4 Needed to Achieve Desired Level
          </div>

          <div className="flex justify-center">
            <div className="min-w-[260px] rounded-2xl border border-green-100 bg-green-50 px-8 py-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-700">
                {fmt(out.rate_lbs_so4_per_ac, 0)} lb/acre
              </div>
              <div className="mt-1 text-sm text-green-800">
                {fmt(out.rate_tons_per_ac, 2)} tons/acre
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
            Based on normalized % Na and CEC, the calculator estimates
            exchangeable sodium and converts that into a recommended SO4 Rate
            using the built-in sodic soil amendment factor.
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
                <div className="font-medium text-gray-700">% Na used</div>
                <div className="mt-1 text-gray-600">
                  Source-of-truth sodium saturation
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.baseSatNa_pct, 3)}%
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Sodium (ppm)</div>
                <div className="mt-1 text-gray-600">
                  Provided or derived from % Na and CEC
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.sodium_ppm, 0)} ppm
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Sodium (meq/L)</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.sodium_ppm, 0)} ÷ 23
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.na_meq_per_L, 3)} meq/L
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">
                  Exchangeable sodium
                </div>
                <div className="mt-1 text-gray-600">
                  {fmt(cec, 1)} × ({fmt(out.baseSatNa_pct, 3)} ÷ 100)
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.na_meq_per_100g, 3)} meq/100g
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">ESP</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.baseSatNa_pct, 3)} ÷ 100
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.esp, 4)}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Amendment factor</div>
                <div className="mt-1 text-gray-600">
                  Exchangeable sodium × 1.7
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.rate_tons_per_ac, 3)} tons/acre
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                <div className="font-medium text-gray-700">SO4 Product Rate</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.rate_tons_per_ac, 3)} × 2000
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.rate_lbs_so4_per_ac, 0)} lb/acre
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              If CEC is 0 or less, the calculator returns a 0 recommendation.
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