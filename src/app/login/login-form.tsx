"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { signIn, signUp, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function LoginForm({
  redirectTo,
  demoMode,
}: {
  redirectTo: string;
  demoMode: boolean;
}) {
  const [signInState, signInAction] = React.useActionState<AuthState, FormData>(
    signIn,
    {},
  );
  const [signUpState, signUpAction] = React.useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  React.useEffect(() => {
    if (signInState.error) toast.error(signInState.error);
  }, [signInState]);

  React.useEffect(() => {
    if (signUpState.error) toast.error(signUpState.error);
    else if (signUpState.error === undefined && signUpState !== null) {
      // no-op; success handled below via hint
    }
  }, [signUpState]);

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form action={signInAction} className="space-y-4 pt-2">
          <input type="hidden" name="redirect" value={redirectTo} />
          <Field
            icon={<Mail className="h-4 w-4" />}
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            defaultValue={demoMode ? "demo@sm-analytics.app" : ""}
            required
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            defaultValue={demoMode ? "demo" : ""}
            required={!demoMode}
          />
          <SubmitButton label={demoMode ? "Enter Demo" : "Sign In"} />
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form action={signUpAction} className="space-y-4 pt-2">
          <Field
            icon={<User className="h-4 w-4" />}
            id="fullName"
            name="fullName"
            label="Full name"
            placeholder="Jane Executive"
            required
          />
          <Field
            icon={<Mail className="h-4 w-4" />}
            id="su-email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            required
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            id="su-password"
            name="password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            required
          />
          <SubmitButton label="Create account" />
          <p className="text-center text-xs text-muted-foreground">
            New accounts are provisioned with the{" "}
            <span className="font-medium">Salesperson</span> role by default.
          </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function Field({
  icon,
  label,
  id,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  id: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input id={id} className="pl-9" {...props} />
      </div>
    </div>
  );
}
