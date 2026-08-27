"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMail, IconList, IconLayout, IconChartBars, IconBan, IconSettings } from "@/components/icons";

const ICONS = {
  mail: IconMail,
  list: IconList,
  layout: IconLayout,
  chart: IconChartBars,
  ban: IconBan,
  settings: IconSettings,
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
  return (
    <>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const size = compact ? 14 : iconOnly ? 19 : 17;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active}
            title={iconOnly ? item.label : undefined}
            className={`nav-item ${compact ? "!px-2.5 !py-1.5 text-xs" : ""} ${iconOnly ? "justify-center !px-0" : ""}`}
          >
            <Icon width={size} height={size} />
            {iconOnly ? null : item.label}
          </Link>
        );
      })}
    </>
  );
}
