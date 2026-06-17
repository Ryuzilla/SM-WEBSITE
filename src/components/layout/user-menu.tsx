"use client";

import { LogOut, UserCircle } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS: Record<UserProfile["role"], string> = {
  admin: "Administrator",
  manager: "Manager",
  salesperson: "Salesperson",
};

function initials(name: string | null, email: string) {
  const base = name || email;
  return base
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ profile }: { profile: UserProfile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarFallback>{initials(profile.full_name, profile.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{profile.full_name ?? "User"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {profile.email}
            </span>
            <Badge variant="secondary" className="mt-1 w-fit">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserCircle className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
