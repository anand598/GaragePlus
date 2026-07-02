"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CarFront, ClipboardList, Gauge, Package, Receipt, Settings, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Gauge }]
  },
  {
    title: "Masters",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/vehicles", label: "Vehicles", icon: CarFront },
      { href: "/services", label: "Services", icon: Wrench },
      { href: "/parts", label: "Spare Parts", icon: Package }
    ]
  },
  {
    title: "Operations",
    items: [
      { href: "/invoices/new", label: "New Invoice", icon: Receipt },
      { href: "/vehicle-status", label: "Vehicle Status", icon: ClipboardList },
      { href: "/payments", label: "Payments", icon: Bell },
      { href: "/reports", label: "Reports", icon: Gauge }
    ]
  },
  {
    title: "Settings",
    items: [
      { href: "/settings", label: "Workshop Setup", icon: Settings },
      { href: "/users", label: "Users & Roles", icon: Users }
    ]
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">{group.title}</p>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active ? "bg-white text-blue-600 shadow-lg" : "text-slate-200 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
