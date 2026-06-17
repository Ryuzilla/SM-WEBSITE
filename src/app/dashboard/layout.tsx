import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getSalesRecords } from "@/lib/data";
import { useSampleData } from "@/lib/env";
import { DashboardProvider } from "@/components/providers/dashboard-provider";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const records = await getSalesRecords(profile);

  return (
    <DashboardProvider profile={profile} records={records}>
      <AppShell profile={profile} demoMode={useSampleData}>
        {children}
      </AppShell>
    </DashboardProvider>
  );
}
