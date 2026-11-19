"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "./nav-icon";

type Item = readonly [string, string] | readonly [string, string, string];
export type NavigationGroup = {
  readonly title: string;
  readonly items: readonly Item[];
};

export function OwnerNavigation({
  items,
  groups,
}: {
  items?: readonly Item[];
  groups?: readonly NavigationGroup[];
}) {
  const pathname = usePathname();
  const sections: readonly NavigationGroup[] = groups ?? [
    { title: "", items: items ?? [] },
  ];
  return (
    <nav className="nav" aria-label="Main">
      {sections.map((group) => (
        <div className="nav-group" key={group.title || "main"}>
          {group.title && <p className="nav-group-title">{group.title}</p>}
          {group.items.map(([label, href, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
            >
              {icon && <NavIcon name={icon} />}
              <span>{label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
