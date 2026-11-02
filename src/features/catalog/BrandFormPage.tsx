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
import { useBrand, useSaveBrand } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string(),
  description: z.string(),
  logo: z.string(),
  website_url: z.string(),
  is_active: z.boolean(),
  sort_order: z.number({ error: "Enter a number." }).int("Enter a whole number."),
});

type FormValues = z.infer<typeof schema>;

export function BrandFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const existing = useBrand(id);
  const save = useSaveBrand();
  const canWrite = isNew ? canCreate : canUpdate;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo: "",
      website_url: "",
      is_active: true,
      sort_order: 0,
    },
  });
  const logoValue = useWatch({ control: form.control, name: "logo" }) ?? "";

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      slug: existing.data.slug,
      description: existing.data.description ?? "",
      logo: existing.data.logo ?? "",
      website_url: existing.data.website_url ?? "",
      is_active: existing.data.is_active,
      sort_order: existing.data.sort_order,
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
          logo: values.logo.trim() || null,
          website_url: values.website_url.trim() || null,
          is_active: values.is_active,
          sort_order: values.sort_order,
        },
      });
      toast.success(isNew ? "Brand added." : "Brand updated.");
      navigate(`/brands/${saved.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not save this brand.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader eyebrow="Catalog" title="Brand not found" description="This catalogue label could not be found." />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title={isNew ? "Add brand" : "Edit brand"}
        description="Use the label as it appears on the piece. This is not a claim of affiliation."
      />
      <form className="space-y-5 border border-border bg-card p-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={!canWrite} {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" disabled={!canWrite} placeholder="Generated from the name if left blank" {...form.register("slug")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" disabled={!canWrite} {...form.register("description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            id="logo"
            label="Logo"
            folder="catalog"
            disabled={!canWrite}
            value={logoValue}
            onChange={(value) => form.setValue("logo", value, { shouldDirty: true })}
          />
          <div className="space-y-2">
            <Label htmlFor="website_url">Website</Label>
            <Input id="website_url" disabled={!canWrite} {...form.register("website_url")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={!canWrite} {...form.register("is_active")} />
            Active
          </label>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input id="sort_order" type="number" disabled={!canWrite} {...form.register("sort_order", { valueAsNumber: true })} />
            <FieldError message={form.formState.errors.sort_order?.message} />
          </div>
        </div>
        {canWrite ? (
          <Button type="submit" pending={save.isPending}>
            {save.isPending ? "Saving" : "Save brand"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You can view catalogue labels, but STAFF cannot change them.</p>
        )}
      </form>
    </div>
  );
}
