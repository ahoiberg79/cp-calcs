"use client";

import { useMemo, useState } from "react";
import {
  ALLOWED_PHS,
  DEFAULT_PRICE,
  listFertilizersFor,
  runPhEfficiency,
  type Crop,
  type FertilizerId,
  type Nutrient,
  type RunInput,
} from "@calc-engine/core";

/* small helpers */
const SO4_RED = "#B21F2D"; // brand red for the top bar
const fmt1 = (n: number) => n.toFixed(1);
const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

const CROPS: Crop[] = ["Corn Grain", "Soybean", "Wheat", "Alfalfa"];
const PHS = ALLOWED_PHS as readonly number[];

type ChoiceState = { id: FertilizerId; price: number };

export default function PhEfficiencyPage() {
  const [crop, setCrop] = useState<Crop>("Corn Grain");
  const [yieldGoal, setYield] = useState<number>(225);
  const [soilPH, setSoilPH] = useState<number>(5.0);

  // strictly filtered menus
  const N_OPTIONS = listFertilizersFor("N");
  const P_OPTIONS = listFertilizersFor("P2O5");
  const K_OPTIONS = listFertilizersFor("K2O");
  const S_OPTIONS = listFertilizersFor("S");

  const [n, setN] = useState<ChoiceState>({ id: N_OPTIONS[0].id, price: DEFAULT_PRICE[N_OPTIONS[0].id] });
  const [p, setP] = useState<ChoiceState>({ id: P_OPTIONS[0].id, price: DEFAULT_PRICE[P_OPTIONS[0].id] });
  const [k, setK] = useState<ChoiceState>({ id: K_OPTIONS[0].id, price: DEFAULT_PRICE[K_OPTIONS[0].id] });
  const [s, setS] = useState<ChoiceState>({ id: S_OPTIONS[0].id, price: DEFAULT_PRICE[S_OPTIONS[0].id] });

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
      {/* brand bar */}
      <div className="h-2 w-full" style={{ backgroundColor: SO4_RED }} />

      <section className="mx-auto max-w-5xl p-6">
        <h1 className="mb-2 text-2xl font-bold">Nutrient Dollars at Risk — Soil pH Efficiency</h1>
        <p className="mb-4 text-sm text-gray-600">
          Choose crop, yield goal, soil pH, and fertilizers. We size P/K/S to crop removal, then size{" "}
          <b>N</b> after crediting N contributed by those sources. $/A is computed per nutrient using the product
          cost and the pH-based utilization. <b>Phosphorus</b> is emphasized.
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
                <option key={c} value={c}>{c}</option>
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
              onChange={(e) => setYield(e.target.value === "" ? 0 : Number(e.target.value))}
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
              {PHS.map((p) => (
                <option key={p} value={p}>{p.toFixed(1)}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Product pickers */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* N */}
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-sm font-medium">N source</div>
            <select
              value={n.id}
              onChange={onSelect(setN)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {N_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <div className="mt-2 space-y-1">
              <label className="block text-[11px]">Price ($/ton)</label>
              <input
                type="number"
                step={1}
                value={n.price}
                onChange={(e) => setN({ ...n, price: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* P */}
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-sm font-medium">P source</div>
            <select
              value={p.id}
              onChange={onSelect(setP)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {P_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <div className="mt-2 space-y-1">
              <label className="block text-[11px]">Price ($/ton)</label>
              <input
                type="number"
                step={1}
                value={p.price}
                onChange={(e) => setP({ ...p, price: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* K */}
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-sm font-medium">K source</div>
            <select
              value={k.id}
              onChange={onSelect(setK)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {K_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <div className="mt-2 space-y-1">
              <label className="block text-[11px]">Price ($/ton)</label>
              <input
                type="number"
                step={1}
                value={k.price}
                onChange={(e) => setK({ ...k, price: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* S */}
          <div className="rounded-2xl border p-4">
            <div className="mb-1 text-sm font-medium">S source</div>
            <select
              value={s.id}
              onChange={onSelect(setS)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {S_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <div className="mt-2 space-y-1">
              <label className="block text-[11px]">Price ($/ton)</label>
              <input
                type="number"
                step={1}
                value={s.price}
                onChange={(e) => setS({ ...s, price: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Results table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse rounded-2xl border">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="px-3 py-2">Nutrient</th>
                <th className="px-3 py-2">Needed (lb/ac)</th>
                <th className="px-3 py-2">Utilization</th>
                <th className="px-3 py-2">Rate (lb/ac)</th>
                <th className="px-3 py-2">Cost ($/A)</th>
                <th className="px-3 py-2">$ at risk / A</th>
              </tr>
            </thead>
            <tbody>
              {out.rows.map((r) => (
                <tr key={r.nutrient} className="border-t">
                  <td className="px-3 py-2">{r.nutrient}</td>
                  <td className="px-3 py-2">{fmt1(r.needed_lb_ac)}</td>
                  <td className="px-3 py-2">{Math.round(r.utilization_frac * 100)}%</td>
                  <td className="px-3 py-2">{fmt1(r.rate_lb_ac)}</td>
                  <td className="px-3 py-2">{money(r.cost_per_ac)}</td>
                  <td className="px-3 py-2">{money(r.atRisk_per_ac)}</td>
                </tr>
              ))}
              <tr className="border-t bg-gray-50 font-medium">
                <td className="px-3 py-2">Totals</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">{money(out.totalCostPerAc)}</td>
                <td className="px-3 py-2">{money(out.totalAtRiskPerAc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom cards (N / P emphasized / K) */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="N" util={out.cards.N.util} atRisk={out.cards.N.atRisk} />
          <Card title="P" util={out.cards.P.util} atRisk={out.cards.P.atRisk} highlight />
          <Card title="K" util={out.cards.K.util} atRisk={out.cards.K.atRisk} />
        </div>

        <div className="mt-6">
          <a href="/98g" className="text-sm text-blue-600 hover:underline">
            ← Back to 98G calculators
          </a>
        </div>
      </section>
    </main>
  );
}

function Card(props: { title: "N" | "P" | "K"; util: number; atRisk: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${props.highlight ? "bg-[#B21F2D] text-white" : "bg-white"}`}
    >
      <div className="mb-1 text-lg font-semibold">{props.title}</div>
      <div className="text-base">
        <div className="text-sm opacity-80">Utilization:</div>
        <div className="text-2xl font-bold">{Math.round(props.util * 100)}%</div>
      </div>
      <div className="mt-3 text-base">
        <div className="text-sm opacity-80">$ at risk / A:</div>
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(props.atRisk)}
        </div>
      </div>
    </div>
  );
}
