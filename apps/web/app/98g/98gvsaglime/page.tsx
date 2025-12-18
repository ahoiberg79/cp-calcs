"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calc98G,
  calcAglime,
  economics,
  listTargetPHs,
  type EquationSet,
  type Tillage,
  type UseCase98G,
} from "@calc-engine/core";

/* ---- UI constants & helpers ---- */
const BRAND_RED = "#B21F2D";
const ALL_SETS: EquationSet[] = ["UW", "ISU"];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (n: unknown, d = 2) =>
  isNum(n)
    ? new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
    : "—";
const money = (n: unknown) =>
  isNum(n) ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n) : "—";

export default function NinetyEightGVsAglimePage() {
  // ---- Defaults ----
  const [useCase, setUseCase] = useState<UseCase98G>("Correction");
  const [inst, setInst] = useState<EquationSet>("UW");
  const [till, setTill] = useState<Tillage>("Conventional");

  const [soil_pH, setSoil] = useState<number>(5.7);
  const [buffer_pH, setBuffer] = useState<number>(6.4);

  // Target pH can be null if invalid for the chosen equation set (forces user to choose)
  const [target98g, setTarget98g] = useState<number | null>(6.0);
  const [targetAglime, setTargetAglime] = useState<number | null>(6.5);

  const [cost98gPerTon, setCost98gPerTon] = useState<number>(295);
  const [costAglimePerTon, setCostAglimePerTon] = useState<number>(40);
  const [aglimeECCE, setAglimeECCE] = useState<number>(68.8);

  const [pricePerBu, setPricePerBu] = useState<number>(4.0);
  const [yield98g, setYield98g] = useState<number>(8);
  const [yieldAglime, setYieldAglime] = useState<number>(0);

  /* ---- Target pH lists ---- */
  // 98G targets = union across UW & ISU (equation set doesn't matter for 98G)
  const targets98gList = useMemo(() => {
    const s = new Set<number>();
    for (const es of ALL_SETS) {
      for (const p of listTargetPHs("98G", es, till)) s.add(p);
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [till]);

  // Aglime targets depend on equation set + tillage
  const targetsAglimeList = useMemo(() => listTargetPHs("Aglime", inst, till), [inst, till]);

  /* ---- Validate Aglime target when ES/tillage changes ---- */
  useEffect(() => {
    if (targetAglime != null && !targetsAglimeList.includes(targetAglime)) {
      window.alert(
        `Target pH ${targetAglime.toFixed(1)} is not available for ${inst} (${till}) with Aglime.\n` +
          `Please choose a valid Target pH for the selected equation set.`
      );
      setTargetAglime(null);
    }
  }, [inst, till, targetsAglimeList, targetAglime]);

  // Re-suggest defaults if cleared and still valid
  useEffect(() => {
    if (target98g == null && targets98gList.includes(6.0)) setTarget98g(6.0);
  }, [target98g, targets98gList]);
  useEffect(() => {
    if (targetAglime == null && targetsAglimeList.includes(6.5)) setTargetAglime(6.5);
  }, [targetAglime, targetsAglimeList]);

  /* ---- Calculations ---- */
  const rate98g = useMemo(() => {
    if (useCase === "Maintenance") {
      try {
        return calc98G({
          useCase,
          institution: inst, // irrelevant, but API requires it
          tillage: till,
          soil_pH,
          buffer_pH,
          target_pH_98g: targets98gList[0] ?? 6.0,
        });
      } catch {
        /* noop */
      }
    } else {
      if (target98g == null) return null;
      // Try current equation set first, then fall back to the other set
      const trySets: EquationSet[] = inst === "UW" ? ["UW", "ISU"] : ["ISU", "UW"];
      for (const es of trySets) {
        try {
          return calc98G({
            useCase,
            institution: es,
            tillage: till,
            soil_pH,
            buffer_pH,
            target_pH_98g: target98g,
          });
        } catch {
          /* try next */
        }
      }
    }
    return null;
  }, [useCase, inst, till, soil_pH, buffer_pH, target98g, targets98gList]);

  const rateAglime = useMemo(() => {
    try {
      if (targetAglime == null) return null;
      return calcAglime({
        institution: inst,
        tillage: till,
        soil_pH,
        buffer_pH,
        target_pH_aglime: targetAglime,
        ecce_percent: aglimeECCE,
      });
    } catch {
      return null;
    }
  }, [inst, till, soil_pH, buffer_pH, targetAglime, aglimeECCE]);

  const econ98g = useMemo(() => {
    const tons = rate98g?.tons_ac ?? 0;
    return economics(tons, cost98gPerTon, yield98g, pricePerBu);
  }, [rate98g, cost98gPerTon, yield98g, pricePerBu]);

  const econAglime = useMemo(() => {
    const tons = rateAglime?.tons_ac ?? 0;
    return economics(tons, costAglimePerTon, yieldAglime, pricePerBu);
  }, [rateAglime, costAglimePerTon, yieldAglime, pricePerBu]);

  // Helper for selects with nullable numbers
  const onSelectNumber =
    (setter: (v: number | null) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setter(v === "" ? null : Number(v));
    };

  /* ---- UI ---- */
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* brand bar (red) */}
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <h1 className="mb-2 text-2xl font-bold">98G vs Aglime</h1>
        <p className="mb-6 max-w-3xl text-sm text-gray-600">
          Compare 98G pelletized limestone vs Aglime using UW/ISU equations. 98G target pH options are shared across
          institutions; Aglime target pH depends on the selected equation set.
        </p>

        {/* controls panel */}
        <div className="mb-6 rounded-3xl bg-gray-100/70 p-5">
          {/* row 1: scenario */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G Use Case</span>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as UseCase98G)}
                className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Correction">Correction</option>
                <option value="Maintenance">Maintenance (250 lb/ac)</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Equation Set</span>
              <select
                value={inst}
                onChange={(e) => setInst(e.target.value as EquationSet)}
                className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="UW">UW</option>
                <option value="ISU">ISU</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Tillage</span>
              <select
                value={till}
                onChange={(e) => setTill(e.target.value as Tillage)}
                className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Conventional">Conventional</option>
                <option value="No-Till">No-Till</option>
              </select>
            </label>
          </div>

          {/* row 2: soil & targets */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Soil pH (WpH)</span>
              <input
                type="number"
                step={0.1}
                value={soil_pH}
                onChange={(e) => setSoil(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Buffer pH (BpH)</span>
              <input
                type="number"
                step={0.1}
                value={buffer_pH}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>

            {useCase === "Correction" && (
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Target pH (98G)</span>
                <select
                  value={target98g ?? ""}
                  onChange={onSelectNumber(setTarget98g)}
                  className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">— select —</option>
                  {targets98gList.map((p) => (
                    <option key={`98g-${p}`} value={p}>
                      {p.toFixed(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-gray-600">Target pH (Aglime)</span>
              <select
                value={targetAglime ?? ""}
                onChange={onSelectNumber(setTargetAglime)}
                className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">— select —</option>
                {targetsAglimeList.map((p) => (
                  <option key={`ag-${p}`} value={p}>
                    {p.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* row 3: economics */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G Cost/T</span>
              <input
                type="number"
                step={1}
                value={cost98gPerTon}
                onChange={(e) => setCost98gPerTon(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Aglime Cost/T</span>
              <input
                type="number"
                step={1}
                value={costAglimePerTon}
                onChange={(e) => setCostAglimePerTon(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Aglime ECCE/NI (%)</span>
              <input
                type="number"
                step={0.1}
                value={aglimeECCE}
                onChange={(e) => setAglimeECCE(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Crop price ($/bu)</span>
              <input
                type="number"
                step={0.01}
                value={pricePerBu}
                onChange={(e) => setPricePerBu(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Yield increase (98G, bu/A)</span>
              <input
                type="number"
                step={0.1}
                value={yield98g}
                onChange={(e) => setYield98g(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Yield increase (Aglime, bu/A)</span>
              <input
                type="number"
                step={0.1}
                value={yieldAglime}
                onChange={(e) => setYieldAglime(Number(e.target.value))}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Output cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* 98G card */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: BRAND_RED }}
            />
            <div className="mb-2 text-sm font-medium text-gray-900">98G</div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rate</span>
              <span className="text-lg font-semibold">
                {fmt(rate98g?.tons_ac, 2)} ton/ac &nbsp;|&nbsp;{" "}
                {rate98g ? `${rate98g.lbs_ac_display} lb/ac` : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Cost/A</span>
              <span className="text-lg font-semibold">{money(econ98g.cost_per_ac)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">ROI</span>
              <span className="text-lg font-semibold">{money(econ98g.roi)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Net</span>
              <span className="text-lg font-semibold text-red-600">{money(econ98g.net)}</span>
            </div>
          </div>

          {/* Aglime card */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: BRAND_RED }}
            />
            <div className="mb-2 text-sm font-medium text-gray-900">Aglime</div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rate</span>
              <span className="text-lg font-semibold">
                {fmt(rateAglime?.tons_ac, 2)} ton/ac &nbsp;|&nbsp;{" "}
                {rateAglime ? `${rateAglime.lbs_ac_display} lb/ac` : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Cost/A</span>
              <span className="text-lg font-semibold">{money(econAglime.cost_per_ac)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">ROI</span>
              <span className="text-lg font-semibold">{money(econAglime.roi)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Net</span>
              <span className="text-lg font-semibold text-red-600">{money(econAglime.net)}</span>
            </div>
          </div>
        </div>

        {(target98g == null || targetAglime == null) && (
          <div className="mt-3 text-xs text-amber-700">
            Target pH not set for one or both products. Select a valid Target pH to see results.
          </div>
        )}

        <div className="mt-8">
          <a href="/98g" className="text-sm text-blue-600 hover:underline">
            ← Back to 98G calculators
          </a>
        </div>
      </section>
    </main>
  );
}
