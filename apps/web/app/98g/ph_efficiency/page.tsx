"use client";

import React, { useMemo, useState } from "react";
import {
  ALLOWED_PHS,
  DEFAULT_PRICE,
  listFertilizersFor,
  runPhEfficiency,
  type Crop,
  type FertilizerId,
  type RunInput,
} from "@calc-engine/core";

const SO4_RED = "#B21F2D";

const CROPS: Crop[] = ["Corn Grain", "Soybean", "Wheat", "Alfalfa"];

const fmt1 = (n: number) => n.toFixed(1);
const fmt2 = (n: number) => n.toFixed(2);
const money0 = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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
  const [yieldGoal, setYieldGoal] = useState<number>(225);
  const [soilPH, setSoilPH] = useState<number>(ALLOWED_PHS[0]);

  // STRICT menus from engine (primary nutrient only)
  const N_OPTIONS = useMemo(() => listFertilizersFor("N"), []);
  const P_OPTIONS = useMemo(() => listFertilizersFor("P2O5"), []);
  const K_OPTIONS = useMemo(() => listFertilizersFor("K2O"), []);
  const S_OPTIONS = useMemo(() => listFertilizersFor("S"), []);

  // initialize to first valid option in each list
  const [n, setN] = useState<ChoiceState>(() => ({ id: N_OPTIONS[0].id, price: DEFAULT_PRICE[N_OPTIONS[0].id] }));
  const [p, setP] = useState<ChoiceState>(() => ({ id: P_OPTIONS[0].id, price: DEFAULT_PRICE[P_OPTIONS[0].id] }));
  const [k, setK] = useState<ChoiceState>(() => ({ id: K_OPTIONS[0].id, price: DEFAULT_PRICE[K_OPTIONS[0].id] }));
  const [s, setS] = useState<ChoiceState>(() => ({ id: S_OPTIONS[0].id, price: DEFAULT_PRICE[S_OPTIONS[0].id] }));

  // keep price in sync when product changes
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: SO4_RED }} />

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-8">
        <h1 className="mb-2 text-2xl font-bold">pH Efficiency — Fertilizer Dollars at Risk</h1>
        <p className="mb-6 max-w-4xl text-sm text-gray-700">
          We size P/K/S to crop removal, then size <b>N</b> after crediting N contributed by those sources.
          Utilization is pH-based. <b>Phosphorus</b> is emphasized. (Platform rule: $ at risk summary excludes S.)
        </p>

        {/* Inputs */}
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
            <span className="text-sm text-gray-700">Yield goal</span>
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

        {/* Product pickers */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/** N */}
          <Picker title="N source" value={n} setValue={setN} options={N_OPTIONS} onSelect={onSelect} />
          {/** P */}
          <Picker title="P source" value={p} setValue={setP} options={P_OPTIONS} onSelect={onSelect} />
          {/** K */}
          <Picker title="K source" value={k} setValue={setK} options={K_OPTIONS} onSelect={onSelect} />
          {/** S */}
          <Picker title="S source" value={s} setValue={setS} options={S_OPTIONS} onSelect={onSelect} />
        </div>

        {/* Summary tiles */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile title="Total cost ($/A)" value={money0(out.totalCostPerAc)} />
          <Tile title="$ at risk ($/A) — N/P/K only" value={money0(out.totalAtRiskDollarsPerAc)} />
          <Tile
            title="P utilization"
            value={`${Math.round(out.cards.P.util * 100)}%`}
            sub="pH-driven utilization factor"
            highlight
          />
        </div>

        {/* Fertilizer detail table (no utilization / at risk columns) */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left w-[34%]">Fertilizer used</th>
                <th className="px-2 py-2 text-right">Rate (lb/A)</th>
                <th className="px-2 py-2 text-right">N supplied</th>
                <th className="px-2 py-2 text-right">P₂O₅ supplied</th>
                <th className="px-2 py-2 text-right">K₂O supplied</th>
                <th className="px-2 py-2 text-right">S supplied</th>
                <th className="px-2 py-2 text-right">Cost ($/A)</th>
              </tr>
            </thead>
            <tbody>
              {out.fertRows.map((fr, i) => {
                const stripe = i % 2 === 0 ? "bg-white" : "bg-gray-50";
                return (
                  <tr key={fr.id} className={`border-t ${stripe}`}>
                    <td className="px-3 py-2 font-medium">{fr.label}</td>
                    <td className="px-2 py-2 text-right">{fmt1(fr.rate_lb_ac)}</td>
                    <td className="px-2 py-2 text-right">{fmt1(fr.supplied_lb_ac.N)}</td>
                    <td className="px-2 py-2 text-right">{fmt1(fr.supplied_lb_ac.P2O5)}</td>
                    <td className="px-2 py-2 text-right">{fmt1(fr.supplied_lb_ac.K2O)}</td>
                    <td className="px-2 py-2 text-right">{fmt1(fr.supplied_lb_ac.S)}</td>
                    <td className="px-2 py-2 text-right">{money0(fr.cost_per_ac)}</td>
                  </tr>
                );
              })}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-3 py-2">Totals supplied</td>
                <td className="px-2 py-2 text-right">—</td>
                <td className="px-2 py-2 text-right">{fmt1(out.suppliedTotals.N)}</td>
                <td className="px-2 py-2 text-right">{fmt1(out.suppliedTotals.P2O5)}</td>
                <td className="px-2 py-2 text-right">{fmt1(out.suppliedTotals.K2O)}</td>
                <td className="px-2 py-2 text-right">{fmt1(out.suppliedTotals.S)}</td>
                <td className="px-2 py-2 text-right">{money0(out.totalCostPerAc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Utilization / at-risk tiles (N / P / K only) */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile title="N utilization" value={`${Math.round(out.cards.N.util * 100)}%`} sub={`At risk: ${money0(out.cards.N.atRisk)}`} />
          <Tile
            title="P utilization"
            value={`${Math.round(out.cards.P.util * 100)}%`}
            sub={`At risk: ${money0(out.cards.P.atRisk)}`}
            highlight
          />
          <Tile title="K utilization" value={`${Math.round(out.cards.K.util * 100)}%`} sub={`At risk: ${money0(out.cards.K.atRisk)}`} />
        </div>

        <div className="mt-8">
          <a href="/98g" className="text-sm text-blue-600 hover:underline">
            ← Back to 98G calculators
          </a>
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
      <div className="mb-1 text-sm font-medium">{props.title}</div>
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
        Reset to default
      </button>
    </div>
  );
}
