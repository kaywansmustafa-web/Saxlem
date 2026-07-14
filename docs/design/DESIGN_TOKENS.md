# Saxlem Semantic Design Tokens

Status: definition for Sprint 7B. Sprint 7A does not implement or visually apply these tokens.

## Principles

Tokens describe product meaning, not individual screens or literal colors. Components consume semantic roles so light, dark, high-contrast, and future clinic-branded themes can evolve without feature rewrites. Every foreground/background pair must be contrast-tested before implementation.

## Color

### Surfaces

- `surface.canvas`: app background
- `surface.primary`: standard content surface
- `surface.raised`: elevated cards, menus, and sheets
- `surface.sunken`: grouped or recessed content
- `surface.inverse`: high-contrast inverse surface
- `surface.disabled`: unavailable controls
- `surface.scrim`: modal overlay

### Content

- `content.primary`: primary text and icons
- `content.secondary`: supporting information
- `content.tertiary`: low-emphasis metadata
- `content.disabled`: unavailable content
- `content.inverse`: content on inverse surfaces
- `content.onAccent`: content on brand surfaces

### Borders and focus

- `border.subtle`: quiet separation
- `border.standard`: normal component outline
- `border.strong`: emphasized boundary
- `border.interactive`: selected or active outline
- `focus.ring`: keyboard and accessibility focus

### Brand and interaction

- `brand.primary`, `brand.secondary`
- `interactive.primary`, `interactive.primaryHover`, `interactive.primaryPressed`
- `interactive.secondary`, `interactive.secondaryHover`, `interactive.secondaryPressed`
- `interactive.disabled`

### Status pairs

Each status defines `surface`, `content`, and `border` roles:

- `status.informative.*`
- `status.positive.*`
- `status.caution.*`
- `status.critical.*`
- `status.neutral.*`
- `status.live.*`

Status must never be communicated by color alone.

## Typography

- `type.displayMetric`: queue position and primary clinical metrics
- `type.screenTitle`: page title
- `type.sectionTitle`: major section heading
- `type.cardTitle`: card identity or subject
- `type.bodyPrimary`: normal reading text
- `type.bodySecondary`: supporting text
- `type.label`: field and metadata labels
- `type.caption`: compact supplementary information
- `type.button`: action labels
- `type.status`: badges and state indicators
- `type.numeric`: dates, times, prices, IDs, and measurements

Every role defines family, size, line height, weight, letter spacing, and scaling behavior. Arabic and Kurdish may receive script-specific line-height adjustments while preserving hierarchy.

## Spacing

Base unit: 4 logical pixels.

- `space.1` = 4
- `space.2` = 8
- `space.3` = 12
- `space.4` = 16
- `space.5` = 20
- `space.6` = 24
- `space.8` = 32
- `space.10` = 40
- `space.12` = 48

Responsive screen gutters will map to this scale rather than introducing new values.

## Shape

- `radius.small` = 8
- `radius.medium` = 12
- `radius.large` = 16
- `radius.card` = 24
- `radius.full` = pill/circle

## Elevation

- `elevation.none`: flat grouping
- `elevation.low`: interactive or raised card
- `elevation.medium`: floating navigation and menus
- `elevation.high`: modal surfaces

Each elevation level defines shadow color, opacity, blur, spread, and offset. Borders may replace shadows where contrast or dark surfaces make them clearer.

## Motion

- `motion.instant` = 100 ms
- `motion.fast` = 160 ms
- `motion.standard` = 220 ms
- `motion.slow` = 280 ms
- `curve.standard` = emphasized ease-out
- `curve.enter`, `curve.exit`, `curve.press`

All motion must respect the platform reduced-motion preference. Live healthcare status changes prioritize calm comprehension over decorative movement.

## Sizing and accessibility

- `target.minimum` = 48×48 logical pixels
- `content.readableMaxWidth`: maximum reading width for large screens
- `content.formMaxWidth`: maximum form width
- `icon.small`, `icon.standard`, `icon.large`, `icon.hero`

Tokens must support 200% text scaling, RTL mirroring, keyboard focus, and WCAG AA contrast.

## Component token groups

Sprint 7B should define component aliases for buttons, icon buttons, inputs, cards, badges, tabs, navigation, bottom sheets, dialogs, skeletons, empty states, doctor identity, appointment summaries, and queue metrics. Component tokens may reference semantic foundations but must not introduce raw color or spacing values.

## Governance

- Raw visual values are allowed only inside the token implementation layer.
- New tokens require a reusable semantic purpose.
- Feature names must not appear in foundation token names.
- Token changes require light, dark, RTL, 200% scale, and contrast review.
- Deprecated tokens remain aliased for one migration cycle before removal.
