export interface PrimaryNavigationLink {
  readonly name: string;
  readonly to: string;
}

export const PRIMARY_NAV_LINKS = [
  { name: "Home", to: "/" },
  { name: "Features", to: "/features" },
  { name: "Why Ripple", to: "/how-it-works" },
  { name: "FAQ", to: "/#faq" },
] as const satisfies readonly PrimaryNavigationLink[];

export function isPrimaryNavigationLinkActive(
  to: string,
  pathname: string,
  hash: string,
): boolean {
  if (to === "/#faq") return pathname === "/" && hash === "#faq";
  if (to === "/") return pathname === "/" && hash !== "#faq";
  return pathname === to;
}
