import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  ProductSeoDescriptionGuidance,
  ProductSeoTitleGuidance,
  ProductSlugHint,
} from "@/components/ProductFormWatchers";
import { FormSkeleton } from "@/components/loading";
import { FieldError, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  useBrands,
  useCategories,
  useCollections,
  useProduct,
  useSaveProduct,
} from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import type { ProductStatus } from "@/types/api";

const schema = z.object({
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

type FormValues = z.infer<typeof schema>;

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const existing = useProduct(id);
  const brands = useBrands({ page: 1, limit: 100, is_active: true });
  const categories = useCategories({ page: 1, limit: 100, is_active: true });
  const collections = useCollections({ page: 1, limit: 100 });
  const save = useSaveProduct();
  const canWrite = isNew ? canCreate : canUpdate;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      brand_id: "",
      category_id: "",
      description: "",
      short_description: "",
      price: "",
      original_price: "",
      cost_price: "",
      stock_quantity: 0,
      low_stock_threshold: 2,
      status: "DRAFT",
      is_indexable: true,
      fabric: "",
      care_instructions: "",
      authenticity_note: "",
      pieces: "",
      edit_note: "",
      video_url: "",
      keep_pre_order: false,
      is_featured: false,
      is_new: false,
      is_sale: false,
      is_just_in: false,
      sort_order: 0,
      seo_title: "",
      seo_description: "",
      images: [],
      sizes_text: "",
      colors_text: "",
      collection_ids: [],
    },
  });

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      slug: existing.data.slug,
      sku: existing.data.sku,
      brand_id: existing.data.brand.id,
      category_id: existing.data.category.id,
      description: existing.data.description,
      short_description: existing.data.short_description ?? "",
      price: String(existing.data.price),
      original_price: existing.data.original_price
        ? String(existing.data.original_price)
        : "",
      cost_price: existing.data.cost_price
        ? String(existing.data.cost_price)
        : "",
      stock_quantity: existing.data.stock_quantity,
      low_stock_threshold: existing.data.low_stock_threshold,
      status: existing.data.status,
      is_indexable: existing.data.is_indexable,
      fabric: existing.data.fabric ?? "",
      care_instructions: existing.data.care_instructions ?? "",
      authenticity_note: existing.data.authenticity_note ?? "",
      pieces: existing.data.pieces ?? "",
      edit_note: existing.data.edit_note ?? "",
      video_url: existing.data.video_url ?? "",
      keep_pre_order: existing.data.keep_pre_order,
      is_featured: existing.data.is_featured,
      is_new: existing.data.is_new,
      is_sale: existing.data.is_sale,
      is_just_in: existing.data.is_just_in,
      sort_order: existing.data.sort_order,
      seo_title: existing.data.seo_title ?? "",
      seo_description: existing.data.seo_description ?? "",
      images: existing.data.images.map(({ image_url, alt_text }) => ({
        image_url,
        alt_text,
      })),
      sizes_text: existing.data.sizes.join(", "),
      colors_text: existing.data.colors.join(", "),
      collection_ids: existing.data.collections.map(
        (collection) => collection.id,
      ),
    });
  }, [existing.data, form]);

  const selectedCollections =
    useWatch({ control: form.control, name: "collection_ids" }) ?? [];
  const images = useWatch({ control: form.control, name: "images" }) ?? [];

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      form.formState.isDirty &&
      !save.isPending &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  async function onSubmit(values: FormValues) {
    try {
      const saved = await save.mutateAsync({
        id,
        body: {
          name: values.name,
          slug: values.slug.trim() || null,
          sku: values.sku,
          brand_id: values.brand_id,
          category_id: values.category_id,
          description: values.description,
          short_description: values.short_description.trim() || null,
          price: values.price,
          original_price: values.original_price.trim() || null,
          cost_price: values.cost_price.trim() || null,
          stock_quantity: values.stock_quantity,
          low_stock_threshold: values.low_stock_threshold,
          status: values.status as ProductStatus,
          is_indexable: values.is_indexable,
          fabric: values.fabric.trim() || null,
          care_instructions: values.care_instructions.trim() || null,
          authenticity_note: values.authenticity_note.trim() || null,
          pieces: values.pieces.trim() || null,
          edit_note: values.edit_note.trim() || null,
          video_url: values.video_url.trim() || null,
          keep_pre_order: values.keep_pre_order,
          is_featured: values.is_featured,
          is_new: values.is_new,
          is_sale: values.is_sale,
          is_just_in: values.is_just_in,
          sort_order: values.sort_order,
          seo_title: values.seo_title.trim() || null,
          seo_description: values.seo_description.trim() || null,
          images: values.images.map((image) => ({
            image_url: image.image_url,
            alt_text: image.alt_text?.trim() || null,
          })),
          sizes: splitList(values.sizes_text),
          colors: splitList(values.colors_text),
          collection_ids: values.collection_ids,
        },
      });
      toast.success(isNew ? "Product added." : "Product updated.");
      navigate(`/products/${saved.id}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not save this piece.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton fields={8} />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader
        eyebrow="Catalog"
        title="Product not found"
        description="This product could not be found."
      />
    );
  }

  return (
    <div className={`relative space-y-6 ${canWrite ? "pb-28" : ""}`}>
      <PageHeader
        eyebrow="Catalog"
        title={isNew ? "Add product" : "Edit product"}
        description="Prices are PKR. Discount is always current price against original price. Brands are catalogue labels only."
      />

      <div className="xl:grid xl:grid-cols-[1fr_minmax(0,18rem)] xl:items-start xl:gap-8">
        <form
          id="product-form"
          className="space-y-8 border border-border bg-card p-6"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <section id="section-basics" className="scroll-mt-28 space-y-4">
            <h2 className="font-display text-2xl tracking-wide">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" disabled={!canWrite} {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" disabled={!canWrite} {...form.register("sku")} />
            <FieldError message={form.formState.errors.sku?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              disabled={!canWrite}
              placeholder="Generated if left blank"
              {...form.register("slug")}
            />
            <FieldError message={form.formState.errors.slug?.message} />
            <ProductSlugHint
              control={form.control}
              isActiveEdit={!isNew && existing.data?.status === "ACTIVE"}
              originalSlug={existing.data?.slug}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_id">Brand</Label>
            <NativeSelect
              id="brand_id"
              disabled={!canWrite}
              {...form.register("brand_id")}
            >
              <option value="">Choose a label</option>
              {(brands.data?.data ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={form.formState.errors.brand_id?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <NativeSelect
              id="category_id"
              disabled={!canWrite}
              {...form.register("category_id")}
            >
              <option value="">Choose a category</option>
              {(categories.data?.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              Lawn stays a fabric. New In is navigational, not a product
              category.
            </p>
            <FieldError message={form.formState.errors.category_id?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <NativeSelect
              id="status"
              disabled={!canWrite}
              {...form.register("status")}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              disabled={!canWrite}
              {...form.register("sort_order", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.sort_order?.message} />
          </div>
        </div>
        </section>

        <section id="section-pricing" className="scroll-mt-28 space-y-4">
          <h2 className="font-display text-2xl tracking-wide">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (PKR)</Label>
              <Input id="price" disabled={!canWrite} {...form.register("price")} />
              <FieldError message={form.formState.errors.price?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Original price</Label>
              <Input id="original_price" disabled={!canWrite} {...form.register("original_price")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost price</Label>
              <Input id="cost_price" disabled={!canWrite} {...form.register("cost_price")} />
              <p className="text-xs text-muted-foreground">Admin only. Never shown on the storefront.</p>
            </div>
          </div>
        </section>

        <section id="section-details" className="scroll-mt-28 space-y-4">
          <h2 className="font-display text-2xl tracking-wide">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fabric">Fabric</Label>
              <Input
                id="fabric"
                disabled={!canWrite}
                placeholder="Lawn, Cambric, Cotton"
                {...form.register("fabric")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pieces">Pieces</Label>
              <Input
                id="pieces"
                disabled={!canWrite}
                placeholder="Shirt, dupatta, trouser"
                {...form.register("pieces")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizes_text">Sizes</Label>
              <Input
                id="sizes_text"
                disabled={!canWrite}
                placeholder="Unstitched, or S, M, L"
                {...form.register("sizes_text")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colors_text">Colors</Label>
              <Input
                id="colors_text"
                disabled={!canWrite}
                placeholder="Ivory, Sand"
                {...form.register("colors_text")}
              />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            disabled={!canWrite}
            {...form.register("description")}
          />
        </section>
        <section className="space-y-2">
          <Label htmlFor="edit_note">Product note</Label>
          <Textarea
            id="edit_note"
            disabled={!canWrite}
            {...form.register("edit_note")}
          />
        </section>
        <section className="space-y-2">
          <Label htmlFor="authenticity_note">Authenticity note</Label>
          <Textarea
            id="authenticity_note"
            disabled={!canWrite}
            {...form.register("authenticity_note")}
          />
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="care_instructions">Care</Label>
            <Textarea
              id="care_instructions"
              disabled={!canWrite}
              {...form.register("care_instructions")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              disabled={!canWrite}
              {...form.register("video_url")}
            />
            <Label htmlFor="short_description">Short description</Label>
            <Textarea
              id="short_description"
              disabled={!canWrite}
              {...form.register("short_description")}
            />
          </div>
        </section>

        <section>
          <ImageUploadField
            id="images"
            label="Images"
            folder="catalog"
            multiple
            disabled={!canWrite}
            images={images}
            onImagesChange={(value) =>
              form.setValue("images", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </section>

        <section className="space-y-3">
          <p className="text-sm font-medium">Collections</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(collections.data?.data ?? []).map((collection) => (
              <label
                key={collection.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  disabled={!canWrite}
                  checked={selectedCollections.includes(collection.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedCollections, collection.id]
                      : selectedCollections.filter(
                          (value) => value !== collection.id,
                        );
                    form.setValue("collection_ids", next, {
                      shouldDirty: true,
                    });
                  }}
                />
                {collection.name}
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_featured")}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_new")}
            />
            New
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_sale")}
            />
            Sale
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_just_in")}
            />
            Just in
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("keep_pre_order")}
            />
            Keep as pre-order
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_indexable")}
            />
            Allow Search Engines to Index This Page
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock</Label>
            <Input
              id="stock_quantity"
              type="number"
              disabled={!canWrite || !isNew}
              {...form.register("stock_quantity", { valueAsNumber: true })}
            />
            <FieldError
              message={form.formState.errors.stock_quantity?.message}
            />
            {isNew ? (
              <p className="text-xs text-muted-foreground">
                Initial quantity writes a RESTOCK row. Later changes go through
                inventory adjustments.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Available {existing.data?.available_stock ?? 0} (reserved{" "}
                {existing.data?.reserved_stock ?? 0}).{" "}
                <Link
                  className="underline"
                  to={`/inventory/adjustments?product_id=${id}`}
                >
                  Adjust stock
                </Link>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="low_stock_threshold">Low stock threshold</Label>
            <Input
              id="low_stock_threshold"
              type="number"
              disabled={!canWrite}
              {...form.register("low_stock_threshold", { valueAsNumber: true })}
            />
            <FieldError
              message={form.formState.errors.low_stock_threshold?.message}
            />
          </div>
        </section>

        <section id="section-seo" className="scroll-mt-28 space-y-4">
          <h2 className="font-display text-2xl tracking-wide">SEO</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO title</Label>
              <Input id="seo_title" disabled={!canWrite} {...form.register("seo_title")} />
              <ProductSeoTitleGuidance control={form.control} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO description</Label>
              <Textarea id="seo_description" disabled={!canWrite} {...form.register("seo_description")} />
              <ProductSeoDescriptionGuidance control={form.control} />
            </div>
          </div>
        </section>

        {canWrite ? null : (
          <p className="text-sm text-muted-foreground">You can view this piece, but STAFF cannot change it.</p>
        )}
      </form>

        <aside className="mt-6 space-y-3 border border-border bg-card p-5 xl:sticky xl:top-4 xl:mt-0">
          <h2 className="font-display text-xl">On this page</h2>
          <nav aria-label="Section anchors" className="flex flex-col gap-2 text-sm">
            <a className="underline-offset-2 hover:underline" href="#section-basics">
              Basics
            </a>
            <a className="underline-offset-2 hover:underline" href="#section-pricing">
              Pricing
            </a>
            <a className="underline-offset-2 hover:underline" href="#section-details">
              Details
            </a>
            <a className="underline-offset-2 hover:underline" href="#section-seo">
              SEO
            </a>
          </nav>
          <div className="border-t border-border pt-3">
            <h3 className="font-medium">Summary</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNew ? "New piece — save to create." : (existing.data?.name ?? "Product")}
            </p>
            {form.formState.isDirty ? (
              <p className="mt-2 text-sm text-warning">Unsaved changes</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No unsaved edits.</p>
            )}
          </div>
        </aside>
      </div>

      {canWrite ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-3 sm:flex-nowrap">
            <Button type="button" variant="outline" className="min-h-11 flex-1 sm:min-h-10" asChild>
              <Link to="/products">Cancel</Link>
            </Button>
            <Button type="submit" form="product-form" className="min-h-11 flex-1 sm:min-h-10" pending={save.isPending}>
              {save.isPending ? "Saving" : "Save product"}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Discard unsaved changes?"
        body="You have edits that are not saved yet. Leave without saving?"
        confirmLabel="Leave"
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}
