import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api, mediaPreviewUrl } from "@/lib/api";
import type { MediaAsset, MediaFolder } from "@/types/api";
import { UploadProgress } from "@/components/loading";
import { ProductImageFallback } from "@/components/ProductImageFallback";
import { cn } from "@/lib/utils";

export type ImageUploadItem = {
  image_url: string;
  alt_text: string | null;
};

type SharedImageUploadFieldProps = {
  id: string;
  label: string;
  folder: MediaFolder;
  disabled?: boolean;
  hint?: string;
  multiple?: boolean;
};

type ImageUploadFieldProps = SharedImageUploadFieldProps &
  (
    | {
        value: string;
        onChange: (value: string) => void;
        images?: never;
        onImagesChange?: never;
      }
    | {
        images: ImageUploadItem[];
        onImagesChange: (images: ImageUploadItem[]) => void;
        value?: never;
        onChange?: never;
      }
  );

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

function parseUrls(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function PreviewThumb({
  src,
  alt,
  isPrimary,
  canMoveLeft,
  canMoveRight,
  disabled,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  src: string;
  alt: string;
  isPrimary: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  disabled: boolean;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative h-28 w-28 border border-border bg-surface-sunken">
      {broken || !src.trim() ? (
        <ProductImageFallback />
      ) : (
        <img
          src={mediaPreviewUrl(src)}
          alt={alt}
          width={112}
          height={112}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {isPrimary ? (
        <span className="absolute top-1 left-1 bg-primary px-1.5 py-0.5 text-2xs tracking-wide text-primary-foreground uppercase">
          Primary
        </span>
      ) : null}
      {!disabled ? (
        <>
          <button
            type="button"
            aria-label="Remove image"
            onClick={onRemove}
            className="absolute right-1 top-1 touch-target cursor-pointer bg-card/90 p-1 text-foreground after:absolute after:-inset-2 after:content-[''] hover:bg-card sm:min-h-0 sm:min-w-0 sm:after:content-none"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {canMoveLeft || canMoveRight ? (
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              <button
                type="button"
                aria-label="Move earlier"
                disabled={!canMoveLeft}
                onClick={onMoveLeft}
                className="touch-target cursor-pointer bg-card/90 p-1 disabled:cursor-not-allowed disabled:opacity-30 sm:min-h-0 sm:min-w-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move later"
                disabled={!canMoveRight}
                onClick={onMoveRight}
                className="touch-target cursor-pointer bg-card/90 p-1 disabled:cursor-not-allowed disabled:opacity-30 sm:min-h-0 sm:min-w-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export const ImageUploadField = ({
  id,
  label,
  folder,
  disabled = false,
  hint,
  multiple = false,
  ...props
}: ImageUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const structured = "images" in props && props.images !== undefined;
  const items: ImageUploadItem[] = structured
    ? props.images
    : parseUrls(props.value ?? "").map((image_url) => ({
        image_url,
        alt_text: null,
      }));

  function setItems(next: ImageUploadItem[]) {
    if (structured && "onImagesChange" in props) {
      props.onImagesChange(next);
    } else if ("onChange" in props) {
      props.onChange(next.map((item) => item.image_url).join("\n"));
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = multiple
      ? Array.from(fileList)
      : fileList[0]
        ? [fileList[0]]
        : [];
    if (files.length === 0) return;
    setUploading(true);
    setPendingCount(files.length);
    try {
      const uploaded: ImageUploadItem[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const asset = await api.upload<MediaAsset>(
          `/api/v1/media?folder=${folder}`,
          body,
        );
        uploaded.push({ image_url: asset.url, alt_text: null });
      }
      if (multiple) {
        setItems([...items, ...uploaded]);
      } else {
        setItems(uploaded[0] ? [uploaded[0]] : []);
      }
      toast.success(
        files.length === 1 ? "Image uploaded." : "Images uploaded.",
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not upload this image.";
      toast.error(message);
    } finally {
      setUploading(false);
      setPendingCount(0);
    }
  }

  const defaultHint = multiple
    ? "JPEG, PNG, WebP, AVIF, or GIF. Maximum 8 MB. The first image is the primary."
    : "JPEG, PNG, WebP, AVIF, or GIF. Maximum 8 MB.";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        disabled={disabled || uploading}
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        className={cn(
          "border border-dashed border-input bg-card px-4 py-6 text-center",
          dragOver && "border-foreground bg-muted",
          (disabled || uploading) && "opacity-60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (disabled || uploading) return;
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm">
          {multiple
            ? "Drop images here, or choose files."
            : "Drop an image here, or choose a file."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={disabled || uploading}
          pending={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? "Uploading"
            : multiple
              ? "Choose images"
              : "Choose image"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading." : (hint ?? defaultHint)}
      </p>
      {items.length > 0 || pendingCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div key={`${item.image_url}-${index}`} className="space-y-1">
              <PreviewThumb
                src={item.image_url}
                alt={item.alt_text ?? ""}
                isPrimary={multiple && index === 0}
                canMoveLeft={multiple && index > 0}
                canMoveRight={multiple && index < items.length - 1}
                disabled={disabled || uploading}
                onRemove={() => setItems(items.filter((_, i) => i !== index))}
                onMoveLeft={() => {
                  if (index === 0) return;
                  const next = [...items];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  setItems(next);
                }}
                onMoveRight={() => {
                  if (index >= items.length - 1) return;
                  const next = [...items];
                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];
                  setItems(next);
                }}
              />
              {structured ? (
                <Input
                  type="text"
                  aria-label={`Alt text for image ${index + 1}`}
                  placeholder="Alt text"
                  maxLength={200}
                  disabled={disabled || uploading}
                  value={item.alt_text ?? ""}
                  onChange={(event) =>
                    setItems(
                      items.map((image, imageIndex) =>
                        imageIndex === index
                          ? { ...image, alt_text: event.target.value || null }
                          : image,
                      ),
                    )
                  }
                  className="h-9 w-28 max-w-full text-xs"
                />
              ) : null}
            </div>
          ))}
          {Array.from({ length: pendingCount }, (_, index) => (
            <UploadProgress key={`pending-${index}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
