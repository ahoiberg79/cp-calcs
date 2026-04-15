export type So4EquivalentProductId =
  | "ams"
  | "ats"
  | "es_80"
  | "es_85"
  | "es_90";

export type So4InputMode = "product_rate" | "sulfur_units";

export type So4EntryUnit = "lb/acre" | "gal/acre";

export type So4EquivalentProduct = {
  id: So4EquivalentProductId;
  label: string;
  sulfurFraction: number;
  defaultEntryUnit: So4EntryUnit;
  densityLbPerGal?: number;
  notes?: string;
};

export const SO4_SULFUR_FRACTION = 0.17;

export const SO4_EQUIVALENT_PRODUCTS: Record<
  So4EquivalentProductId,
  So4EquivalentProduct
> = {
  ams: {
    id: "ams",
    label: "Ammonium Sulfate (AMS)",
    sulfurFraction: 0.24,
    defaultEntryUnit: "lb/acre",
    notes: "Assumes 24% sulfur.",
  },
  ats: {
    id: "ats",
    label: "Ammonium Thiosulfate (ATS)",
    sulfurFraction: 0.26,
    defaultEntryUnit: "gal/acre",
    densityLbPerGal: 11.0,
    notes: "Assumes 12-0-0-26 ATS at 11.0 lb/gal.",
  },
  es_80: {
    id: "es_80",
    label: "Elemental Sulfur (ES) 80%",
    sulfurFraction: 0.8,
    defaultEntryUnit: "lb/acre",
    notes: "Assumes 80% elemental sulfur.",
  },
  es_85: {
    id: "es_85",
    label: "Elemental Sulfur (ES) 85%",
    sulfurFraction: 0.85,
    defaultEntryUnit: "lb/acre",
    notes: "Assumes 85% elemental sulfur.",
  },
  es_90: {
    id: "es_90",
    label: "Elemental Sulfur (ES) 90%",
    sulfurFraction: 0.9,
    defaultEntryUnit: "lb/acre",
    notes: "Assumes 90% elemental sulfur.",
  },
} as const;

export type So4EquivalentInput = {
  productId: So4EquivalentProductId;
  inputMode: So4InputMode;
  productRate?: number;
  productRateUnit?: So4EntryUnit;
  sulfurUnits?: number;
};

export type So4EquivalentOutput = {
  product: So4EquivalentProduct;
  sulfurLbPerA: number;
  sourceProductRateLbPerA?: number;
  sourceProductRateGalPerA?: number;
  equivalentSo4LbPerA: number;
  conversionFactorToSo4?: number;
};

export type So4ReferenceTableRow = {
  sulfurLbPerA: number;
  so4LbPerA: number;
  amsLbPerA: number;
  atsGalPerA: number;
  es80LbPerA: number;
  es85LbPerA: number;
  es90LbPerA: number;
};

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampNonNegative(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
}

export function getProductById(
  productId: So4EquivalentProductId
): So4EquivalentProduct {
  return SO4_EQUIVALENT_PRODUCTS[productId];
}

export function calculateSulfurFromProductRate(
  productId: So4EquivalentProductId,
  productRate: number,
  unit?: So4EntryUnit
): {
  sulfurLbPerA: number;
  normalizedProductRateLbPerA?: number;
  normalizedProductRateGalPerA?: number;
} {
  const product = getProductById(productId);
  const cleanRate = clampNonNegative(productRate);
  const entryUnit = unit ?? product.defaultEntryUnit;

  if (entryUnit === "gal/acre") {
    if (typeof product.densityLbPerGal !== "number") {
      throw new Error(`${product.label} does not support gal/acre entry.`);
    }

    const lbPerA = cleanRate * product.densityLbPerGal;

    return {
      sulfurLbPerA: lbPerA * product.sulfurFraction,
      normalizedProductRateLbPerA: lbPerA,
      normalizedProductRateGalPerA: cleanRate,
    };
  }

  return {
    sulfurLbPerA: cleanRate * product.sulfurFraction,
    normalizedProductRateLbPerA: cleanRate,
  };
}

export function calculateSo4Equivalent(
  input: So4EquivalentInput
): So4EquivalentOutput {
  const product = getProductById(input.productId);

  let sulfurLbPerA = 0;
  let sourceProductRateLbPerA: number | undefined;
  let sourceProductRateGalPerA: number | undefined;

  if (input.inputMode === "sulfur_units") {
    sulfurLbPerA = clampNonNegative(input.sulfurUnits);
  } else {
    const result = calculateSulfurFromProductRate(
      input.productId,
      input.productRate ?? 0,
      input.productRateUnit ?? product.defaultEntryUnit
    );

    sulfurLbPerA = result.sulfurLbPerA;
    sourceProductRateLbPerA = result.normalizedProductRateLbPerA;
    sourceProductRateGalPerA = result.normalizedProductRateGalPerA;
  }

  const equivalentSo4LbPerA = sulfurLbPerA / SO4_SULFUR_FRACTION;

  const conversionFactorToSo4 =
    input.inputMode === "product_rate"
      ? product.sulfurFraction / SO4_SULFUR_FRACTION
      : undefined;

  return {
    product,
    sulfurLbPerA: roundTo(sulfurLbPerA, 1),
    sourceProductRateLbPerA:
      typeof sourceProductRateLbPerA === "number"
        ? roundTo(sourceProductRateLbPerA, 1)
        : undefined,
    sourceProductRateGalPerA:
      typeof sourceProductRateGalPerA === "number"
        ? roundTo(sourceProductRateGalPerA, 2)
        : undefined,
    equivalentSo4LbPerA: roundTo(equivalentSo4LbPerA, 0),
    conversionFactorToSo4:
      typeof conversionFactorToSo4 === "number"
        ? roundTo(conversionFactorToSo4, 4)
        : undefined,
  };
}

function productRateForSulfurTarget(
  productId: So4EquivalentProductId,
  sulfurLbPerA: number
): number {
  const product = getProductById(productId);

  if (product.defaultEntryUnit === "gal/acre") {
    if (typeof product.densityLbPerGal !== "number") {
      throw new Error(`${product.label} is missing densityLbPerGal.`);
    }
    return sulfurLbPerA / (product.densityLbPerGal * product.sulfurFraction);
  }

  return sulfurLbPerA / product.sulfurFraction;
}

export function buildSo4ReferenceTable(
  sulfurTargets: number[] = [10, 15, 20, 25, 30, 35, 40, 45, 50]
): So4ReferenceTableRow[] {
  return sulfurTargets.map((sulfurLbPerA) => ({
    sulfurLbPerA,
    so4LbPerA: roundTo(sulfurLbPerA / SO4_SULFUR_FRACTION, 0),
    amsLbPerA: roundTo(productRateForSulfurTarget("ams", sulfurLbPerA), 0),
    atsGalPerA: roundTo(productRateForSulfurTarget("ats", sulfurLbPerA), 1),
    es80LbPerA: roundTo(productRateForSulfurTarget("es_80", sulfurLbPerA), 0),
    es85LbPerA: roundTo(productRateForSulfurTarget("es_85", sulfurLbPerA), 0),
    es90LbPerA: roundTo(productRateForSulfurTarget("es_90", sulfurLbPerA), 0),
  }));
}