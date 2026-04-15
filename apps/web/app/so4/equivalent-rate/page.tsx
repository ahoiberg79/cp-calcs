"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildSo4ReferenceTable,
  calculateSo4Equivalent,
  getProductById,
  type So4EquivalentProductId,
  type So4InputMode,
  type So4EntryUnit,
  type So4ReferenceTableRow,
} from "@calc-engine/core";

const SO4_GREEN = "#2E7D32";

const PRODUCT_OPTIONS: Array<{
  id: So4EquivalentProductId;
  label: string;
}> = [
  { id: "ams", label: "Ammonium Sulfate (AMS)" },
  { id: "ats", label: "Ammonium Thiosulfate (ATS)" },
  { id: "es", label: "Elemental Sulfur (ES)" },
  { id: "cogran_12_40_0_10s_1zn", label: "Co-Granulated (12-40-0-10S-1Zn)" },
  { id: "cogran_12_40_0_10s", label: "Co-Granulated (12-40-0-10S)" },
  { id: "cogran_13_33_0_15s", label: "Co-Granulated (13-33-0-15S)" },
];

const DEFAULT_PRODUCT_ID: So4EquivalentProductId = "ams";
const DEFAULT_INPUT_MODE: So4InputMode = "product_rate";
const DEFAULT_PRODUCT_RATE = 125;

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

function getDefaultRateForProduct(productId: So4EquivalentProductId): {
  rate: number;
  unit: So4EntryUnit;
} {
  switch (productId) {
    case "ams":
      return { rate: 125, unit: "lb/acre" };
    case "ats":
      return { rate: 10.5, unit: "gal/acre" };
    case "es":
      return { rate: 33, unit: "lb/acre" };
    case "cogran_12_40_0_10s_1zn":
      return { rate: 300, unit: "lb/acre" };
    case "cogran_12_40_0_10s":
      return { rate: 300, unit: "lb/acre" };
    case "cogran_13_33_0_15s":
      return { rate: 200, unit: "lb/acre" };

    default:
      throw new Error(`No default rate defined for product ID: ${productId}`);
  }
}

