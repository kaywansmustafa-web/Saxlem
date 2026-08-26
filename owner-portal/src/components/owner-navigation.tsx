"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function OwnerNavigation({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {items.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={
            pathname === href || pathname.startsWith(`${href}/`)
              ? "page"
              : undefined
          }
        >
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
