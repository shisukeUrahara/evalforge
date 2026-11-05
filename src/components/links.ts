import { Columns2, Scale, ShieldCheck } from "lucide-react";

/** The three tabs. Plain module so server components (not-found) can read it too. */
export const LINKS = [
  { href: "/", label: "Release gate", short: "Gate", icon: ShieldCheck },
  { href: "/compare", label: "Comparison", short: "Compare", icon: Columns2 },
  { href: "/judge", label: "Judge audit", short: "Judge", icon: Scale },
];

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));
