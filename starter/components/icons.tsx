import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconHome = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.2 15.4c1.7.8 2.9 2.3 3.3 4.6" />
  </svg>
);

export const IconKanban = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="5.5" height="16" rx="1.5" />
    <rect x="9.5" y="4" width="5.5" height="11" rx="1.5" />
    <rect x="16" y="4" width="5.5" height="7" rx="1.5" />
  </svg>
);

export const IconCart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 4h2.2l2.4 12.2A1.6 1.6 0 0 0 9.2 17.5h8.9a1.6 1.6 0 0 0 1.6-1.3L21.5 8H6" />
    <circle cx="10" cy="21" r="1.2" />
    <circle cx="17.5" cy="21" r="1.2" />
  </svg>
);

export const IconFunnel = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 4.5h18l-7 8v6l-4 2.5v-8.5l-7-8Z" />
  </svg>
);

export const IconSync = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 5v5h-5" />
    <path d="M4 19v-5h5" />
    <path d="M19.4 10a7.6 7.6 0 0 0-13-3.5L4 9M4.6 14a7.6 7.6 0 0 0 13 3.5L20 15" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2Z" />
  </svg>
);

/** Constelación: fuentes de datos conectadas — la marca de Synergy Axis. */
export const IconConstellation = (p: P) => (
  <svg {...base} strokeWidth={1.6} {...p}>
    <path d="M12 12.2 6.2 7.4M12 12.2l6.6-2.9M12 12.2l-4.3 7M12 12.2l5.2 6.4" />
    <circle cx="12" cy="12.2" r="1.9" fill="currentColor" stroke="none" />
    <circle cx="6.2" cy="7.4" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="18.6" cy="9.3" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="7.7" cy="19.2" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="17.2" cy="18.6" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="10.4" cy="3.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTrendUp = (p: P) => (
  <svg {...base} {...p}>
    <path d="m3 16 6-6 4 4 8-8" />
    <path d="M15 6h6v6" />
  </svg>
);

export const IconTicket = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a3 3 0 0 0 0 6v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a3 3 0 0 0 0-6Z" />
    <path d="M13 6v2M13 11v2M13 16v2" />
  </svg>
);

/* ── Set a medida Synergy Axis (sin emojis): trazo 1.8, currentColor ── */

export const IconBee = (p: P) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="13.5" rx="4.5" ry="6" />
    <path d="M9 11h6M8.6 14h6.8M9.6 17h4.8" />
    <path d="M8 9.5C5.5 7.5 5 5.5 6.5 4.5S10 5 11 7.5M16 9.5c2.5-2 3-4 1.5-5S14 5 13 7.5" />
    <path d="M10.5 4.5 12 7l1.5-2.5" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.8 21 3 13.2 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z" />
  </svg>
);

export const IconPhoneOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.4 6.6c-.2-.9-.4-1.7-.4-2.6 0-.6-.4-1-1-1H5.5c-.6 0-1 .4-1 1 0 2.6.6 5 1.7 7.2M9.2 13.5a15.6 15.6 0 0 0 4 3.9l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-3.5 0-6.7-1.2-9.4-3.1" />
    <path d="m4 20 16-16" />
  </svg>
);

export const IconTable = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
);

export const IconLiveDot = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    <path d="M6.2 6.2a8.2 8.2 0 0 0 0 11.6M17.8 6.2a8.2 8.2 0 0 1 0 11.6" />
  </svg>
);

export const IconFlame = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3s1 2.4 3 4.8c1.7 2 3 3.7 3 6.2a6 6 0 0 1-12 0c0-1.8.6-3.2 1.6-4.6.4 1 .9 1.7 1.7 2.3C9.5 8.9 10.6 6 12 3Z" />
    <path d="M12 20a3 3 0 0 1-3-3c0-1.4.9-2.4 1.7-3.4.6.7 1 1 1.6 1.5.8.7 1.7 1.3 1.7 2.4a3 3 0 0 1-2 2.5Z" />
  </svg>
);

