import type { FieldPath } from "react-hook-form";
import type { ProductFormValues } from "./productFormSchema";

export type ProductFormGroup = {
  id: string;
  title: string;
  optional: boolean;
  /** Fields validated when advancing past this step (new product flow). */
  fields: readonly FieldPath<ProductFormValues>[];
};

/**
 * Order matches the stepper and edit-mode section order.
 */
export const PRODUCT_FORM_GROUPS: readonly ProductFormGroup[] = [
  {
    id: "section-basics",
    title: "Basics",
    optional: false,
    fields: [
      "name",
      "sku",
      "slug",
      "brand_id",
      "category_id",
      "status",
    ],
  },
  {
    id: "section-pricing-stock",
    title: "Pricing and stock",
    optional: false,
    fields: [
      "price",
      "original_price",
      "cost_price",
      "stock_quantity",
      "low_stock_threshold",
    ],
  },
  {
    id: "section-images",
    title: "Images",
    optional: true,
    fields: ["images"],
  },
  {
    id: "section-details",
    title: "Details",
    optional: true,
    fields: [
      "short_description",
      "description",
      "fabric",
      "pieces",
      "sizes_text",
      "colors_text",
    ],
  },
  {
    id: "section-notes-care",
    title: "Notes and care",
    optional: true,
    fields: ["edit_note", "authenticity_note", "care_instructions", "video_url"],
  },
  {
    id: "section-organization",
    title: "Organization",
    optional: true,
    fields: [
      "collection_ids",
      "is_featured",
      "is_new",
      "is_sale",
      "is_just_in",
      "keep_pre_order",
      "is_indexable",
      "sort_order",
    ],
  },
  {
    id: "section-seo",
    title: "SEO",
    optional: true,
    fields: ["seo_title", "seo_description"],
  },
] as const;
