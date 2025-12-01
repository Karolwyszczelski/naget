// app/components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaShoppingBag, FaBoxOpen, FaCog } from "react-icons/fa";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: FaCog,
  },
  {
    href: "/admin/orders",
    label: "Zamówienia",
    icon: FaShoppingBag,
  },
  {
    href: "/admin/products",
    label: "Produkty",
    icon: FaBoxOpen,
  },
  {
    href: "/admin/settings",
    label: "Ustawienia",
    icon: FaCog,
  },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border bg-white/80 backdrop-blur-sm">
      <div className="px-5 py-4 border-b border-border/70">
        <p className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          Panel administracyjny
        </p>
        <p className="mt-1 text-[18px] font-extrabold text-accent uppercase">
          Naget
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 text-[13px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-2xl border text-sm transition-colors",
                isActive
                  ? "bg-accent text-white border-accent shadow-soft"
                  : "bg-white/60 text-primary border-border hover:border-accent hover:text-accent",
              ].join(" ")}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                <Icon className={isActive ? "text-white" : "text-accent"} />
              </span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 text-[11px] text-neutral-500 border-t border-border/70">
        Zalogowany użytkownik: <span className="font-semibold">admin</span>
        {/* TODO: podpiąć realne dane z auth */}
      </div>
    </aside>
  );
}
