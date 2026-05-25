"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/menu";

type Props = {
  item: MenuItem;
  onNavigate?: () => void;
};

export function SidebarMenuItem({ item, onNavigate }: Props) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname?.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-sidebar-active font-medium text-primary-700 dark:text-primary-300"
          : "text-sidebar-foreground/85 hover:bg-sidebar-hover"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active
            ? "text-primary-600 dark:text-primary-400"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
