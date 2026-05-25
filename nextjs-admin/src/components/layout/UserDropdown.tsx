"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL_MN } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserDropdown() {
  const { adminData, signOut } = useAuth();
  const router = useRouter();

  if (!adminData) return null;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const initials = initialsOf(adminData.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-sidebar-hover"
          />
        }
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-[12px] font-semibold text-white ring-1 ring-black/5">
          {initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-[13px] font-semibold text-white">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium">
                {adminData.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {adminData.email}
              </span>
            </div>
          </div>
          <span className="mt-1 inline-block w-fit rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
            {ROLE_LABEL_MN[adminData.role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-[13px]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Гарах
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
