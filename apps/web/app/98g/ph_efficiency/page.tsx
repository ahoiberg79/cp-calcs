"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ALLOWED_PHS,
  DEFAULT_PRICE,
  listFertilizersFor,
  runPhEfficiency,
  type Crop,
  type FertilizerId,
  type RunInput,
} from "@calc-engine/core";

const BRAND_RED = "#B21F2D";

const CROPS: Crop[] = ["Corn Grain", "Soybeans", "Wheat", "Alfalfa"];

const DEFAULT_YIELD_BY_CROP: Record<Crop, number> = {
  "Corn Grain": 200,
  Soybeans: 70,
  Wheat: 60,
  Alfalfa: 5,
};

const YIELD_UNIT_BY_CROP: Record<Crop, string> = {
  "Corn Grain": "bushels/acre",
  Soybeans: "bushels/acre",
  Wheat: "bushels/acre",
  Alfalfa: "tons/acre",
};

const rateDisplay = (n: number) => Math.round(n).toString();
const supplyDisplay = (n: number) => Math.round(n).toString();
const money0 = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

type ChoiceState = { id: FertilizerId; price: number };

function Tile(props: { title: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm",
        props.highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200",
      ].join(" ")}
    >
      <div className="text-xs font-medium text-gray-600">{props.title}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{props.value}</div>
      {props.sub && <div className="mt-1 text-xs text-gray-600">{props.sub}</div>}
    </div>
  );
}

