"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconLogout } from "@/components/icons";
import { salir } from "@/app/login/actions";
import { NavLinks, type NavItem } from "./nav-links";

/** Sidebar colapsable (estado recordado por navegador). */
export function Sidebar({
  items,
  userEmail,
  userRole,
}: {
  items: readonly NavItem[];
  userEmail: string;
  userRole: string;
}) {
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    setColapsada(localStorage.getItem("mailing-sidebar") === "colapsada");
  }, []);
  function toggle() {
    setColapsada((v) => {
      localStorage.setItem("mailing-sidebar", v ? "abierta" : "colapsada");
      return !v;
    });
  }

  return (
    <aside
      className={`glass-strong sticky top-3 z-40 -mt-2 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col p-4 transition-all duration-300 lg:flex ${
        colapsada ? "w-[76px] !px-2.5" : "w-60"
      }`}
    >
      <button
        onClick={toggle}
        title={colapsada ? "Expandir menú" : "Colapsar menú"}
        className="glass-strong !absolute -right-3 top-8 z-10 flex h-6 w-6 cursor-pointer items-center justify-center !rounded-full text-[var(--text-3)] transition hover:text-[var(--accent)]"
        style={{ background: "var(--surface-solid)" }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`transition-transform duration-300 ${colapsada ? "rotate-180" : ""}`}
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      <Link
        href="/"
        className={`flex items-center gap-2.5 py-2 ${colapsada ? "justify-center px-0" : "px-2"}`}
      >
        <img
          src="/brand/mark.svg"
          alt="Sinergéticos Mailing"
          width={38}
          height={38}
          className="h-[38px] w-[38px] shrink-0 drop-shadow-[0_4px_10px_var(--accent-glow)]"
        />
        {!colapsada ? (
          <span className="font-display text-lg font-bold tracking-tight">
            Sinergéticos <span className="text-[var(--accent)]">Mailing</span>
          </span>
        ) : null}
      </Link>

      <div className="mt-6 flex flex-1 flex-col gap-1">
        <NavLinks items={items} iconOnly={colapsada} />
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--veil)] ${
          colapsada ? "flex-col p-2" : "p-3"
        }`}
      >
        <span
          title={userEmail}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-magenta)] text-sm font-bold text-white"
        >
          {userEmail.slice(0, 1).toUpperCase()}
        </span>
        {!colapsada ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{userEmail.split("@")[0]}</div>
            <div className="text-xs capitalize text-[var(--text-3)]">{userRole}</div>
          </div>
        ) : null}
        <ThemeToggle />
        <form action={salir}>
          <button
            type="submit"
            title="Salir"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-3)] transition hover:text-[var(--danger)]"
          >
            <IconLogout width={15} height={15} />
          </button>
        </form>
      </div>
    </aside>
  );
}
