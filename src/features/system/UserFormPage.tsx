import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminUser, useSaveAdminUser } from "@/hooks/useUsers";
import { focusFormField, useSaveIntent } from "@/hooks/useSaveIntent";
import { ApiError } from "@/lib/api";
import type { AdminRole } from "@/types/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("A valid email is required."),
  password: z.string(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"]),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_FORM_VALUES: FormValues = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
  is_active: true,
};

export function UserFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { canManageUsers } = usePermissions();
  const me = useCurrentUser();
  const existing = useAdminUser(id);
  const save = useSaveAdminUser();
  const { beginSubmit, consumeIntent, clearPendingIntent, pendingIntent } = useSaveIntent();
  const isSelf = Boolean(id && me.data?.id === id);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (!existing.data) return;
    form.reset({
      name: existing.data.name,
      email: existing.data.email,
      password: "",
      role: existing.data.role,
      is_active: existing.data.is_active,
    });
  }, [existing.data, form]);

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    if (pendingIntent === null) {
      beginSubmit("save");
    }
    void form.handleSubmit(onSubmit, () => clearPendingIntent())(event);
  }

  async function onSubmit(values: FormValues) {
    if (isNew && values.password.length < 8) {
      clearPendingIntent();
      form.setError("password", { message: "Password must be at least 8 characters." });
      return;
    }
    if (!isNew && values.password && values.password.length < 8) {
      clearPendingIntent();
      form.setError("password", { message: "Password must be at least 8 characters." });
      return;
    }
    try {
      const body: {
        name: string;
        email: string;
        role: AdminRole;
        is_active: boolean;
        password?: string;
      } = {
        name: values.name,
        email: values.email,
        role: values.role,
        is_active: values.is_active,
      };
      if (values.password) body.password = values.password;
      const saved = await save.mutateAsync({ id, body });
      const intent = consumeIntent();
      if (intent === "saveAndNew") {
        if (isNew) {
          toast.success("Admin user created. Add the next one.");
          form.reset(DEFAULT_FORM_VALUES);
          focusFormField("name");
          return;
        }
        toast.success("Admin user updated.");
        form.reset(DEFAULT_FORM_VALUES);
        navigate("/system/users/new");
        return;
      }
      toast.success(isNew ? "Admin user created." : "Admin user updated.");
      navigate(`/system/users/${saved.id}`, { replace: true });
    } catch (error) {
      clearPendingIntent();
      const message = error instanceof ApiError ? error.message : "Could not save this user.";
      toast.error(message);
    }
  }

  if (!isNew && existing.isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && existing.isError) {
    return (
      <PageHeader
        eyebrow="System"
        title="User not found"
        description="This admin account could not be found."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="System"
        title={isNew ? "Add admin user" : "Edit admin user"}
        description="Passwords are never shown after save. Deactivate an account instead of deleting it."
      />
      <form
        className="space-y-5 border border-border bg-card p-6"
        noValidate
        onSubmit={submitForm}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" disabled={!canManageUsers} {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="text" autoComplete="email" disabled={!canManageUsers} {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{isNew ? "Password" : "New password"}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={!canManageUsers}
            placeholder={isNew ? undefined : "Leave blank to keep the current password"}
            {...form.register("password")}
          />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <NativeSelect id="role" disabled={!canManageUsers} {...form.register("role")}>
            <option value="STAFF">Staff</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </NativeSelect>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={!canManageUsers || isSelf} {...form.register("is_active")} />
          Active
        </label>
        {isSelf ? (
          <p className="text-xs text-muted-foreground">You cannot deactivate your own account.</p>
        ) : null}
        {canManageUsers ? (
          <FormSaveActions
            isNew={isNew}
            primaryLabel="Save user"
            isPending={save.isPending}
            pendingIntent={pendingIntent}
            onPrimaryClick={() => beginSubmit("save")}
            onSaveAndNewClick={() => {
              beginSubmit("saveAndNew");
              void form.handleSubmit(onSubmit, () => clearPendingIntent())();
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            You can view admin users, but only ADMIN and SUPER_ADMIN can change them.
          </p>
        )}
      </form>
    </div>
  );
}
