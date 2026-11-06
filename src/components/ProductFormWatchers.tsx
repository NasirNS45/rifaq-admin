import { useWatch, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { SeoTextGuidance } from "@/components/SeoTextGuidance";

export function ProductSlugHint<T extends FieldValues>({
  control,
  isActiveEdit,
  originalSlug,
}: {
  control: Control<T>;
  isActiveEdit: boolean;
  originalSlug: string | undefined;
}) {
  const slugValue = (useWatch({ control, name: "slug" as FieldPath<T> }) as string | undefined) ?? "";
  const slugIsValid = !slugValue || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue);

  return (
    <>
      <p className={`text-xs ${slugIsValid ? "text-muted-foreground" : "text-destructive"}`}>
        {slugIsValid
          ? slugValue
            ? "Slug format is valid."
            : "A slug will be generated from the product name."
          : "Use lowercase letters, numbers, and single hyphens."}
      </p>
      {isActiveEdit && slugValue !== originalSlug ? (
        <p role="status" className="text-xs text-warning">
          Modifying this slug will alter the live URL. A 301 permanent redirect will be created for the old URL.
        </p>
      ) : null}
    </>
  );
}

export function ProductSeoTitleGuidance<T extends FieldValues>({ control }: { control: Control<T> }) {
  const seoTitle =
    (useWatch({ control, name: "seo_title" as FieldPath<T> }) as string | undefined) ?? "";
  return <SeoTextGuidance value={seoTitle} kind="title" />;
}

export function ProductSeoDescriptionGuidance<T extends FieldValues>({ control }: { control: Control<T> }) {
  const seoDescription =
    (useWatch({ control, name: "seo_description" as FieldPath<T> }) as string | undefined) ?? "";
  return <SeoTextGuidance value={seoDescription} kind="description" />;
}
