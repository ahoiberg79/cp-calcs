"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calc98GApplicationRate,
  list98GTargetPHs,
  type Tillage,
  type UseCase98GApplication,
} from "@calc-engine/core";

const BRAND_RED = "#B21F2D";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (n: unknown, d = 0) =>
  isNum(n)
    ? new Intl.NumberFormat(undefined, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(n)
    : "—";

function BackButton() {
  return (
    <a
      href="/98g"
      className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
    >
      Back to 98G calculators
    </a>
  );
}

export default function NinetyEightGApplicationRatePage() {
  const [useCase, setUseCase] = useState<UseCase98GApplication>("Correction");
  const [till, setTill] = useState<Tillage>("Conventional");

  const [soil_pH, setSoil] = useState<number>(5.7);
  const [buffer_pH, setBuffer] = useState<number>(6.4);
  const [target98g, setTarget98g] = useState<number | null>(6.0);

  const [nitrogenUnitsApplied, setNitrogenUnitsApplied] = useState<number>(100);

  const targets98gList = useMemo(() => {
    return list98GTargetPHs("UW", till);
  }, [till]);

  useEffect(() => {
    if (target98g == null && targets98gList.length > 0) {
      setTarget98g(targets98gList.includes(6.0) ? 6.0 : targets98gList[0]);
    }
  }, [target98g, targets98gList]);

  const result = useMemo(() => {
    if (useCase === "Maintenance") {
      return calc98GApplicationRate({
        useCase: "Maintenance",
        nitrogen_units_applied: nitrogenUnitsApplied,
      });
    }

    if (target98g == null) return null;

    try {
      return calc98GApplicationRate({
        useCase: "Correction",
        institution: "UW",
        tillage: till,
        soil_pH,
        buffer_pH,
        target_pH_98g: target98g,
      });
    } catch {
      return null;
    }
  }, [useCase, till, soil_pH, buffer_pH, target98g, nitrogenUnitsApplied]);

  const onSelectNumber =
    (setter: (v: number | null) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setter(value === "" ? null : Number(value));
    };

  const resultDescription = (() => {
    if (!result) return null;

    if (result.method === "maintenance") {
      return (
        <>
          This maintenance recommendation is set at a 1:1 ratio with nitrogen units applied. If
          you want a full neutralization recommendation, use the{" "}
          <a href="/98g/acidification" className="text-red-700 underline hover:text-red-800">
            Fertilizer Acidity Calculator
          </a>.
        </>
      );
    }

    if (result.method === "safety_net") {
      return (
        <>
          The standard correction equation returned a rate at or below 100 lb/acre while soil pH
          remained below the selected target pH. Safety-net logic was applied at 100 lb/acre per
          0.1 soil pH unit needed to reach the target.
        </>
      );
    }

    return <>This recommendation is based on the selected 98G correction equation.</>;
  })();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">98G Application Rate Calculator</h1>
        <p className="mb-6 max-w-3xl text-sm leading-6 text-gray-600">
          Estimate a recommended 98G application rate for either correction or maintenance.
          Correction mode uses the Wisconsin-based 98G equation set with a built-in safety net for
          low results. Maintenance mode uses a 1:1 ratio with nitrogen units applied.
        </p>

        <div className="mb-6 rounded-3xl bg-gray-100/70 p-5">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G Use Case</span>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as UseCase98GApplication)}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="Correction">Correction</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>

            {useCase === "Correction" && (
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Tillage</span>
                <select
                  value={till}
                  onChange={(e) => setTill(e.target.value as Tillage)}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="Conventional">Conventional</option>
                  <option value="No-Till">No-Till</option>
                </select>
              </label>
            )}
          </div>

          {useCase === "Correction" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Soil pH</span>
                <input
                  type="number"
                  step={0.1}
                  value={soil_pH}
                  onChange={(e) => setSoil(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-600">Buffer pH</span>
                <input
                  type="number"
                  step={0.1}
                  value={buffer_pH}
                  onChange={(e) => setBuffer(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-600">Target pH</span>
                <select
                  value={target98g ?? ""}
                  onChange={onSelectNumber(setTarget98g)}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="">Select target pH</option>
                  {targets98gList.map((p) => (
                    <option key={`98g-${p}`} value={p}>
                      {p.toFixed(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Nitrogen units applied</span>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={nitrogenUnitsApplied}
                  onChange={(e) => setNitrogenUnitsApplied(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </label>
            </div>
          )}
        </div>

        {!result && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Select a valid target pH to view the recommended 98G rate.
          </div>
        )}

        <div className="relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <span
            className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-full"
            style={{ backgroundColor: BRAND_RED }}
          />

          <div className="mb-4 text-center text-lg font-semibold text-gray-900">
            Recommended 98G Rate
          </div>

          <div className="flex justify-center">
            <div className="min-w-[260px] rounded-2xl border border-red-100 bg-red-50 px-8 py-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-700">
                {result ? `${fmt(result.lbs_ac_display, 0)} lb/acre` : "—"}
              </div>
            </div>
          </div>

          {resultDescription && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {resultDescription}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}