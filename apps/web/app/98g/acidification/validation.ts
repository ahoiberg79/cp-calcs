import { z } from "zod";

export const Mode = z.enum(["units", "rate"]);
export type Mode = z.infer<typeof Mode>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["STANDARD_N", "MES", "ES"]),
  percentN: z.number().nullable(),        // null for ES
  percentS: z.number().nullable(),        // null for N-only
  rate_lbs_ac: z.number().nonnegative().optional(), // used in Rate mode
  unitsN: z.number().nonnegative().optional(),      // used in Units mode (N)
  unitsS: z.number().nonnegative().optional(),      // used in Units mode (S for ES)
});

export const formSchema = z.object({
  mode: Mode,
  products: z.array(productSchema).min(1),
});
export type AcidityForm = z.infer<typeof formSchema>;
