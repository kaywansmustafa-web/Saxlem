# Notifications Architecture

The feature follows:

`NotificationsRepository -> use cases -> NotificationsController -> immutable state -> presentation`

`HomePage` owns one controller and one in-memory repository for the lifetime of
the patient shell. Dashboard, the fourth navigation destination, its unread
badge, and the Notifications feature interact through that controller and
repository. Widgets never access the mock data source.

DTOs contain structured event data. The mapper creates Flutter-independent
domain entities. Localized templates are applied only in presentation and always
provide what happened, why, and the next step. Actions are typed destinations,
not callbacks stored in domain objects.

Only queue records with the same opaque group key are grouped. Sorting is stable
by internal priority, event time, and notification ID. Priority names are never
shown to patients. New snapshots update the changed list content without an
arrival animation while the page is visible; only the navigation badge uses a
short design-token animation.

The repository contract is replaceable by a backend implementation. Future push
delivery is a separate transport concern and must not change notification domain
or presentation contracts.
