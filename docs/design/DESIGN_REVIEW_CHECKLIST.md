# Saxlem Design Review Checklist

Every feature must satisfy this checklist before merge.

## Product and copy

- [ ] The primary patient goal is clear within five seconds.
- [ ] The next action is unambiguous.
- [ ] Copy follows `VOICE_AND_COPY.md`.
- [ ] Technical states are translated into patient meaning.
- [ ] Loading, empty, error, offline, maintenance, success, and permission states are considered.
- [ ] No enabled action is unfinished.

## Design system

- [ ] No raw feature color, shadow, radius, duration, or arbitrary spacing was introduced.
- [ ] Buttons use only Primary, Secondary, or Tertiary hierarchy.
- [ ] Domain cards compose from `SaxlemCard`.
- [ ] Text uses the Saxlem typography scale, including numeric roles for important metrics.
- [ ] Status uses semantic surface/content pairs and is not color-only.
- [ ] Content uses responsive maximum-width constraints where appropriate.
- [ ] Existing components were reused before proposing a new component.

## Accessibility

- [ ] All targets are at least 48×48dp.
- [ ] Screen-reader labels are meaningful and localized.
- [ ] Heading, traversal, selected, disabled, and live-region semantics are correct.
- [ ] The feature works at 200% text scale without clipping or lost actions.
- [ ] English LTR, Arabic RTL, and Badini RTL were tested.
- [ ] Color pairs meet WCAG AA.
- [ ] Keyboard focus and activation work for interactive elements.
- [ ] Reduced-motion behavior is respected.

## Motion

- [ ] Motion uses Saxlem durations and curves.
- [ ] Motion communicates state or causality.
- [ ] Queue updates animate only the changing metric.
- [ ] Screen readers are not spammed by frequent updates.
- [ ] Content is usable before decorative success motion completes.

## Engineering

- [ ] Business logic remains outside widgets.
- [ ] Components have one clear responsibility.
- [ ] Lists are lazy where data can grow.
- [ ] Images have loading, error, sizing, and semantic behavior.
- [ ] Component, RTL, large-text, semantics, and regression tests pass.
- [ ] Static analysis passes with no warnings.
- [ ] Documentation is updated when a public design-system contract changes.

## Approval

- [ ] Product/design review complete
- [ ] Flutter architecture review complete
- [ ] Accessibility review complete
- [ ] Arabic/Badini language review complete when copy changed
