import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavItem } from "./nav-links";
import { NavLinks } from "./nav-links";
import { Sidebar } from "./sidebar";

// Quién ve cada sección (misma idea que en Axis).
const NAV_ITEMS: (NavItem & { roles: string[] })[] = [
  { href: "/", label: "Campañas", icon: "mail", roles: ["admin", "editor"] },
  { href: "/listas", label: "Listas y segmentos", icon: "list", roles: ["admin", "editor"] },
  { href: "/plantillas", label: "Plantillas", icon: "layout", roles: ["admin", "editor"] },
  { href: "/reportes", label: "Reportes", icon: "chart", roles: ["admin", "editor"] },
  { href: "/supresion", label: "Supresión", icon: "ban", roles: ["admin"] },
  { href: "/ajustes", label: "Ajustes", icon: "settings", roles: ["admin"] },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = NAV_ITEMS.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-5 p-3 sm:p-5">
        <Sidebar items={items} userEmail={user.email} userRole={user.role} />
        <div className="min-w-0 flex-1">
          <header className="glass-strong sticky top-3 z-40 mb-5 flex items-center gap-3 px-4 py-3 lg:hidden">
            <Link href="/" className="font-display text-base font-bold">
              Sinergéticos <span className="text-[var(--accent)]">Mailing</span>
            </Link>
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
              <NavLinks items={items} compact />
            </nav>
            <ThemeToggle />
          </header>
          <main className="pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
