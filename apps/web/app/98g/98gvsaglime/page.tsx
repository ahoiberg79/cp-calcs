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

const BRAND_RED = "#B21F2D";
const ALL_SETS: EquationSet[] = ["UW", "ISU"];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const fmt = (n: unknown, decimals = 2) =>
  isNum(n)
    ? new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(n)
    : "—";

const money = (n: unknown) =>
  isNum(n)
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
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

export default function NinetyEightGVsAglimePage() {
  const [useCase, setUseCase] = useState<UseCase98G>("Correction");
  const [inst, setInst] = useState<EquationSet>("UW");
  const [till, setTill] = useState<Tillage>("Conventional");

  const [soil_pH, setSoil] = useState<number>(5.7);
  const [buffer_pH, setBuffer] = useState<number>(6.4);

  const [target98g, setTarget98g] = useState<number | null>(6.0);
  const [targetAglime, setTargetAglime] = useState<number | null>(6.5);

  const [cost98gPerTon, setCost98gPerTon] = useState<number>(295);
  const [costAglimePerTon, setCostAglimePerTon] = useState<number>(40);
  const [aglimeECCE, setAglimeECCE] = useState<number>(68.8);

  const [pricePerBu, setPricePerBu] = useState<number>(4.0);
  const [yield98g, setYield98g] = useState<number>(8);
  const [yieldAglime, setYieldAglime] = useState<number>(0);

  const targets98gList = useMemo(() => {
    const values = new Set<number>();

    for (const es of ALL_SETS) {
      for (const p of listTargetPHs("98G", es, till)) {
        values.add(p);
      }
    }

    return Array.from(values).sort((a, b) => a - b);
  }, [till]);

  const targetsAglimeList = useMemo(() => {
    return listTargetPHs("Aglime", inst, till);
  }, [inst, till]);

  useEffect(() => {
    if (targetAglime != null && !targetsAglimeList.includes(targetAglime)) {
      setTargetAglime(targetsAglimeList[0] ?? null);
    }
  }, [inst, till, targetAglime, targetsAglimeList]);

  useEffect(() => {
    if (target98g == null && targets98gList.length > 0) {
      setTarget98g(targets98gList.includes(6.0) ? 6.0 : targets98gList[0]);
    }
  }, [target98g, targets98gList]);

  useEffect(() => {
    if (targetAglime == null && targetsAglimeList.length > 0) {
      setTargetAglime(targetsAglimeList.includes(6.5) ? 6.5 : targetsAglimeList[0]);
    }
  }, [targetAglime, targetsAglimeList]);

  const rate98g = useMemo(() => {
    if (useCase === "Maintenance") {
      try {
        return calc98G({
          useCase,
          institution: inst,
          tillage: till,
          soil_pH,
          buffer_pH,
          target_pH_98g: targets98gList[0] ?? 6.0,
        });
      } catch {
        return null;
      }
    }

    if (target98g == null) return null;

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
        continue;
      }
    }

    return null;
  }, [useCase, inst, till, soil_pH, buffer_pH, target98g, targets98gList]);

  const rateAglime = useMemo(() => {
    if (targetAglime == null) return null;

    try {
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
    return economics(rate98g?.tons_ac ?? 0, cost98gPerTon, yield98g, pricePerBu);
  }, [rate98g, cost98gPerTon, yield98g, pricePerBu]);

  const econAglime = useMemo(() => {
    return economics(rateAglime?.tons_ac ?? 0, costAglimePerTon, yieldAglime, pricePerBu);
  }, [rateAglime, costAglimePerTon, yieldAglime, pricePerBu]);

  const onSelectNumber =
    (setter: (v: number | null) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setter(value === "" ? null : Number(value));
    };

  const aglimeTargetAdjusted =
    targetAglime != null && !targetsAglimeList.includes(targetAglime) && targetsAglimeList.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">98G vs Aglime</h1>
        <p className="mb-6 max-w-3xl text-sm leading-6 text-gray-600">
          Compare 98G pelletized limestone and aglime using UW and ISU equations. This calculator
          estimates product rate, cost per acre, estimated revenue increase, and net return based
          on your selected soil conditions and economic assumptions. For the purposes of this calculator,
          neutralizing potential teminology (e.g. ECCE, ENP, NI, ENV) is standardized to ECCE and represents 
          the effective calcium carbonate equivalence of the product and should be considered interchangeable.
          Additionally, transportation and application costs should be included in the respective product cost
          per ton (i.e. if aglime is $40/ton, delivery and application is assumed to be included).
        </p>

        <div className="mb-6 rounded-3xl border border-gray-200 bg-gray-50/80 p-5">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G use case</span>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as UseCase98G)}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="Correction">Correction</option>
                <option value="Maintenance">Maintenance (250 lb/acre)</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Equation set</span>
              <select
                value={inst}
                onChange={(e) => setInst(e.target.value as EquationSet)}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
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
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="Conventional">Conventional</option>
                <option value="No-Till">No-Till</option>
              </select>
            </label>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">Soil pH (WpH)</span>
              <input
                type="number"
                step={0.1}
                value={soil_pH}
                onChange={(e) => setSoil(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Buffer pH (BpH)</span>
              <input
                type="number"
                step={0.1}
                value={buffer_pH}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            {useCase === "Correction" && (
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Target pH (98G)</span>
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
            )}

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-gray-600">Target pH (aglime)</span>
              <select
                value={targetAglime ?? ""}
                onChange={onSelectNumber(setTargetAglime)}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="">Select target pH</option>
                {targetsAglimeList.map((p) => (
                  <option key={`aglime-${p}`} value={p}>
                    {p.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G product cost ($/ton)</span>
              <input
                type="number"
                step={1}
                value={cost98gPerTon}
                onChange={(e) => setCost98gPerTon(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Aglime product cost ($/ton)</span>
              <input
                type="number"
                step={1}
                value={costAglimePerTon}
                onChange={(e) => setCostAglimePerTon(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Aglime ECCE (%)</span>
              <input
                type="number"
                step={0.1}
                value={aglimeECCE}
                onChange={(e) => setAglimeECCE(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Crop price ($/bushel)</span>
              <input
                type="number"
                step={0.01}
                value={pricePerBu}
                onChange={(e) => setPricePerBu(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">98G - estimated yield increase (bushels/acre)</span>
              <input
                type="number"
                step={0.1}
                value={yield98g}
                onChange={(e) => setYield98g(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-600">Aglime - estimated yield increase (bushels/acre)</span>
              <input
                type="number"
                step={0.1}
                value={yieldAglime}
                onChange={(e) => setYieldAglime(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </label>
          </div>
        </div>

        {aglimeTargetAdjusted && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The selected aglime target pH was not available for this equation set and tillage
            combination, so it was reset to a valid option.
          </div>
        )}

        {(target98g == null || targetAglime == null) && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Select a valid target pH for both products to view complete results.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <span
              className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-t-3xl"
              style={{ backgroundColor: BRAND_RED }}
            />
            <div className="mb-4 text-lg font-semibold text-gray-900">98G</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Product Rate</span>
                <span className="text-right text-base font-semibold text-gray-900">
                  {fmt(rate98g?.tons_ac, 2)} tons/acre
                  <br />
                  <span className="text-sm font-medium text-gray-600">
                    {rate98g ? `${fmt(rate98g.lbs_ac_display, 0)} lb/acre` : "—"}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Cost per acre</span>
                <span className="text-base font-semibold text-gray-900">
                  {money(econ98g.cost_per_acre)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Estimated revenue increase</span>
                <span className="text-base font-semibold text-gray-900">
                  {money(econ98g.revenue_increase)}
                </span>
              </div>

              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-red-800">Net return</span>
                  <span
                    className={`text-lg font-bold ${
                      (econ98g.net_return ?? 0) >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {money(econ98g.net_return)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <span
              className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-t-3xl"
              style={{ backgroundColor: BRAND_RED }}
            />
            <div className="mb-4 text-lg font-semibold text-gray-900">Aglime</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Product Rate</span>
                <span className="text-right text-base font-semibold text-gray-900">
                  {fmt(rateAglime?.tons_ac, 2)} tons/acre
                  <br />
                  <span className="text-sm font-medium text-gray-600">
                    {rateAglime ? `${fmt(rateAglime.lbs_ac_display, 0)} lb/acre` : "—"}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Cost per acre</span>
                <span className="text-base font-semibold text-gray-900">
                  {money(econAglime.cost_per_acre)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Estimated revenue increase</span>
                <span className="text-base font-semibold text-gray-900">
                  {money(econAglime.revenue_increase)}
                </span>
              </div>

              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-red-800">Net return</span>
                  <span
                    className={`text-lg font-bold ${
                      (econAglime.net_return ?? 0) >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {money(econAglime.net_return)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <BackButton />
        </div>
      </section>
    </main>
  );
}