export default function PhEfficiencyPage() {
  const [crop, setCrop] = useState<Crop>("Corn Grain");
  const [yieldGoal, setYieldGoal] = useState<number>(DEFAULT_YIELD_BY_CROP["Corn Grain"]);
  const [soilPH, setSoilPH] = useState<number>(ALLOWED_PHS[0]);

  const N_OPTIONS = useMemo(() => listFertilizersFor("N"), []);
  const P_OPTIONS = useMemo(() => listFertilizersFor("P2O5"), []);
  const K_OPTIONS = useMemo(() => listFertilizersFor("K2O"), []);
  const S_OPTIONS = useMemo(() => listFertilizersFor("S"), []);

  const [n, setN] = useState<ChoiceState>(() => ({ id: N_OPTIONS[0].id, price: DEFAULT_PRICE[N_OPTIONS[0].id] }));
  const [p, setP] = useState<ChoiceState>(() => ({ id: P_OPTIONS[0].id, price: DEFAULT_PRICE[P_OPTIONS[0].id] }));
  const [k, setK] = useState<ChoiceState>(() => ({ id: K_OPTIONS[0].id, price: DEFAULT_PRICE[K_OPTIONS[0].id] }));
  const [s, setS] = useState<ChoiceState>(() => ({ id: S_OPTIONS[0].id, price: DEFAULT_PRICE[S_OPTIONS[0].id] }));

  useEffect(() => {
    setYieldGoal(DEFAULT_YIELD_BY_CROP[crop]);
  }, [crop]);

  const onSelect =
    (setter: (c: ChoiceState) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value as FertilizerId;
      setter({ id, price: DEFAULT_PRICE[id] ?? 0 });
    };

  const out = useMemo(() => {
    const input: RunInput = {
      crop,
      yieldGoal: Number(yieldGoal),
      soil_pH: Number(soilPH),
      n: { id: n.id, pricePerTon: Number(n.price) },
      p: { id: p.id, pricePerTon: Number(p.price) },
      k: { id: k.id, pricePerTon: Number(k.price) },
      s: { id: s.id, pricePerTon: Number(s.price) },
    };
    return runPhEfficiency(input);
  }, [crop, yieldGoal, soilPH, n, p, k, s]);

  const yieldUnit = YIELD_UNIT_BY_CROP[crop];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_RED }} />

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-8">
        <div className="mb-6">
          <a
            href="/98g"
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Back to 98G Calculators
          </a>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Soil pH Nutrient Efficiency Calculator</h1>
        <p className="mb-6 max-w-4xl text-sm text-gray-700">
          First, select your crop, yield goal, and soil pH level from the dropdowns at the top of the screen. This will calculate fertilizer 
          removal rates for N, P, K, and S to support your selected yield level and set the utilization level of the fertilizers at your pH 
          based on estimated availability. 
        </p>
        <p className="mb-6 max-w-4xl text-sm text-gray-700">
          Second, select your fertilizer sources for supplying the N, P, K, and S and input your pricing levels. 
        </p>
        <p className="mb-6 max-w-4xl text-sm text-gray-700">
          Once these values are input, the calculator will utilize your values to calculate the hidden cost of having less than 
          optimum pH levels based on the nutrient availability levels of each nutrient at the pH level you designated. By having lower than 
          optimum pH levels, growers cannot maximize the nutrient availability of applied fertilizers for their growing crop. Phosphorus typically 
          is the nutrient most negatively affected by soil pH when it comes to availability levels.
        </p>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm text-gray-700">Crop</span>
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
            <span className="text-sm text-gray-700">Yield Goal ({yieldUnit})</span>
            <input
              type="number"
              step={1}
              min={0}
              value={yieldGoal}
              onChange={(e) => setYieldGoal(e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-700">Soil pH</span>
            <select
              value={soilPH}
              onChange={(e) => setSoilPH(Number(e.target.value))}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {ALLOWED_PHS.map((ph) => (
                <option key={ph} value={ph}>
                  {ph.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Picker title="Nitrogen Fertilizer" value={n} setValue={setN} options={N_OPTIONS} onSelect={onSelect} />
          <Picker title="Phosphate Fertilizer" value={p} setValue={setP} options={P_OPTIONS} onSelect={onSelect} />
          <Picker title="Potassium Fertilizer" value={k} setValue={setK} options={K_OPTIONS} onSelect={onSelect} />
          <Picker title="Sulfur Fertilizer" value={s} setValue={setS} options={S_OPTIONS} onSelect={onSelect} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile title="Total Cost ($/acre)" value={money0(out.totalCostPerAc)} />
          <Tile title="Total Dollars at Risk" value={money0(out.totalAtRiskDollarsPerAc)} />
          <Tile
            title="Phosphate Utilization"
            value={`${Math.round(out.cards.P.util * 100)}%`}
            sub="Based on selected soil pH"
            highlight
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="w-[34%] px-3 py-2 text-left">Fertilizer Used</th>
                <th className="px-2 py-2 text-right">Rate Required (lb/acre)</th>
                <th className="px-2 py-2 text-right">N Supplied (lb/acre)</th>
                <th className="px-2 py-2 text-right">P<sub>2</sub>O<sub>5</sub> Supplied (lb/acre)</th>
                <th className="px-2 py-2 text-right">K<sub>2</sub>O Supplied (lb/acre)</th>
                <th className="px-2 py-2 text-right">S Supplied (lb/acre)</th>
                <th className="px-2 py-2 text-right">Cost ($/acre)</th>
              </tr>
            </thead>
            <tbody>
              {out.fertRows.map((fr, i) => {
                const stripe = i % 2 === 0 ? "bg-white" : "bg-gray-50";
                return (
                  <tr key={fr.id} className={`border-t ${stripe}`}>
                    <td className="px-3 py-2 font-medium">{fr.label}</td>
                    <td className="px-2 py-2 text-right">{rateDisplay(fr.rate_lb_ac)}</td>
                    <td className="px-2 py-2 text-right">{supplyDisplay(fr.supplied_lb_ac.N)}</td>
                    <td className="px-2 py-2 text-right">{supplyDisplay(fr.supplied_lb_ac.P2O5)}</td>
                    <td className="px-2 py-2 text-right">{supplyDisplay(fr.supplied_lb_ac.K2O)}</td>
                    <td className="px-2 py-2 text-right">{supplyDisplay(fr.supplied_lb_ac.S)}</td>
                    <td className="px-2 py-2 text-right">{money0(fr.cost_per_ac)}</td>
                  </tr>
                );
              })}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-3 py-2">Totals Supplied</td>
                <td className="px-2 py-2 text-right">—</td>
                <td className="px-2 py-2 text-right">{supplyDisplay(out.suppliedTotals.N)}</td>
                <td className="px-2 py-2 text-right">{supplyDisplay(out.suppliedTotals.P2O5)}</td>
                <td className="px-2 py-2 text-right">{supplyDisplay(out.suppliedTotals.K2O)}</td>
                <td className="px-2 py-2 text-right">{supplyDisplay(out.suppliedTotals.S)}</td>
                <td className="px-2 py-2 text-right">{money0(out.totalCostPerAc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile
            title="N Dollars at Risk"
            value={money0(out.cards.N.atRisk)}
            sub={`Utilization: ${Math.round(out.cards.N.util * 100)}%`}
          />
          <Tile
            title="P Dollars at Risk"
            value={money0(out.cards.P.atRisk)}
            sub={`Utilization: ${Math.round(out.cards.P.util * 100)}%`}
            highlight
          />
          <Tile
            title="K Dollars at Risk"
            value={money0(out.cards.K.atRisk)}
            sub={`Utilization: ${Math.round(out.cards.K.util * 100)}%`}
          />
        </div>

        <div className="mt-8 space-y-3">
          <a
            href="/98g"
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Back to 98G Calculators
          </a>

          <p className="mb-6 max-w-4xl text-sm text-gray-700">
            Disclaimer: This calculator is intended to help understand why managing pH is important - it is not intended to be a precise predictor of outcomes on a given field, 
            but rather a tool to understand the relative impact of pH on nutrient availability and the associated hidden costs. We know crop yields are sensitive to soil pH
            and we feel this is a tool to help simplify the complicated soil chemistry that results in reduced yield at low soil pH down to a simple financial calculation that 
            growers can understand and use to make informed decisions about managing soil pH on their farm. 
          </p>
        </div>  
      </section>
    </main>
  );
}

function Picker(props: {
  title: string;
  value: { id: FertilizerId; price: number };
  setValue: (v: { id: FertilizerId; price: number }) => void;
  options: { id: FertilizerId; label: string }[];
  onSelect: (setter: (c: { id: FertilizerId; price: number }) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-1 text-sm font-medium text-gray-900">{props.title}</div>

      <select
        value={props.value.id}
        onChange={props.onSelect(props.setValue)}
        className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {props.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="mt-2 space-y-1">
        <label className="block text-[11px] text-gray-600">Price ($/ton)</label>
        <input
          type="number"
          step={1}
          value={props.value.price}
          onChange={(e) => props.setValue({ ...props.value, price: Number(e.target.value) })}
          className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <button
        type="button"
        onClick={() => props.setValue({ ...props.value, price: DEFAULT_PRICE[props.value.id] ?? 0 })}
        className="mt-2 text-xs text-blue-600 hover:underline"
      >
        Reset to Default
      </button>
    </div>
  );
}