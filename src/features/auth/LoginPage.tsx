import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BrandLockup } from "@/components/BrandMark";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { useTheme } from "@/providers/useTheme";

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value.includes("@") && Boolean(value.split("@", 2)[1]), {
      message: "Enter a valid email.",
    }),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { resolved } = useTheme();
  const login = useLogin();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await login.mutateAsync(values);
      toast.success("Signed in.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not sign in.";
      toast.error(message);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-muted px-4">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md border border-border bg-card p-8 shadow-soft sm:p-10 fade-up">
        <BrandLockup className="mx-auto h-28 w-auto" dark={resolved === "dark"} />
        <p className="mt-6 text-center eyebrow text-accent-text">Internal console</p>
        <h1 className="mt-2 text-center font-display text-4xl tracking-wide text-foreground">
          Admin
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to manage products, orders, and WhatsApp confirmations.
        </p>
        <form className="mt-8 space-y-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            id="email"
            label="Email"
            error={form.formState.errors.email?.message}
          >
            <Input type="email" inputMode="email" autoComplete="email" {...form.register("email")} />
          </FormField>
          <FormField id="password" label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...form.register("password")} />
          </FormField>
          <Button type="submit" className="w-full eyebrow" pending={login.isPending}>
            {login.isPending ? "Signing in" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Internal use only. The public storefront is unchanged.
        </p>
      </div>
    </div>
  );
}
