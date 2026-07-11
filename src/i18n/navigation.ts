import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Navigation locale-aware : sur /ar, <Link href="/pricing"> → /ar/pricing.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
