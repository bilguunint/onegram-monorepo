"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/menu";

type Props = {
  item: MenuItem;
  onNavigate?: () => void;
};

function isActivePath(pathname: string | null, href: string, exact = false): boolean {
  if (!pathname) return false;
  if (href === "/" || exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarMenuItem({ item, onNavigate }: Props) {
  const pathname = usePathname();
  const Icon = item.icon;
  const children = item.children ?? [];
  const hasChildren = children.length > 0;

  // Бүлгийн аль нэг дэд зүйл идэвхтэй бол бүлэг өөрөө идэвхтэй.
  const childActive = hasChildren
    ? children.some((c) => isActivePath(pathname, c.href, c.href === item.href))
    : false;
  const active = hasChildren ? childActive : isActivePath(pathname, item.href);

  // Хэрэглэгч гараар нээж/хаасан эсэх. null бол идэвхтэй дэд зүйлээ дагана.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [prevChildActive, setPrevChildActive] = useState(childActive);
  if (prevChildActive !== childActive) {
    // Зам солигдоход гар тохиргоог мартаж, идэвхтэй бүлгийг дахин задална.
    setPrevChildActive(childActive);
    setManualOpen(null);
  }
  const open = manualOpen ?? childActive;

  const rowClass = cn(
    "group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
    active
      ? "bg-sidebar-active font-medium text-primary-700 dark:text-primary-300"
      : "text-sidebar-foreground/85 hover:bg-sidebar-hover"
  );
  const iconClass = cn(
    "h-4 w-4 shrink-0",
    active
      ? "text-primary-600 dark:text-primary-400"
      : "text-muted-foreground group-hover:text-foreground"
  );

  if (!hasChildren) {
    return (
      <Link href={item.href} onClick={onNavigate} className={rowClass}>
        <Icon className={iconClass} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className={rowClass}
      >
        <Icon className={iconClass} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-[2px] space-y-[2px] border-l border-border-light pl-3 ml-5">
          {children.map((child) => {
            // Эх зүйлтэй ижил зам бол зөвхөн яг тэр хуудас дээр идэвхтэй,
            // өөрөөр /report/gold-reserve дээр хоёулаа идэвхтэй болно.
            const childIsActive = isActivePath(
              pathname,
              child.href,
              child.href === item.href
            );
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors",
                  childIsActive
                    ? "bg-sidebar-active font-medium text-primary-700 dark:text-primary-300"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-hover"
                )}
              >
                <ChildIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    childIsActive
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
