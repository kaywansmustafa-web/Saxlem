# Saxlem Voice and Copy

## Voice

Saxlem sounds calm, clear, warm, capable, and respectful. We explain what the patient needs to understand and what they can do next. We never expose internal system language when patient language is possible.

## Principles

### Lead with meaning

Prefer “Your doctor is running about 10 minutes late” over “Queue status: delayed.”

### Give the next useful step

Every interruption, empty state, or error should answer: What happened? Is my care affected? What should I do?

### Reduce anxiety

Use factual, measured wording. Do not dramatize delays, failures, or uncertainty. Do not imply certainty the system does not have.

### Be concise, not abrupt

Use short sentences and familiar words. Avoid technical terms, administrative jargon, and unexplained abbreviations.

### Respect patient agency

Use invitations and clear choices. Avoid blame, commands without context, or language that sounds punitive.

## Queue language

Queue states must communicate patient meaning:

- Ready: “Everything is on track.”
- Attention: “Your doctor is running about 10 minutes late. We’ll keep you updated.”
- Action needed: “Please head to reception.”
- Connection issue: “Showing your latest saved update.”
- Uncertain estimate: “This estimate may change.”

Engineering state names such as stale, reconnecting, invalid, version conflict, or polling must never appear in patient copy.

## Actions

- Use verbs: “View doctor,” “Open live queue,” “Choose a time.”
- Buttons describe the outcome, not the interface.
- Primary action: the safest expected next step.
- Secondary action: a valid alternative.
- Tertiary action: low-emphasis navigation or dismissal.
- Never show an enabled action that does nothing.

## Status and error formula

1. Human heading
2. Short explanation
3. Effect on the patient, if any
4. One clear recovery action

Example: “We couldn’t refresh your queue. Your saved position is still shown. Try again when you’re connected.”

## Numbers and time

- Use ranges where precision is uncertain.
- Use relative time for live information.
- Use localized dates, time, digits, and IQD formatting.
- Never imply an estimate is a guarantee.

## Translation

- Write source English for meaning, not wordplay.
- Avoid idioms and culturally specific metaphors.
- Arabic and Badini require native clinical review.
- Do not concatenate translated fragments when a complete localized sentence is possible.
- Semantic labels must be localized with visible copy.

## Capitalization and punctuation

- English uses sentence case.
- Avoid all caps except a short, localized live indicator when tested.
- Use one exclamation mark only for rare positive confirmation; healthcare warnings do not use exclamation marks.
- Avoid ellipses in status copy.