export default function SO4EquivalentRatePage() {
  const [productId, setProductId] =
    useState<So4EquivalentProductId>(DEFAULT_PRODUCT_ID);
  const [inputMode, setInputMode] =
    useState<So4InputMode>(DEFAULT_INPUT_MODE);
  const [productRate, setProductRate] = useState<number>(DEFAULT_PRODUCT_RATE);
  const [sulfurUnits, setSulfurUnits] = useState<number>(24);
  const [productRateUnit, setProductRateUnit] =
    useState<So4EntryUnit>("lb/acre");

  const product = useMemo(() => getProductById(productId), [productId]);

  const showRateUnitDropdown = productId === "ats";

  const allowedUnits = useMemo<So4EntryUnit[]>(() => {
    if (productId === "ats") return ["gal/acre", "lb/acre"];
    return ["lb/acre"];
  }, [productId]);

  const effectiveRateUnit = showRateUnitDropdown
    ? productRateUnit
    : "lb/acre";

  const productRateLabel =
    inputMode === "product_rate"
      ? `Product Rate (${effectiveRateUnit})`
      : "Product Rate";

  const out = useMemo(
    () =>
      calculateSo4Equivalent({
        productId,
        inputMode,
        productRate: Number(productRate) || 0,
        productRateUnit: effectiveRateUnit,
        sulfurUnits: Number(sulfurUnits) || 0,
      }),
    [productId, inputMode, productRate, effectiveRateUnit, sulfurUnits]
  );

  const table = useMemo(() => buildSo4ReferenceTable(), []);

  const onProductChange = (nextId: So4EquivalentProductId) => {
    const nextDefaults = getDefaultRateForProduct(nextId);
    setProductId(nextId);
    setProductRateUnit(nextDefaults.unit);
    setProductRate(nextDefaults.rate);
};

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="h-2 w-full" style={{ backgroundColor: SO4_GREEN }} />

      <section className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <BackButton />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            SO4 Equivalent Rate Calculator
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Convert sulfur supplied from other sulfur fertilizers into an
            equivalent SO4 Pelletized Gypsum rate.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Inputs</h2>

            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Other Product</span>
                <select
                  value={productId}
                  onChange={(e) =>
                    onProductChange(e.target.value as So4EquivalentProductId)
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {PRODUCT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="rounded-2xl border border-gray-200 p-4">
                <legend className="px-1 text-sm font-medium text-gray-700">
                  Enter other product as
                </legend>

                <div className="mt-1 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="inputMode"
                      value="product_rate"
                      checked={inputMode === "product_rate"}
                      onChange={() => setInputMode("product_rate")}
                    />
                    Product Rate
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="inputMode"
                      value="sulfur_units"
                      checked={inputMode === "sulfur_units"}
                      onChange={() => setInputMode("sulfur_units")}
                    />
                    Sulfur Units
                  </label>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Enter either the other product application rate or sulfur
                  units per acre.
                </div>
              </fieldset>

              {inputMode === "product_rate" && (
                <div
                  className={[
                    "grid grid-cols-1 gap-4",
                    showRateUnitDropdown ? "sm:grid-cols-2" : "",
                  ].join(" ")}
                >
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">{productRateLabel}</span>
                    <input
                      type="number"
                      step={
                        productId === "ats" && effectiveRateUnit === "gal/acre"
                          ? 0.1
                          : 1
                      }
                      min={0}
                      value={productRate}
                      onChange={(e) =>
                        setProductRate(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </label>

                  {showRateUnitDropdown && (
                    <label className="space-y-1">
                      <span className="text-sm text-gray-600">Rate Unit</span>
                      <select
                        value={effectiveRateUnit}
                        onChange={(e) =>
                          setProductRateUnit(e.target.value as So4EntryUnit)
                        }
                        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {allowedUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              {inputMode === "sulfur_units" && (
                <label className="space-y-1">
                  <span className="text-sm text-gray-600">
                    Sulfur Units (lb S/acre)
                  </span>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={sulfurUnits}
                    onChange={(e) =>
                      setSulfurUnits(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </label>
              )}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-700">
                  Sulfur used for conversion
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {fmt(out.sulfurLbPerA, 1)} lb S/acre
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  This is the sulfur amount converted into an equivalent SO4
                  Pelletized Gypsum rate.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
            <div className="space-y-3 text-sm leading-6 text-gray-600">
              <p>
                This calculator converts sulfur supplied from another product
                into the equivalent SO4 Pelletized Gypsum rate needed to supply
                the same sulfur amount.
              </p>
              <p>
                ATS values entered as gal/acre use a density assumption to
                convert gallons to pounds before calculating sulfur supplied.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-8 rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <span
            className="pointer-events-none absolute left-3 right-3 top-0 h-1 rounded-full"
            style={{ backgroundColor: SO4_GREEN }}
          />

          <div className="mb-4 text-center text-lg font-semibold text-gray-900">
            SO4 Needed to Supply Equivalent Sulfur
          </div>

          <div className="flex justify-center">
            <div className="min-w-[280px] rounded-2xl border border-green-300 bg-white px-8 py-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-green-700">
                {fmt(out.equivalentSo4LbPerA, 0)} lb/acre
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-green-200 bg-white/70 px-4 py-3 text-sm leading-6 text-gray-700">
            Based on the sulfur supplied by the selected other product, the
            calculator converts that sulfur amount into the equivalent SO4
            Pelletized Gypsum rate.
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
                <div className="font-medium text-gray-700">Other product</div>
                <div className="mt-1 text-gray-600">Selected fertilizer source</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {out.product.label}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">SO4 sulfur analysis</div>
                <div className="mt-1 text-gray-600">Built-in assumption</div>
                <div className="mt-1 font-semibold text-gray-900">17.0% S</div>
              </div>

              {inputMode === "product_rate" &&
                typeof out.sourceProductRateGalPerA === "number" && (
                  <>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="font-medium text-gray-700">
                        Entered ATS rate
                      </div>
                      <div className="mt-1 text-gray-600">User input</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {fmt(out.sourceProductRateGalPerA, 2)} gal/acre
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="font-medium text-gray-700">
                        Converted ATS rate
                      </div>
                      <div className="mt-1 text-gray-600">
                        Using density assumption
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {fmt(out.sourceProductRateLbPerA, 1)} lb/acre
                      </div>
                    </div>
                  </>
                )}

              {inputMode === "product_rate" &&
                typeof out.sourceProductRateGalPerA !== "number" &&
                typeof out.sourceProductRateLbPerA === "number" && (
                  <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                    <div className="font-medium text-gray-700">
                      Other product rate
                    </div>
                    <div className="mt-1 text-gray-600">Entered product rate</div>
                    <div className="mt-1 font-semibold text-gray-900">
                      {fmt(out.sourceProductRateLbPerA, 1)} lb/acre
                    </div>
                  </div>
                )}

              {inputMode === "sulfur_units" && (
                <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                  <div className="font-medium text-gray-700">
                    Sulfur units entered
                  </div>
                  <div className="mt-1 text-gray-600">Direct sulfur entry</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {fmt(out.sulfurLbPerA, 1)} lb S/acre
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">Sulfur supplied</div>
                <div className="mt-1 text-gray-600">Used for conversion</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {fmt(out.sulfurLbPerA, 1)} lb S/acre
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="font-medium text-gray-700">SO4 equivalent rate</div>
                <div className="mt-1 text-gray-600">Sulfur ÷ 0.17</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {fmt(out.equivalentSo4LbPerA, 0)} lb/acre
                </div>
              </div>
            </div>
          </div>
        </details>

        <div className="mt-8 rounded-3xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Reference Table
          </h2>

          <p className="mb-4 max-w-3xl text-sm leading-6 text-gray-600">
            Quick reference showing the other product rate needed to supply
            common sulfur amounts and the equivalent SO4 Pelletized Gypsum rate.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-green-100 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-green-100 text-left text-gray-800">
                  <th className="px-3 py-3 font-semibold">lb S/acre</th>
                  <th className="px-3 py-3 font-semibold">SO4 lb/acre</th>
                  <th className="px-3 py-3 font-semibold">AMS lb/acre</th>
                  <th className="px-3 py-3 font-semibold">ATS gal/acre</th>
                  <th className="px-3 py-3 font-semibold">ES lb/acre</th>
                  <th className="px-3 py-3 font-semibold">12-40-0-10S-1Zn lb/acre</th>
                  <th className="px-3 py-3 font-semibold">12-40-0-10S lb/acre</th>
                  <th className="px-3 py-3 font-semibold">13-33-0-15S lb/acre</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row: So4ReferenceTableRow, index: number) => (
                  <tr
                    key={row.sulfurLbPerA}
                    className={index % 2 === 0 ? "bg-white" : "bg-green-50/40"}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900">
                      {fmt(row.sulfurLbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-green-800">
                      {fmt(row.so4LbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.amsLbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.atsGalPerA, 1)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.esLbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.cogran1240010s1znLbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.cogran1240010sLbPerA, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {fmt(row.cogran1333015sLbPerA, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-green-200 bg-white/70 px-4 py-3 text-sm leading-6 text-gray-700">
            ATS values assume 12-0-0-26 at 11.0 lb/gal. Elemental sulfur values
            assume 90% sulfur. SO4 Pelletized Gypsum is calculated at 17% sulfur.
          </div>
        </div>

        <div className="mt-8">
          <BackButton />
        </div>
      </section>
    </main>
  );
}