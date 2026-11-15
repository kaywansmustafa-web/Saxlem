# Saxlem Brand Guide

The full brand book (colours, type, components, logo rules) lives in the Saxlem Design System artifact. This file is the in-repo summary; `docs/design/DESIGN_TOKENS.md` is the source of truth for code tokens.

## Name

- English: **Saxlem**. The wordmark is lowercase **saxlem**.
- Kurdish: **ساخلەم**

## Promise

Find a doctor, book a visit, know when it's your turn.

## Logo (v2 "Aura", November 2026)

Two rounded shapes meet and make an "S": Saxlem Blue above, aqua below, the patient and the doctor. A small plus sits where they touch, the one quiet health cue. Each shape is also a speech bubble, because Saxlem is how patients and clinics talk.

All files are in `branding/logo/`. SVGs are outlined, so no fonts are needed to display them.

| File | Use |
| --- | --- |
| `saxlem-logo-horizontal.svg` / `.png` | Default on light grounds |
| `saxlem-logo-horizontal-night.svg` / `.png` | On dark grounds |
| `saxlem-logo-horizontal-white.svg` | One-colour white |
| `saxlem-logo-horizontal-ku.svg` / `.png` | Kurdish-first, right to left |
| `saxlem-logo-bilingual.svg` / `.png` | Signage, posters, splash screens |
| `saxlem-app-icon.svg` / `.png` | App stores and home screens (white mark on the Aura gradient) |
| `saxlem-app-icon-night.svg` / `.png` | Alternative icon on night |
| `saxlem-mark.svg` / `-white` / `-mono` | Small spaces, single-colour print |

Rules:

- Wordmark: lowercase **saxlem** in Sora SemiBold; **ساخلەم** in Rudaw.
- Top shape #3B6BFF → #2148F0, bottom shape #14C9C4 → #13B0EA, plus cut out. Wordmark ink #0B1533.
- Clear space equals the height of the plus. Minimum: 16px app icon, 96px wide horizontal logo.
- Never rotate, stretch, recolour one half, add effects, or place on busy photos.

The cross-heartbeat-pin logo and the short-lived v1 queue "S" are retired.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| brand | `#2950F5` | `#7D97FF` | Links, selected states, focus |
| brand-fill | `#2950F5` | `#2950F5` | Filled buttons (white text 5.9:1) |
| aura-start → aura-end | `#3B6BFF` → `#14C9C4` | | The Aura gradient: logo, progress. Never under text |
| brand-fill → teal-fill | `#2950F5` → `#0A7F7A` | | Deep Aura: under white text (called ticket) |
| night / ink | `#0B1533` | `#EEF2FA` (ink) | Deep ground; primary text |
| muted | `#5B6680` | `#A3ADC4` | Secondary text |
| canvas / surface | `#F5F7FB` / `#FFFFFF` | `#070D22` / `#0F1A3A` | Backgrounds and cards |
| positive / caution / critical | `#0B7A52` / `#9A5600` / `#C8261B` | `#4ADE9F` / `#FFC163` / `#FF8F85` | Status text on its tint |

## Type

- Display (numbers, titles, names): Sora
- English text: Inter
- Arabic: Cairo
- Badini Kurdish (Arabic script): Rudaw. Regular only, so build hierarchy with size, not weight.
