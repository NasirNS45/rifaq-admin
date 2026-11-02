import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/ImageUploadField";
import { SeoTextGuidance } from "@/components/SeoTextGuidance";
import { FormSkeleton } from "@/components/loading";
import { FieldError, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategories,
  useCategory,
  useSaveCategory,
} from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Use lowercase letters, numbers, and single hyphens.",
    ),
  description: z.string(),
  image: z.string(),
  parent_id: z.string(),
  is_active: z.boolean(),
  is_indexable: z.boolean(),
  sort_order: z
    .number({ error: "Enter a number." })
    .int("Enter a whole number."),
  seo_title: z.string(),
  seo_description: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function CategoryFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const existing = useCategory(id);
  const parents = useCategories({ page: 1, limit: 100 });
  const save = useSaveCategory();
  const canWrite = isNew ? canCreate : canUpdate;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parent_id: "",
      is_active: true,
      is_indexable: true,
      sort_order: 0,
      seo_title: "",
      seo_description: "",
    },
  });
  const imageValue = useWatch({ control: form.control, name: "image" }) ?? "";
  const slugValue = useWatch({ control: form.control, name: "slug" }) ?? "";
  const slugIsValid =
    !slugValue || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue);
  const seoTitle = useWatch({ control: form.control, name: "seo_title" }) ?? "";
  const seoDescription =
    useWatch({ control: form.control, name: "seo_description" }) ?? "";

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      slug: existing.data.slug,
      description: existing.data.description ?? "",
      image: existing.data.image ?? "",
      parent_id: existing.data.parent_id ?? "",
      is_active: existing.data.is_active,
      is_indexable: existing.data.is_indexable,
      sort_order: existing.data.sort_order,
      seo_title: existing.data.seo_title ?? "",
      seo_description: existing.data.seo_description ?? "",
    });
  }, [existing.data, form]);

  async function onSubmit(values: FormValues) {
    try {
      const saved = await save.mutateAsync({
        id,
        body: {
          name: values.name,
          slug: values.slug.trim() || null,
          description: values.description.trim() || null,
          image: values.image.trim() || null,
          parent_id: values.parent_id || null,
          is_active: values.is_active,
          is_indexable: values.is_indexable,
          sort_order: values.sort_order,
          seo_title: values.seo_title.trim() || null,
          seo_description: values.seo_description.trim() || null,
        },
      });
      toast.success(isNew ? "Category added." : "Category updated.");
      navigate(`/categories/${saved.id}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not save this category.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader
        eyebrow="Catalog"
        title="Category not found"
        description="This category could not be found."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title={isNew ? "Add category" : "Edit category"}
        description="Keep Lawn off this list. It belongs on the product as fabric."
      />
      <form
        className="space-y-5 border border-border bg-card p-6"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={!canWrite} {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" disabled={!canWrite} {...form.register("slug")} />
          <FieldError message={form.formState.errors.slug?.message} />
          <p
            className={`text-xs ${slugIsValid ? "text-muted-foreground" : "text-destructive"}`}
          >
            {slugIsValid
              ? slugValue
                ? "Slug format is valid."
                : "A slug will be generated from the category name."
              : "Use lowercase letters, numbers, and single hyphens."}
          </p>
          {!isNew &&
          existing.data?.is_active &&
          slugValue !== existing.data.slug ? (
            <p role="status" className="text-xs text-amber-700">
              Modifying this slug will alter the live URL. A 301 permanent
              redirect will be created for the old URL.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            disabled={!canWrite}
            {...form.register("description")}
          />
        </div>
        <ImageUploadField
          id="image"
          label="Image"
          folder="catalog"
          disabled={!canWrite}
          value={imageValue}
          onChange={(value) =>
            form.setValue("image", value, { shouldDirty: true })
          }
        />
        <div className="space-y-2">
          <Label htmlFor="parent_id">Parent</Label>
          <NativeSelect
            id="parent_id"
            disabled={!canWrite}
            {...form.register("parent_id")}
          >
            <option value="">None</option>
            {(parents.data?.data ?? [])
              .filter((category) => category.id !== id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </NativeSelect>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_active")}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!canWrite}
              {...form.register("is_indexable")}
            />
            Allow Search Engines to Index This Page
          </label>
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
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO title</Label>
          <Input
            id="seo_title"
            disabled={!canWrite}
            {...form.register("seo_title")}
          />
          <SeoTextGuidance value={seoTitle} kind="title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_description">SEO description</Label>
          <Textarea
            id="seo_description"
            disabled={!canWrite}
            {...form.register("seo_description")}
          />
          <SeoTextGuidance value={seoDescription} kind="description" />
        </div>
        {canWrite ? (
          <Button type="submit" pending={save.isPending}>
            {save.isPending ? "Saving" : "Save category"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can view categories, but STAFF cannot change them.
          </p>
        )}
      </form>
    </div>
  );
}
