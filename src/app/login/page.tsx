import { BarChart3, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const demoMode = !isSupabaseConfigured;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / value panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-violet-600/20" />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">SM Sales Analytics</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Executive insight into every sale, customer and target.
          </h1>
          <p className="max-w-md text-slate-300">
            Real-time KPIs, revenue forecasting, salesperson performance and
            one-click executive reporting — in a single premium dashboard.
          </p>
          <div className="grid gap-3 pt-2 text-sm">
            <Feature icon={<TrendingUp className="h-4 w-4" />} text="Revenue trends & forecasting" />
            <Feature icon={<Zap className="h-4 w-4" />} text="Instant Excel import & live updates" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Role-based access control" />
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} SM Sales Analytics. All rights reserved.
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to access your executive dashboard
            </p>
            {demoMode && (
              <Badge variant="warning" className="mx-auto w-fit">
                Demo mode — Supabase not configured
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirect ?? "/dashboard"} demoMode={demoMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-200">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
        {icon}
      </span>
      {text}
    </div>
  );
}
