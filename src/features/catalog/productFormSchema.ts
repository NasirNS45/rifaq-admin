import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Use lowercase letters, numbers, and single hyphens.",
    ),
  sku: z.string().trim().min(1, "SKU is required."),
  brand_id: z.string().min(1, "Choose a brand."),
  category_id: z.string().min(1, "Choose a category."),
  description: z.string(),
  short_description: z.string(),
  price: z.string().trim().min(1, "Price is required."),
  original_price: z.string(),
  cost_price: z.string(),
  stock_quantity: z
    .number({ error: "Enter a number." })
    .int("Enter a whole number.")
    .min(0, "Stock cannot be negative."),
  low_stock_threshold: z
    .number({ error: "Enter a number." })
    .int("Enter a whole number.")
    .min(0, "Threshold cannot be negative."),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  is_indexable: z.boolean(),
  fabric: z.string(),
  care_instructions: z.string(),
  authenticity_note: z.string(),
  pieces: z.string(),
  edit_note: z.string(),
  video_url: z.string(),
  keep_pre_order: z.boolean(),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  is_sale: z.boolean(),
  is_just_in: z.boolean(),
  sort_order: z
    .number({ error: "Enter a number." })
    .int("Enter a whole number."),
  seo_title: z.string(),
  seo_description: z.string(),
  images: z.array(
    z.object({
      image_url: z.string().min(1),
      alt_text: z.string().nullable(),
    }),
  ),
  sizes_text: z.string(),
  colors_text: z.string(),
  collection_ids: z.array(z.string()),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
