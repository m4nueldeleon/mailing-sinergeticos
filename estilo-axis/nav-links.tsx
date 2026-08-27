"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconCart,
  IconChat,
  IconSend,
  IconFunnel,
  IconHome,
  IconKanban,
  IconPhone,
  IconSync,
  IconTicket,
  IconUsers,
} from "@/components/icons";

const ICONS = {
  home: IconHome,
  users: IconUsers,
  kanban: IconKanban,
  ticket: IconTicket,
  cart: IconCart,
  funnel: IconFunnel,
  send: IconSend,
  sync: IconSync,
  chat: IconChat,
  phone: IconPhone,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

export function NavLinks({
  items,
  compact = false,
  iconOnly = false,
}: {
  items: readonly NavItem[];
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const [itemPath, itemQuery] = item.href.split("?");
        const itemCat = itemQuery ? new URLSearchParams(itemQuery).get("cat") : null;
        let active = item.href === "/" ? pathname === "/" : pathname.startsWith(itemPath);
        if (active && itemCat) {
          // /pipeline se divide por categoría (webinar por defecto)
          active = (sp.get("cat") ?? "webinar") === itemCat;
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active}
            title={iconOnly ? item.label : undefined}
            className={`nav-item ${compact ? "!px-2.5 !py-1.5 text-xs" : ""} ${iconOnly ? "justify-center !px-0" : ""}`}
          >
            <Icon width={compact ? 14 : iconOnly ? 19 : 17} height={compact ? 14 : iconOnly ? 19 : 17} />
            {iconOnly ? null : item.label}
          </Link>
        );
      })}
    </>
  );
}
