import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Gift,
  Home,
  Package,
  Receipt,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const MENU: MenuItem[] = [
  { label: "Эхлэл", href: "/", icon: Home },
  { label: "Хэрэглэгчид", href: "/users", icon: Users },
  { label: "Захиалгууд", href: "/orders", icon: FileText },
  { label: "Бэлгийн хүсэлтүүд", href: "/gift_orders", icon: Gift },
  { label: "Хөрөнгө оруулалт", href: "/investments", icon: Wallet },
  { label: "Биетээр авах хүсэлтүүд", href: "/withdraws", icon: Receipt },
  { label: "Биетээр авах статистик", href: "/withdraws_statistics", icon: BarChart3 },
  { label: "Бараа", href: "/products", icon: Package },
  { label: "Бараа худалдан авалт", href: "/product-purchases", icon: ShoppingBag },
  { label: "Мэдэгдэл", href: "/custom-notifications", icon: Bell },
  { label: "Сугалаат аян", href: "/campaigns", icon: ClipboardList },
];
