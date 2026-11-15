# Saxlem Brand Guide

The full brand book (colours, type, components, logo rules) lives in the Saxlem Design System artifact. This file is the in-repo summary; `docs/design/DESIGN_TOKENS.md` is the source of truth for code tokens.

## Name

- English: **Saxlem**. The wordmark is lowercase **saxlem**.
- Kurdish: **ساخلەم**

## Promise

Find a doctor, book a visit, know when it's your turn.

## Logo

The mark is a winding queue that forms an "S". It is one continuous line, like the rope lines at a clinic desk, and it ends in a saffron dot: you, at the front of the queue.

All files are in `branding/logo/`. SVGs are outlined, so no fonts are needed to display them.

| File | Use |
| --- | --- |
| `saxlem-logo-horizontal.svg` / `.png` | Default: website, documents, portals |
| `saxlem-logo-horizontal-ku.svg` | Kurdish-first, right to left (ساخلەم + mark) |
| `saxlem-logo-horizontal-reversed.svg` | On `navy` or `brand` backgrounds |
| `saxlem-logo-bilingual.svg` / `.png` | Signage, posters, splash screens |
| `saxlem-app-icon.svg` / `.png` | App stores, home screens, favicons |
| `saxlem-mark.svg` / `-reversed` / `-mono` | Small spaces, single-colour print, stamps |

Rules:

- The line is brand blue `#0056D2` (white on dark). The dot is always saffron `#F5B841`.
- Clear space equals the dot's diameter. Minimum sizes: 16px for the app icon, 96px wide for the horizontal logo.
- Never stretch, rotate, recolour the dot, add effects, or place the logo on busy photos.
- Wordmarks: Inter Display Bold (SIL Open Font License) for **saxlem**; Rudaw for **ساخلەم**.

The old cross, heartbeat and pin logo is retired.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| brand | `#0056D2` | Primary actions, links, the logo line |
| brand-strong | `#003F9F` | Pressed and hover states |
| teal | `#087F8C` | Secondary accent |
| saffron | `#F5B841` | "Your turn" moments and the logo dot only |
| navy | `#0F2747` | Sidebars, dark surfaces |
| ink | `#142033` | Body text |
| muted | `#536174` | Secondary text |
| canvas | `#F4F7FA` | Page background |
| positive / caution / critical | `#087A55` / `#9A5A00` / `#B42318` | Status text, each with a light surface |

## Type

- English: Noto Sans
- Arabic: Cairo
- Badini Kurdish (Arabic script): Rudaw. Regular only, so build hierarchy with size, not weight.
