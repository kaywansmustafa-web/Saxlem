# Doctor Discovery Architecture

## Data flow

```text
Mock/remote data source → DTO mapper → repository → use cases → ChangeNotifier controller → immutable state → UI
```

Widgets never access mock data. `DoctorDiscoveryResult` is a patient-safe search projection referencing canonical doctor and clinic IDs. It deliberately excludes contact information.

## Domain decisions

- Money is integer IQD.
- Location is `cityId/cityDisplayName/areaId/areaDisplayName`, allowing cities beyond Duhok without redesign.
- `DoctorAvailabilitySummary` encapsulates status, earliest time, and expected wait.
- Ratings retain `totalRatings` and `totalReviews` separately.
- My Doctors membership replaces isolated card likes.
- Specialties, gender, language, availability, and sorting are typed enums.
- Friendly-term mapping is deterministic, normalized, and non-diagnostic.

## Scale and replacement

Search results are paginated and stably sorted. Request sequencing prevents stale searches replacing newer ones. The mock repository can later be replaced by REST search, cached pages, and a My Doctors endpoint without changing presentation contracts.

`DoctorDetailsPage` is the permanent profile foundation for future qualifications, services, schedules, reviews, booking, and clinic information.
