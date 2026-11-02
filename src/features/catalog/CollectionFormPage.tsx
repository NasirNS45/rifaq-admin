import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/ImageUploadField";
import { FormSkeleton } from "@/components/loading";
import { FieldError, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useSaveCollection } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string(),
  description: z.string(),
  image: z.string(),
  banner_image: z.string(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number({ error: "Enter a number." }).int("Enter a whole number."),
  seo_title: z.string(),
  seo_description: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function CollectionFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const existing = useCollection(id);
  const save = useSaveCollection();
  const canWrite = isNew ? canCreate : canUpdate;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      banner_image: "",
      is_active: true,
      is_featured: false,
      sort_order: 0,
      seo_title: "",
      seo_description: "",
    },
  });
  const imageValue = useWatch({ control: form.control, name: "image" }) ?? "";
  const bannerValue = useWatch({ control: form.control, name: "banner_image" }) ?? "";

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      slug: existing.data.slug,
      description: existing.data.description ?? "",
      image: existing.data.image ?? "",
      banner_image: existing.data.banner_image ?? "",
      is_active: existing.data.is_active,
      is_featured: existing.data.is_featured,
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
          banner_image: values.banner_image.trim() || null,
          is_active: values.is_active,
          is_featured: values.is_featured,
          sort_order: values.sort_order,
          seo_title: values.seo_title.trim() || null,
          seo_description: values.seo_description.trim() || null,
        },
      });
      toast.success(isNew ? "Collection added." : "Collection updated.");
      navigate(`/collections/${saved.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not save this collection.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader eyebrow="Catalog" title="Collection not found" description="This collection could not be found." />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title={isNew ? "Add collection" : "Edit collection"}
        description="Collections group products for the storefront, such as New Arrivals, Summer, or Festive."
      />
      <form className="space-y-5 border border-border bg-card p-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={!canWrite} {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" disabled={!canWrite} {...form.register("slug")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" disabled={!canWrite} {...form.register("description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            id="image"
            label="Image"
            folder="catalog"
            disabled={!canWrite}
            value={imageValue}
            onChange={(value) => form.setValue("image", value, { shouldDirty: true })}
          />
          <ImageUploadField
            id="banner_image"
            label="Banner"
            folder="catalog"
            disabled={!canWrite}
            value={bannerValue}
            onChange={(value) => form.setValue("banner_image", value, { shouldDirty: true })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={!canWrite} {...form.register("is_active")} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={!canWrite} {...form.register("is_featured")} />
            Featured
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort order</Label>
          <Input id="sort_order" type="number" disabled={!canWrite} {...form.register("sort_order", { valueAsNumber: true })} />
          <FieldError message={form.formState.errors.sort_order?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO title</Label>
          <Input id="seo_title" disabled={!canWrite} {...form.register("seo_title")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo_description">SEO description</Label>
          <Textarea id="seo_description" disabled={!canWrite} {...form.register("seo_description")} />
        </div>
        {canWrite ? (
          <Button type="submit" pending={save.isPending}>
            {save.isPending ? "Saving" : "Save collection"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You can view collections, but STAFF cannot change them.</p>
        )}
      </form>
    </div>
  );
}
