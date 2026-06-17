import { ShieldAlert, ShieldCheck, UserCog } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentProfile, canManageData } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { UserProfile } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { RoleSelect } from "./role-select";

// Demo roster used when Supabase isn't configured.
const DEMO_USERS: UserProfile[] = [
  { id: "u1", email: "admin@sm-analytics.app", full_name: "Demo Executive", role: "admin", salesperson_id: null, created_at: "2025-01-10" },
  { id: "u2", email: "manager@sm-analytics.app", full_name: "Wanida K.", role: "manager", salesperson_id: null, created_at: "2025-02-01" },
  { id: "u3", email: "somchai@sm-analytics.app", full_name: "Somchai P.", role: "salesperson", salesperson_id: "sp1", created_at: "2025-02-15" },
  { id: "u4", email: "ploy@sm-analytics.app", full_name: "Ploy S.", role: "salesperson", salesperson_id: "sp2", created_at: "2025-03-02" },
];

const PERMISSIONS = [
  { role: "Admin", desc: "Full access — import data, manage users, view everything." },
  { role: "Manager", desc: "View all sales data and analytics across the organization." },
  { role: "Salesperson", desc: "View only their own sales data and performance." },
];

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canManageData(profile.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <p className="text-lg font-semibold">Admin access required</p>
            <p className="text-sm text-muted-foreground">
              Only administrators can manage users and roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let users: UserProfile[] = DEMO_USERS;
  if (isSupabaseConfigured) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) users = data as UserProfile[];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user accounts and role-based access control."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {PERMISSIONS.map((p) => (
          <Card key={p.role}>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{p.role}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Users
            <Badge variant="secondary">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {(u.full_name ?? u.email)
                            .split(/[\s@.]+/)
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase())
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.full_name ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell>
                    <RoleSelect
                      userId={u.id}
                      role={u.role}
                      disabled={u.id === profile.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
