"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/lib/types";
import { updateUserRole } from "./actions";

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState<UserRole>(role);
  const [pending, startTransition] = React.useTransition();

  function onChange(next: string) {
    const role = next as UserRole;
    setValue(role);
    startTransition(async () => {
      const res = await updateUserRole(userId, role);
      if (res.error) {
        toast.error(res.error);
        setValue(value);
      } else if (res.demo) {
        toast.message("Demo mode — role change not persisted");
      } else {
        toast.success("Role updated");
      }
    });
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || pending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrator</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="salesperson">Salesperson</SelectItem>
      </SelectContent>
    </Select>
  );
}