export const IconChartBars = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 20V13M10.5 20V4M16 20v-9M21 20H3" />
  </svg>
);

export const IconDiamond = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 3h10l4 5.5L12 21 3 8.5 7 3Z" />
    <path d="M3 8.5h18M9.5 3 8 8.5 12 21M14.5 3 16 8.5 12 21" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 3 2.5 5.6 6 .6-4.5 4 1.3 5.9L12 16l-5.3 3.1L8 13.2l-4.5-4 6-.6L12 3Z" />
  </svg>
);

export const IconNotePencil = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5" />
    <path d="M18.4 3.6a2 2 0 0 1 2.8 2.8L13 14.6l-3.8 1 1-3.8 8.2-8.2Z" />
  </svg>
);

export const IconUserRound = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M5 20a7.2 7.2 0 0 1 14 0" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.3 4.2 2.9 17.4A2 2 0 0 0 4.6 20.4h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4.2M12 16.9v.2" />
  </svg>
);

export const IconChat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.2M12 12h.2M15.5 12h.2" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.8h17M8 3v3.5M16 3v3.5" />
  </svg>
);

export const IconClockHistory = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconSparkles = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4.5 13.8 9l4.5 1.8-4.5 1.8L12 17l-1.8-4.4L5.7 10.8 10.2 9 12 4.5Z" />
    <path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2ZM5 3.5l.6 1.6 1.6.6-1.6.6L5 7.9l-.6-1.6-1.6-.6 1.6-.6L5 3.5Z" />
  </svg>
);

export const IconHourglass = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 3h11M6.5 21h11M8 3v3.5a4 4 0 0 0 8 0V3M8 21v-3.5a4 4 0 0 1 8 0V21" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base} {...p}>
    <path d="M16.8 3.7a2.2 2.2 0 0 1 3.1 3.1L7.5 19.2 3 20.6l1.4-4.5L16.8 3.7Z" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.7" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAntenna = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="11" r="2" />
    <path d="M12 13v8M7.8 6.8a6 6 0 0 0 0 8.4M16.2 6.8a6 6 0 0 1 0 8.4M5 4a10 10 0 0 0 0 14M19 4a10 10 0 0 1 0 14" />
  </svg>
);

export const IconSiren = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 18v-5a5 5 0 0 1 10 0v5" />
    <path d="M4.5 18h15M12 3.5V5M5 6l1.2 1.2M19 6l-1.2 1.2" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 9.5a6 6 0 1 0-12 0c0 4.5-2 5.5-2 7h16c0-1.5-2-2.5-2-7Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

export const IconBellOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8.2 5.2A6 6 0 0 1 18 9.5c0 3 .8 4.5 1.5 5.5M6.1 9.9c-.2 4-2.1 5.1-2.1 6.6h12" />
    <path d="M10 19.5a2 2 0 0 0 4 0M4 4l16 16" />
  </svg>
);

export const IconSend = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 3 3.8 9.7c-.8.3-.8 1.5.1 1.8l6.6 2 2 6.6c.3.9 1.5.9 1.8.1L21 3Z" />
    <path d="M10.5 13.5 21 3" />
  </svg>
);

export const IconSkipForward = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 5.5v13l9-6.5-9-6.5ZM18.5 5v14" />
  </svg>
);

export const IconCheckCircle = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.3 2.6 2.6 4.9-5.4" />
  </svg>
);

export const IconXCircle = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
  </svg>
);

export const IconArchive = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="4" width="17" height="5" rx="1.5" />
    <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" />
  </svg>
);

export const IconMoney = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6.2 9.5h.1M17.7 14.5h.1" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

/* ── Íconos añadidos para Mailing (mismo estilo: stroke currentColor, 2px, redondeado) ── */
export const IconMail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const IconList = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />
  </svg>
);
export const IconBan = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);
export const IconLayout = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);
