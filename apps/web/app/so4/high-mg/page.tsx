"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { runSo4HighMg } from "@calc-engine/core";

const SO4_GREEN = "#2E7D32";
const PPM_PER_MEQ_PER_100G_MG = 120.4 as const;

type Basis = "percent" | "ppm";

const DEFAULTS = {
  cec: 20,
  currentPct: 25,
  currentPpm: 700,
  desiredPct: 15,
} as const;

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const fmt = (n: unknown, d = 2) =>
  isNum(n)
    ? new Intl.NumberFormat(undefined, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(n)
    : "—";

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
  highlight?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm",
        props.highlight
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <div className="text-sm font-medium text-gray-600">{props.label}</div>
      <div
        className={[
          "mt-1 font-bold",
          props.large ? "text-3xl md:text-4xl" : "text-2xl",
          props.highlight ? "text-green-800" : "text-gray-900",
        ].join(" ")}
      >
        {props.value}
      </div>
      {props.subtext ? (
        <div className="mt-1 text-sm text-gray-500">{props.subtext}</div>
      ) : null}
    </div>
  );
}

export default function SO4HighMgPage() {
  const [basisCurrent, setBasisCurrent] = useState<Basis>("percent");
  const [cec, setCec] = useState<number>(DEFAULTS.cec);
  const [currentMg, setCurrentMg] = useState<number>(DEFAULTS.currentPct);
  const [desiredMgPct, setDesiredMgPct] = useState<number>(DEFAULTS.desiredPct);

  const switchBasis = (b: Basis) => {
    setBasisCurrent(b);
    setCurrentMg(b === "ppm" ? DEFAULTS.currentPpm : DEFAULTS.currentPct);
  };

  const engineInput = useMemo(() => {
    const c = Number(cec) || 0;

    if (basisCurrent === "ppm") {
      const currPpm = Number(currentMg) || 0;
      const desiredPpm =
        ((Number(desiredMgPct) || 0) / 100) * c * PPM_PER_MEQ_PER_100G_MG;

      return {
        cec_cmolkg: c,
        basis: "ppm" as const,
        currentMg: currPpm,
        desiredMg: desiredPpm,
      };
    }

    return {
      cec_cmolkg: c,
      basis: "percent" as const,
      currentMg: Number(currentMg) || 0,
      desiredMg: Number(desiredMgPct) || 0,
    };
  }, [cec, basisCurrent, currentMg, desiredMgPct]);

  const out = useMemo(() => runSo4HighMg(engineInput), [engineInput]);

  const derivedCurrentPct =
    basisCurrent === "ppm"
      ? ((Number(currentMg) || 0) / ((Number(cec) || 1) * PPM_PER_MEQ_PER_100G_MG)) * 100
      : Number(currentMg) || 0;

  const warnDesiredHigher =
    isNum(out.details?.desiredMgPct) &&
    isNum(out.details?.currentMgPct) &&
    out.details.desiredMgPct >= out.details.currentMgPct;

  const unitsCurrent = basisCurrent === "ppm" ? "ppm" : "% Mg";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <BackButton />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SO4 High Mg Amendment Calculator
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Estimate an SO4 Product Rate to lower magnesium saturation by
            displacing exchangeable Mg with calcium. Enter CEC, current Mg, and
            desired Mg, and the calculator will convert inputs as needed.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Inputs</h2>

            <div className="grid grid-cols-1 gap-4">
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

              <fieldset className="rounded-2xl border border-gray-200 p-4">
                <legend className="px-1 text-sm font-medium text-gray-700">
                  Enter current Mg as
                </legend>

                <div className="mt-1 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="basisCurrent"
                      value="percent"
                      checked={basisCurrent === "percent"}
                      onChange={() => switchBasis("percent")}
                    />
                    % Mg
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="basisCurrent"
                      value="ppm"
                      checked={basisCurrent === "ppm"}
                      onChange={() => switchBasis("ppm")}
                    />
                    ppm Mg
                  </label>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  When ppm Mg is entered, the calculator converts it to % Mg
                  using CEC.
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm text-gray-600">
                    Current Mg ({unitsCurrent})
                  </span>
                  <input
                    type="number"
                    step={basisCurrent === "ppm" ? 1 : 0.1}
                    min={0}
                    value={currentMg}
                    onChange={(e) =>
                      setCurrentMg(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm text-gray-600">Desired Mg (% Mg)</span>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={desiredMgPct}
                    onChange={(e) =>
                      setDesiredMgPct(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-700">
                  Calculated current % Mg used
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {fmt(derivedCurrentPct, 2)}%
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Read-only value used by the calculator after conversion.
                </div>
              </div>

              {warnDesiredHigher && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Desired % Mg is equal to or greater than current % Mg, so the
                  calculated rate is 0.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
            <div className="space-y-3 text-sm leading-6 text-gray-600">
              <p>
                The calculator first normalizes magnesium to a % Mg basis, then
                estimates how much exchangeable Mg must be displaced to reach the
                desired level.
              </p>
              <p>
                That displacement is converted to an SO4 Product Rate using the
                amendment factor built into the calculator.
              </p>
              <p>
                Yearly application rates should be based on economic and operational
                considerations. In general, rates in excess of 600 lb/acre will not be 
                practical for economic and logistical reasons. Rates in excess of 600
                lb/acre can be split over multiple years.
              </p>
              <p>
                Caution should be taken with soil CEC values less than 10 meq/100g as 
                excessive application rates of gypsum on low CEC soils can result in cation
                imbalance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ResultCard
            label="Current Mg"
            value={`${fmt(out.details.currentMgPct, 2)}%`}
          />

          <ResultCard
            label="Desired Mg"
            value={`${fmt(out.details.desiredMgPct, 2)}%`}
          />

          <ResultCard
            label="% Mg to lower"
            value={`${fmt(out.details.pctToLower, 2)}%`}
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
                {fmt(out.rate_lbs_ac, 0)} lb/acre
              </div>
              <div className="mt-1 text-sm text-green-800">
                {fmt(out.rate_ton_ac, 2)} tons/acre
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
            Based on current Mg, desired Mg, and CEC, the calculator estimates how much exchangeable Mg must be displaced and converts that into an SO4 Product Rate.
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
                <div className="font-medium text-gray-700">Current Mg</div>
                <div className="mt-1 text-gray-600">
                  Normalized to % Mg
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.currentMgPct, 2)}%
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Desired Mg</div>
                <div className="mt-1 text-gray-600">
                  Normalized to % Mg
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.desiredMgPct, 2)}%
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Exchangeable Mg</div>
                <div className="mt-1 text-gray-600">
                  CEC × current % Mg
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.meqMg, 3)} meq/100g
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Fraction to displace</div>
                <div className="mt-1 text-gray-600">
                  % Mg to lower ÷ current % Mg
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.fractionOfCurrent, 3)}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Mg to displace</div>
                <div className="mt-1 text-gray-600">
                  Exchangeable Mg × fraction to displace
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.meqToDisplace, 3)} meq/100g
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Amendment factor</div>
                <div className="mt-1 text-gray-600">
                  Built-in conversion
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.details.factor_ton_per_meq, 2)} tons/acre per meq
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                <div className="font-medium text-gray-700">SO4 Product Rate</div>
                <div className="mt-1 text-gray-600">
                  {fmt(out.details.meqToDisplace, 3)} × {fmt(out.details.factor_ton_per_meq, 2)}
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  = {fmt(out.rate_ton_ac, 2)} tons/acre
                </div>
              </div>
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