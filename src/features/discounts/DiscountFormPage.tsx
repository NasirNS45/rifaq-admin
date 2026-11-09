import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormSaveActions } from "@/components/FormSaveActions";
import { FormSkeleton } from "@/components/loading";
import { FieldError, PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useCollections, useProducts } from "@/hooks/useCatalog";
import { useDiscount, useSaveDiscount } from "@/hooks/useDiscounts";
import { usePermissions } from "@/hooks/usePermissions";
import { focusFormField, useSaveIntent } from "@/hooks/useSaveIntent";
import { ApiError } from "@/lib/api";
import type { DiscountType } from "@/types/api";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    discount_type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.string().trim().min(1, "Value is required."),
    starts_at: z.string(),
    ends_at: z.string(),
    is_active: z.boolean(),
    description: z.string(),
    product_ids: z.array(z.string()),
    collection_ids: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    const amount = Number(values.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Value must be greater than zero." });
    }
    if (values.discount_type === "PERCENTAGE" && amount > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage discounts cannot exceed 100.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_FORM_VALUES: FormValues = {
  name: "",
  discount_type: "PERCENTAGE",
  value: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
  description: "",
  product_ids: [],
  collection_ids: [],
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function DiscountFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canCreate, canUpdate } = usePermissions();
  const existing = useDiscount(id);
  const save = useSaveDiscount();
  const { beginSubmit, consumeIntent, clearPendingIntent, pendingIntent } = useSaveIntent();
  const products = useProducts({ page: 1, limit: 100 });
  const collections = useCollections({ page: 1, limit: 100 });
  const canWrite = isNew ? canCreate : canUpdate;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const selectedProducts = useWatch({ control: form.control, name: "product_ids" }) ?? [];
  const selectedCollections = useWatch({ control: form.control, name: "collection_ids" }) ?? [];

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      discount_type: existing.data.discount_type,
      value: String(existing.data.value),
      starts_at: toLocalInput(existing.data.starts_at),
      ends_at: toLocalInput(existing.data.ends_at),
      is_active: existing.data.is_active,
      description: existing.data.description ?? "",
      product_ids: existing.data.product_ids,
      collection_ids: existing.data.collection_ids,
    });
  }, [existing.data, form]);

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    if (pendingIntent === null) {
      beginSubmit("save");
    }
    void form.handleSubmit(onSubmit, () => clearPendingIntent())(event);
  }

  async function onSubmit(values: FormValues) {
    try {
      const saved = await save.mutateAsync({
        id,
        body: {
          name: values.name,
          discount_type: values.discount_type as DiscountType,
          value: values.value,
          starts_at: fromLocalInput(values.starts_at),
          ends_at: fromLocalInput(values.ends_at),
          is_active: values.is_active,
          description: values.description.trim() || null,
          product_ids: values.product_ids,
          collection_ids: values.collection_ids,
        },
      });
      const intent = consumeIntent();
      if (intent === "saveAndNew") {
        if (isNew) {
          toast.success("Campaign added. Add the next one.");
          form.reset(DEFAULT_FORM_VALUES);
          focusFormField("name");
          return;
        }
        toast.success("Campaign updated.");
        form.reset(DEFAULT_FORM_VALUES);
        navigate("/discounts/new");
        return;
      }
      toast.success(isNew ? "Campaign added." : "Campaign updated.");
      navigate(`/discounts/${saved.id}`, { replace: true });
    } catch (error) {
      clearPendingIntent();
      const message = error instanceof ApiError ? error.message : "Could not save this campaign.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader
        eyebrow="Marketing"
        title="Campaign not found"
        description="This sale campaign could not be found."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title={isNew ? "Add campaign" : "Edit campaign"}
        description="Leave products and collections empty for a store-wide sale. If several campaigns match, the lowest selling price wins."
      />
      <form
        className="space-y-5 border border-border bg-card p-6"
        noValidate
        onSubmit={submitForm}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={!canWrite} {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="discount_type">Type</Label>
            <NativeSelect id="discount_type" disabled={!canWrite} {...form.register("discount_type")}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount (PKR)</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input id="value" disabled={!canWrite} {...form.register("value")} />
            <FieldError message={form.formState.errors.value?.message} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="starts_at">Starts</Label>
            <Input id="starts_at" type="datetime-local" disabled={!canWrite} {...form.register("starts_at")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends_at">Ends</Label>
            <Input id="ends_at" type="datetime-local" disabled={!canWrite} {...form.register("ends_at")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" disabled={!canWrite} {...form.register("description")} />
        </div>
        <section className="space-y-3">
          <p className="text-sm font-medium">Pieces</p>
          <div className="grid max-h-48 gap-2 overflow-auto sm:grid-cols-2">
            {(products.data?.data ?? []).map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={!canWrite}
                  checked={selectedProducts.includes(product.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedProducts, product.id]
                      : selectedProducts.filter((value) => value !== product.id);
                    form.setValue("product_ids", next, { shouldDirty: true });
                  }}
                />
                {product.name}
              </label>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium">Collections</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(collections.data?.data ?? []).map((collection) => (
              <label key={collection.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={!canWrite}
                  checked={selectedCollections.includes(collection.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedCollections, collection.id]
                      : selectedCollections.filter((value) => value !== collection.id);
                    form.setValue("collection_ids", next, { shouldDirty: true });
                  }}
                />
                {collection.name}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Empty lists mean the campaign applies to the whole store.
          </p>
        </section>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={!canWrite} {...form.register("is_active")} />
          Active
        </label>
        {canWrite ? (
          <FormSaveActions
            isNew={isNew}
            primaryLabel="Save campaign"
            isPending={save.isPending}
            pendingIntent={pendingIntent}
            onPrimaryClick={() => beginSubmit("save")}
            onSaveAndNewClick={() => {
              beginSubmit("saveAndNew");
              void form.handleSubmit(onSubmit, () => clearPendingIntent())();
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">You can view campaigns, but STAFF cannot change them.</p>
        )}
      </form>
    </div>
  );
}
