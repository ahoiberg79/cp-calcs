export type So4EquivalentProductId =
  | "sulfur-units"
  | "ams"
  | "ats"
  | "es"
  | "cogran_12_40_0_10s_1zn"
  | "cogran_12_40_0_10s"
  | "cogran_13_33_0_15s";

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
  "sulfur-units": {
    id: "sulfur-units",
    label: "Sulfur Units",
    sulfurFraction: 1,
    defaultEntryUnit: "lb/acre",
    notes: "Direct sulfur entry in lb S/acre.",
  },
  ams: {
    id: "ams",
    label: "Ammonium Sulfate (AMS)",
    sulfurFraction: 0.24,
    defaultEntryUnit: "lb/acre",
  },
  ats: {
    id: "ats",
    label: "Ammonium Thiosulfate (ATS)",
    sulfurFraction: 0.26,
    defaultEntryUnit: "gal/acre",
    densityLbPerGal: 11.0,
    notes: "Assumes 12-0-0-26 ATS at 11.0 lb/gal.",
  },
  es: {
    id: "es",
    label: "Elemental Sulfur (ES)",
    sulfurFraction: 0.9,
    defaultEntryUnit: "lb/acre",
    notes: "Assumes 90% sulfur.",
  },
  cogran_12_40_0_10s_1zn: {
    id: "cogran_12_40_0_10s_1zn",
    label: "Co-Granulated (12-40-0-10S-1Zn)",
    sulfurFraction: 0.1,
    defaultEntryUnit: "lb/acre",
  },
  cogran_12_40_0_10s: {
    id: "cogran_12_40_0_10s",
    label: "Co-Granulated (12-40-0-10S)",
    sulfurFraction: 0.1,
    defaultEntryUnit: "lb/acre",
  },
  cogran_13_33_0_15s: {
    id: "cogran_13_33_0_15s",
    label: "Co-Granulated (13-33-0-15S)",
    sulfurFraction: 0.15,
    defaultEntryUnit: "lb/acre",
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
  equivalentSo4TonsPerA: number;
  conversionFactorToSo4?: number;
};

export type So4ReferenceTableRow = {
  sulfurLbPerA: number;
  so4LbPerA: number;
  so4TonsPerA: number;
  amsLbPerA: number;
  atsGalPerA: number;
  esLbPerA: number;
  cogran1240010s1znLbPerA: number;
  cogran1240010sLbPerA: number;
  cogran1333015sLbPerA: number;
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

  if (productId === "sulfur-units") {
    return {
      sulfurLbPerA: cleanRate,
    };
  }

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
  const equivalentSo4TonsPerA = equivalentSo4LbPerA / 2000;

  const conversionFactorToSo4 =
    input.inputMode === "product_rate" && input.productId !== "sulfur-units"
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
    equivalentSo4TonsPerA: roundTo(equivalentSo4TonsPerA, 2),
    conversionFactorToSo4:
      typeof conversionFactorToSo4 === "number"
        ? roundTo(conversionFactorToSo4, 4)
        : undefined,
  };
}

function productRateForSulfurTarget(
  productId: Exclude<So4EquivalentProductId, "sulfur-units">,
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
    so4TonsPerA: roundTo((sulfurLbPerA / SO4_SULFUR_FRACTION) / 2000, 2),
    amsLbPerA: roundTo(productRateForSulfurTarget("ams", sulfurLbPerA), 0),
    atsGalPerA: roundTo(productRateForSulfurTarget("ats", sulfurLbPerA), 1),
    esLbPerA: roundTo(productRateForSulfurTarget("es", sulfurLbPerA), 0),
    cogran1240010s1znLbPerA: roundTo(
      productRateForSulfurTarget("cogran_12_40_0_10s_1zn", sulfurLbPerA),
      0
    ),
    cogran1240010sLbPerA: roundTo(
      productRateForSulfurTarget("cogran_12_40_0_10s", sulfurLbPerA),
      0
    ),
    cogran1333015sLbPerA: roundTo(
      productRateForSulfurTarget("cogran_13_33_0_15s", sulfurLbPerA),
      0
    ),
  }));
}