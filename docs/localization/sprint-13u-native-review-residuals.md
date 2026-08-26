# Sprint 13U Native Review Certification

> Final evidence for all 320 product-owner-reviewed residual records. Values are preserved exactly as approved; demo exclusions are explicitly classified.

## Certification summary

- Total original review records: 320
- APPROVED_APPLIED: 317
- APPROVED_ALREADY_PRESENT: 0
- DEMO_EXCLUDED: 3
- PARAMETERIZED_REPLACEMENT: 0
- NOT_PRODUCTION_VISIBLE: 0
- NATIVE_REVIEW_REQUIRED: 0

### Demo conclusion

The three fixed doctor/time notices are keys supplied only by `MockDashboardRepository` through development composition. Production composition returns no dashboard service, so they cannot render in the production dashboard. They remain unapproved demo fixtures and are classified `DEMO_EXCLUDED`; no Karwan/Shilan spelling or fixed-time translation was invented.

## Counts by product area

| Product area | Count |
|---|---:|
| Shared/navigation | 26 |
| Profile/family | 20 |
| Appointments | 41 |
| Arrival | 14 |
| Live Queue | 28 |
| Doctor Settings | 27 |
| Doctor Schedule | 23 |
| Doctor Workspace | 58 |
| Doctor Notifications | 53 |
| Billing | 16 |
| Organizations | 2 |
| Clinics/onboarding | 6 |
| Administration | 5 |
| Authentication | 1 |

## Shared/navigation

### 1. Delayed and busiest queues appear first.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueHelp`
- **Reviewed locale:** Arabic
- **English source:** Delayed and busiest queues appear first.
- **Final Arabic:** تظهر قوائم الانتظار المتأخرة والأكثر ازدحامًا أولًا.
- **Final Badini:** سرایێن پاشکەفتی و یێن پتر مژویل ل سەری دیار دبن.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 2. The next expected patients.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `arrivalHelp`
- **Reviewed locale:** Arabic
- **English source:** The next expected patients.
- **Final Arabic:** المرضى المتوقع وصولهم تالياً.
- **Final Badini:** نەخوشێن ل دویفرا یێن هاتنا وان چاڤەرێکری.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 3. Only updates affecting today's work.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `updatesHelp`
- **Reviewed locale:** Arabic
- **English source:** Only updates affecting today's work.
- **Final Arabic:** تظهر هنا فقط التحديثات التي تؤثر على عمل اليوم.
- **Final Badini:** تنێ نویکرنێن کو کارێ ئەڤرو کارتێدکەن ل ڤێرێ دیارن.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 4. There are no appointments, queues, or arrivals for this shift.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `emptyBody`
- **Reviewed locale:** Arabic
- **English source:** There are no appointments, queues, or arrivals for this shift.
- **Final Arabic:** لا توجد مواعيد أو قوائم انتظار أو حالات وصول خلال هذه الفترة.
- **Final Badini:** د ڤی شێفتی دا چ ژڤان، سرا یان هاتن نینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 5. Portal session unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Portal session unavailable
- **Final Arabic:** جلسة البوابة غير متاحة.
- **Final Badini:** دانیشتنا پۆرتالێ بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 6. The receptionist demo session is disabled in this environment.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** The receptionist demo session is disabled in this environment.
- **Final Arabic:** جلسة الاستقبال التجريبية معطّلة في هذه البيئة.
- **Final Badini:** دانیشتنا تاقیکرنا پێشوازی د ڤی ژینگەهی دا نەچالاککرییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 7. Some doctors are delayed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `clinicDelayed`
- **Reviewed locale:** Badini
- **English source:** Some doctors are delayed
- **Final Arabic:** معلومات
- **Final Badini:** هندەک نوژدار پاشکەفتینە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 8. Morning shift · 8:00 AM–4:00 PM

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `shift`
- **Reviewed locale:** Badini
- **English source:** Morning shift · 8:00 AM–4:00 PM
- **Final Arabic:** معلومات
- **Final Badini:** شێفتا سپێدێ · 8:00 AM–4:00 PM
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 9. Today at a glance

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `heading`
- **Reviewed locale:** Badini
- **English source:** Today at a glance
- **Final Arabic:** معلومات
- **Final Badini:** پوختەیا ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 10. The information you need for the current shift.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subheading`
- **Reviewed locale:** Badini
- **English source:** The information you need for the current shift.
- **Final Arabic:** معلومات
- **Final Badini:** زانیاریێن کو بو شێفتا نوکە پێدڤی نە.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 11. Delayed and busiest queues appear first.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueHelp`
- **Reviewed locale:** Badini
- **English source:** Delayed and busiest queues appear first.
- **Final Arabic:** تظهر قوائم الانتظار المتأخرة والأكثر ازدحامًا أولًا.
- **Final Badini:** سرایێن پاشکەفتی و یێن پتر مژویل ل سەری دیار دبن.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 12. Delay

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `delay`
- **Reviewed locale:** Badini
- **English source:** Delay
- **Final Arabic:** معلومات
- **Final Badini:** پاشکەفتن
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 13. The next expected patients.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `arrivalHelp`
- **Reviewed locale:** Badini
- **English source:** The next expected patients.
- **Final Arabic:** المرضى المتوقع وصولهم تالياً.
- **Final Badini:** نەخوشێن ل دویفرا یێن هاتنا وان چاڤەرێکری.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 14. Confirm arrival at reception

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `confirm`
- **Reviewed locale:** Badini
- **English source:** Confirm arrival at reception
- **Final Arabic:** معلومات
- **Final Badini:** هاتنێ ل پێشوازیێ پشتراست بکە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 15. Welcome patient at reception

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `welcome`
- **Reviewed locale:** Badini
- **English source:** Welcome patient at reception
- **Final Arabic:** معلومات
- **Final Badini:** پێشوازیێ ل نەخوشی بکە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 16. Queue load

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueLoad`
- **Reviewed locale:** Badini
- **English source:** Queue load
- **Final Arabic:** معلومات
- **Final Badini:** بارێ سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 17. Next availability

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `availability`
- **Reviewed locale:** Badini
- **English source:** Next availability
- **Final Arabic:** معلومات
- **Final Badini:** بەردەستییا ل دویفرا
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 18. {count} patients

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `count`
- **Reviewed locale:** Badini
- **English source:** {count} patients
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش {count}
- **Placeholders/interpolations:** {count}
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 19. View Live Queue

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `viewLiveQueue`
- **Reviewed locale:** Badini
- **English source:** View Live Queue
- **Final Arabic:** معلومات
- **Final Badini:** رێزبەندییا زندی ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 20. There are no appointments, queues, or arrivals for this shift.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `emptyBody`
- **Reviewed locale:** Badini
- **English source:** There are no appointments, queues, or arrivals for this shift.
- **Final Arabic:** لا توجد مواعيد أو قوائم انتظار أو حالات وصول خلال هذه الفترة.
- **Final Badini:** د ڤی شێفتی دا چ ژڤان، سرا یان هاتن نینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 21. Portal session unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Portal session unavailable
- **Final Arabic:** جلسة البوابة غير متاحة.
- **Final Badini:** دانیشتنا پۆرتالێ بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 22. The receptionist demo session is disabled in this environment.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Badini
- **English source:** The receptionist demo session is disabled in this environment.
- **Final Arabic:** جلسة الاستقبال التجريبية معطّلة في هذه البيئة.
- **Final Badini:** دانیشتنا تاقیکرنا پێشوازی د ڤی ژینگەهی دا نەچالاککرییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 23. Dr. Karwan is running 12 minutes late.

- **Final status:** `DEMO_EXCLUDED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `update1`
- **Reviewed locale:** Badini
- **English source:** Dr. Karwan is running 12 minutes late.
- **Final Arabic:** معلومات
- **Final Badini:** زانیاری
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** Fixed development-demo dashboard notice emitted only by MockDashboardRepository; production composition exposes no dashboard service. No translation approval applied.

### 24. Dr. Shilan's queue is paused for a short break.

- **Final status:** `DEMO_EXCLUDED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `update2`
- **Reviewed locale:** Badini
- **English source:** Dr. Shilan's queue is paused for a short break.
- **Final Arabic:** معلومات
- **Final Badini:** زانیاری
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** Fixed development-demo dashboard notice emitted only by MockDashboardRepository; production composition exposes no dashboard service. No translation approval applied.

### 25. Two appointments need reception review at 2:00 PM.

- **Final status:** `DEMO_EXCLUDED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `update3`
- **Reviewed locale:** Badini
- **English source:** Two appointments need reception review at 2:00 PM.
- **Final Arabic:** معلومات
- **Final Badini:** زانیاری
- **Placeholders/interpolations:** None
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** Fixed development-demo dashboard notice emitted only by MockDashboardRepository; production composition exposes no dashboard service. No translation approval applied.

### 317. {label} ({count})

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Flutter
- **Source file/module:** `mobile/lib/l10n/app_ku.arb`
- **Localization key:** `tabWithCount`
- **Reviewed locale:** Badini
- **English source:** {label} ({count})
- **Final Arabic:** معلومات
- **Final Badini:** {label} ({count})
- **Placeholders/interpolations:** {label}, {count}
- **Context:** Shown in shared portal/mobile navigation, dashboard, or common UI.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Profile/family

### 26. Find a patient and understand what happens next.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** Find a patient and understand what happens next.
- **Final Arabic:** ابحث عن مريض واطلع على الخطوة التالية.
- **Final Badini:** ل نەخوشەکێ بگەرە و بزانە ل دویفرا چ دبیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 27. There are no patients to show.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noPatientsBody`
- **Reviewed locale:** Arabic
- **English source:** There are no patients to show.
- **Final Arabic:** لا يوجد مرضى لعرضهم.
- **Final Badini:** چ نەخوش بو نیشاندانێ نینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 28. Check the name, phone number, or patient ID and try again.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noResultsBody`
- **Reviewed locale:** Arabic
- **English source:** Check the name, phone number, or patient ID and try again.
- **Final Arabic:** تحقق من الاسم أو رقم الهاتف أو رقم المريض وحاول مرة أخرى.
- **Final Badini:** ناڤ، ژمارا موبایلێ یان ژمارا نەخوشی بپشکنە و دیسان هەول بدە
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 29. No patients are expected to arrive today.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noArrivalsBody`
- **Reviewed locale:** Arabic
- **English source:** No patients are expected to arrive today.
- **Final Arabic:** لا يُتوقع وصول أي مرضى اليوم.
- **Final Badini:** ئەڤرو چ نەخوش ناهێن
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 30. Patients you open will appear here.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noRecentBody`
- **Reviewed locale:** Arabic
- **English source:** Patients you open will appear here.
- **Final Arabic:** سيظهر هنا المرضى الذين تفتح ملفاتهم.
- **Final Badini:** نەخوشێن کو تو ڤەدکەی دێ ل ڤێرێ دیار بن.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 31. This patient workspace is not available.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notFoundBody`
- **Reviewed locale:** Arabic
- **English source:** This patient workspace is not available.
- **Final Arabic:** مساحة عمل هذا المريض غير متاحة.
- **Final Badini:** جهێ کارێ ڤی نەخوشی بەردەست نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 32. Search by name, phone number, or patient ID

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `searchHint`
- **Reviewed locale:** Badini
- **English source:** Search by name, phone number, or patient ID
- **Final Arabic:** معلومات
- **Final Badini:** ب ناڤ، ژمارا موبایلێ یان ژمارا نەخوشی لێ بگەرە
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 33. Recently Viewed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `recentlyViewed`
- **Reviewed locale:** Badini
- **English source:** Recently Viewed
- **Final Arabic:** شوهد مؤخراً
- **Final Badini:** نویکترین دیتی
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 34. Last appointment

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `lastAppointment`
- **Reviewed locale:** Badini
- **English source:** Last appointment
- **Final Arabic:** معلومات
- **Final Badini:** دووماهیک ژڤان
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 35. There are no patients to show.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noPatientsBody`
- **Reviewed locale:** Badini
- **English source:** There are no patients to show.
- **Final Arabic:** لا يوجد مرضى لعرضهم.
- **Final Badini:** چ نەخوش بو نیشاندانێ نینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 36. No arrivals today

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noArrivals`
- **Reviewed locale:** Badini
- **English source:** No arrivals today
- **Final Arabic:** معلومات
- **Final Badini:** ئەڤرو چ هاتن نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 37. Patients you open will appear here.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noRecentBody`
- **Reviewed locale:** Badini
- **English source:** Patients you open will appear here.
- **Final Arabic:** سيظهر هنا المرضى الذين تفتح ملفاتهم.
- **Final Badini:** نەخوشێن کو تو ڤەدکەی دێ ل ڤێرێ دیار بن.
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 38. Recent Notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `recentNotifications`
- **Reviewed locale:** Badini
- **English source:** Recent Notifications
- **Final Arabic:** معلومات
- **Final Badini:** ئاگەهداریێن نوی
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 39. Queue update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueUpdate`
- **Reviewed locale:** Badini
- **English source:** Queue update
- **Final Arabic:** معلومات
- **Final Badini:** نویکرنا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 40. View History

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `viewHistory`
- **Reviewed locale:** Badini
- **English source:** View History
- **Final Arabic:** معلومات
- **Final Badini:** مێژووی ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 41. Back to Patients

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `backToPatients`
- **Reviewed locale:** Badini
- **English source:** Back to Patients
- **Final Arabic:** معلومات
- **Final Badini:** ب ڤەگەرە بو نەخوشان
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 42. Patient not found

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notFound`
- **Reviewed locale:** Badini
- **English source:** Patient not found
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش نەهاتە دیتن
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 43. Family

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `family`
- **Reviewed locale:** Badini
- **English source:** Family
- **Final Arabic:** معلومات
- **Final Badini:** خێزان
- **Placeholders/interpolations:** None
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 319. {relationship, select, mother {Mother} father {Father} wife {Wife} husband {Husband} son {Son} daughter {Daughter} brother {Brother} sister {Sister} grandfather {Grandfather} grandmother {Grandmother} me {Me} other {Other}}

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Flutter
- **Source file/module:** `mobile/lib/l10n/app_ku.arb`
- **Localization key:** `patientRelationship`
- **Reviewed locale:** Badini
- **English source:** {relationship, select, mother {Mother} father {Father} wife {Wife} husband {Husband} son {Son} daughter {Daughter} brother {Brother} sister {Sister} grandfather {Grandfather} grandmother {Grandmother} me {Me} other {Other}}
- **Final Arabic:** {relationship, select, mother {الأم} father {الأب} wife {الزوجة} husband {الزوج} son {الابن} daughter {الابنة} brother {الأخ} sister {الأخت} grandfather {الجد} grandmother {الجدة} me {أنا} other {أخرى}}
- **Final Badini:** {relationship, select, mother {دایک} father {باب} wife {ژین} husband {مێر} son {کور} daughter {کچ} brother {برا} sister {خوشک} grandfather {باپیر} grandmother {داپیر} me {ئەز} other {یێ دی}}
- **Placeholders/interpolations:** {relationship}, {Mother}, {Father}, {Wife}, {Husband}, {Son}, {Daughter}, {Brother}, {Sister}, {Grandfather}, {Grandmother}, {Me}, {Other}
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 320. {gender, select, female {Female} male {Male} other {Not specified}}

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Flutter
- **Source file/module:** `mobile/lib/l10n/app_ku.arb`
- **Localization key:** `patientGender`
- **Reviewed locale:** Badini
- **English source:** {gender, select, female {Female} male {Male} other {Not specified}}
- **Final Arabic:** {gender, select, female {أنثى} male {ذكر} other {غير محدد}}
- **Final Badini:** {gender, select, female {مێ} male {نێر} other {دیار نەکری}}
- **Placeholders/interpolations:** {gender}, {Female}, {Male}, {Not}
- **Context:** Shown in patient/profile/family context.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Appointments

### 44. Understand today's schedule and what needs attention.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** Understand today's schedule and what needs attention.
- **Final Arabic:** اطّلع على جدول اليوم وما يحتاج إلى انتباه.
- **Final Badini:** خشتەیا ئەڤرو بزانە و تشتێن پێدڤی ب گرنگیدانێ بناسە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 45. Search appointments

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `searchLabel`
- **Reviewed locale:** Arabic
- **English source:** Search appointments
- **Final Arabic:** البحث في المواعيد
- **Final Badini:** ل ژڤانان بگەرە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 46. Resolve the most urgent schedule questions first.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `attentionHelp`
- **Reviewed locale:** Arabic
- **English source:** Resolve the most urgent schedule questions first.
- **Final Arabic:** عالج المسائل الأكثر إلحاحًا في الجدول أولًا.
- **Final Badini:** پێش هەمیان کێشەێن گرنگ یێن خشتەیێ چارەسەر بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 47. The next appointments in chronological order.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `upcomingHelp`
- **Reviewed locale:** Arabic
- **English source:** The next appointments in chronological order.
- **Final Arabic:** المواعيد التالية مرتبة حسب الوقت.
- **Final Badini:** ژڤانێن ل دویفرا ب رێزا دەمی.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 48. There are no appointments scheduled for today.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noAppointmentsBody`
- **Reviewed locale:** Arabic
- **English source:** There are no appointments scheduled for today.
- **Final Arabic:** لا توجد مواعيد مجدولة اليوم.
- **Final Badini:** ئەڤرو چ ژڤان دیار نەکرینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 49. Check the patient, doctor, phone, or appointment ID.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noResultsBody`
- **Reviewed locale:** Arabic
- **English source:** Check the patient, doctor, phone, or appointment ID.
- **Final Arabic:** تحقق من المريض أو الطبيب أو رقم الهاتف أو رقم الموعد.
- **Final Badini:** نەخوش، نوژدار، ژمارا موبایلێ یان ژمارا ژڤانێ بپشکنە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 50. There are no more upcoming appointments in this shift.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noUpcomingBody`
- **Reviewed locale:** Arabic
- **English source:** There are no more upcoming appointments in this shift.
- **Final Arabic:** لا توجد مواعيد قادمة أخرى خلال هذه الفترة.
- **Final Badini:** د ڤی شێفتی دا چ ژڤانێن داهاتی ماینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 51. Today's schedule has no unresolved issues.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `nothingAttentionBody`
- **Reviewed locale:** Arabic
- **English source:** Today's schedule has no unresolved issues.
- **Final Arabic:** لا توجد مشكلات غير محلولة في جدول اليوم.
- **Final Badini:** خشتەیا ئەڤرو چ کێشەیا نەچارەسەرکری نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 52. Understand today's schedule and what needs attention.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Understand today's schedule and what needs attention.
- **Final Arabic:** اطّلع على جدول اليوم وما يحتاج إلى انتباه.
- **Final Badini:** خشتەیا ئەڤرو بزانە و تشتێن پێدڤی ب گرنگیدانێ بناسە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 53. Search appointments

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `searchLabel`
- **Reviewed locale:** Badini
- **English source:** Search appointments
- **Final Arabic:** البحث في المواعيد
- **Final Badini:** ل ژڤانان بگەرە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 54. Search by patient, doctor, phone, or appointment ID

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `searchHint`
- **Reviewed locale:** Badini
- **English source:** Search by patient, doctor, phone, or appointment ID
- **Final Arabic:** معلومات
- **Final Badini:** ب نەخوش، نوژدار، ژمارا موبایلێ یان ژمارا ژڤانێ لێ بگەرە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 55. Today's Schedule

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `todaySchedule`
- **Reviewed locale:** Badini
- **English source:** Today's Schedule
- **Final Arabic:** معلومات
- **Final Badini:** خشتەیا ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 56. Waiting arrivals

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `waitingArrivals`
- **Reviewed locale:** Badini
- **English source:** Waiting arrivals
- **Final Arabic:** معلومات
- **Final Badini:** هاتنێن ل چاڤەرێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 57. Needs Attention

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `needsAttention`
- **Reviewed locale:** Badini
- **English source:** Needs Attention
- **Final Arabic:** معلومات
- **Final Badini:** پێدڤی ب گرنگیدانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 58. Resolve the most urgent schedule questions first.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `attentionHelp`
- **Reviewed locale:** Badini
- **English source:** Resolve the most urgent schedule questions first.
- **Final Arabic:** عالج المسائل الأكثر إلحاحًا في الجدول أولًا.
- **Final Badini:** پێش هەمیان کێشەێن گرنگ یێن خشتەیێ چارەسەر بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 59. Upcoming

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `upcoming`
- **Reviewed locale:** Badini
- **English source:** Upcoming
- **Final Arabic:** معلومات
- **Final Badini:** داهاتی
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 60. The next appointments in chronological order.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `upcomingHelp`
- **Reviewed locale:** Badini
- **English source:** The next appointments in chronological order.
- **Final Arabic:** المواعيد التالية مرتبة حسب الوقت.
- **Final Badini:** ژڤانێن ل دویفرا ب رێزا دەمی.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 61. All Today's Appointments

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `allToday`
- **Reviewed locale:** Badini
- **English source:** All Today's Appointments
- **Final Arabic:** معلومات
- **Final Badini:** هەمی ژڤانێن ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 62. There are no appointments scheduled for today.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noAppointmentsBody`
- **Reviewed locale:** Badini
- **English source:** There are no appointments scheduled for today.
- **Final Arabic:** لا توجد مواعيد مجدولة اليوم.
- **Final Badini:** ئەڤرو چ ژڤان دیار نەکرینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 63. There are no more upcoming appointments in this shift.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `noUpcomingBody`
- **Reviewed locale:** Badini
- **English source:** There are no more upcoming appointments in this shift.
- **Final Arabic:** لا توجد مواعيد قادمة أخرى خلال هذه الفترة.
- **Final Badini:** د ڤی شێفتی دا چ ژڤانێن داهاتی ماینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 64. Patient is late

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `patientLate`
- **Reviewed locale:** Badini
- **English source:** Patient is late
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش پاشکەفتییە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 65. Appointment conflict

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `conflict`
- **Reviewed locale:** Badini
- **English source:** Appointment conflict
- **Final Arabic:** معلومات
- **Final Badini:** ناکۆکییا ژڤانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 66. Possible duplicate booking

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `duplicate`
- **Reviewed locale:** Badini
- **English source:** Possible duplicate booking
- **Final Arabic:** معلومات
- **Final Badini:** دبیت گرتنا ژڤانی دووبارە بیت
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 67. Missing phone number

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `missingPhone`
- **Reviewed locale:** Badini
- **English source:** Missing phone number
- **Final Arabic:** معلومات
- **Final Badini:** ژمارا موبایلێ نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 68. Patient has not arrived

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notArrived`
- **Reviewed locale:** Badini
- **English source:** Patient has not arrived
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش نەگەهشتییە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 69. Appointment Workspace

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `appointmentWorkspace`
- **Reviewed locale:** Badini
- **English source:** Appointment Workspace
- **Final Arabic:** معلومات
- **Final Badini:** جهێ کارێ ژڤانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 70. Appointment Summary

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `summary`
- **Reviewed locale:** Badini
- **English source:** Appointment Summary
- **Final Arabic:** معلومات
- **Final Badini:** پوختەیا ژڤانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 71. Working session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `workingSession`
- **Reviewed locale:** Badini
- **English source:** Working session
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتنا کاری
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 72. Timeline

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `timeline`
- **Reviewed locale:** Badini
- **English source:** Timeline
- **Final Arabic:** معلومات
- **Final Badini:** خشتەیا دەمی
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 73. Queue Information

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueInformation`
- **Reviewed locale:** Badini
- **English source:** Queue Information
- **Final Arabic:** معلومات
- **Final Badini:** زانیاریێن سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 74. Queue health

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `queueHealth`
- **Reviewed locale:** Badini
- **English source:** Queue health
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 75. Notes

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notes`
- **Reviewed locale:** Badini
- **English source:** Notes
- **Final Arabic:** معلومات
- **Final Badini:** تێبینی
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 76. Notes will be available in a future Sprint.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notesPlaceholder`
- **Reviewed locale:** Badini
- **English source:** Notes will be available in a future Sprint.
- **Final Arabic:** معلومات
- **Final Badini:** تێبینی د وەشانەکا داهاتی دا بەردەست دبن.
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 77. View Doctor

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `viewDoctor`
- **Reviewed locale:** Badini
- **English source:** View Doctor
- **Final Arabic:** معلومات
- **Final Badini:** نوژداری ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 78. Back to Appointments

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `backToAppointments`
- **Reviewed locale:** Badini
- **English source:** Back to Appointments
- **Final Arabic:** معلومات
- **Final Badini:** ب ڤەگەرە بو ژڤانان
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 79. Reminder sent

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `reminderSent`
- **Reviewed locale:** Badini
- **English source:** Reminder sent
- **Final Arabic:** معلومات
- **Final Badini:** بیرئینان هاتە فرێکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 80. Patient expected

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `patientExpected`
- **Reviewed locale:** Badini
- **English source:** Patient expected
- **Final Arabic:** معلومات
- **Final Badini:** چاڤەرێیا نەخوشی دهێتە کرن
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 81. Doctor started

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `doctorStarted`
- **Reviewed locale:** Badini
- **English source:** Doctor started
- **Final Arabic:** معلومات
- **Final Badini:** نوژدار دەستپێکر
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 82. Pending

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `pending`
- **Reviewed locale:** Badini
- **English source:** Pending
- **Final Arabic:** معلومات
- **Final Badini:** ل چاڤەرێیە
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 83. Late

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `late`
- **Reviewed locale:** Badini
- **English source:** Late
- **Final Arabic:** معلومات
- **Final Badini:** پاشکەفتی
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 98. Scheduled

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/clinical-presentation/messages.ts`
- **Localization key:** `scheduled`
- **Reviewed locale:** Badini
- **English source:** Scheduled
- **Final Arabic:** معلومات
- **Final Badini:** دیارکری
- **Placeholders/interpolations:** None
- **Context:** Shown in appointment lists, details, status, or appointment actions.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Arrival

### 84. Record Patient Arrival

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `title`
- **Reviewed locale:** Arabic
- **English source:** Record Patient Arrival
- **Final Arabic:** تسجيل وصول المريض
- **Final Badini:** هاتنا نەخوشی تومار بکە
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 85. Confirm the patient and appointment before recording arrival.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** Confirm the patient and appointment before recording arrival.
- **Final Arabic:** تأكد من المريض والموعد قبل تسجيل الوصول.
- **Final Badini:** بەری تومارکرنا هاتنێ، نەخوش و ژڤانێ پشتراست بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 86. Arrival could not be recorded.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `failure`
- **Reviewed locale:** Arabic
- **English source:** Arrival could not be recorded.
- **Final Arabic:** تعذر تسجيل الوصول.
- **Final Badini:** هاتن نەشیا بهێتە تومارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 87. Record Patient Arrival

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `title`
- **Reviewed locale:** Badini
- **English source:** Record Patient Arrival
- **Final Arabic:** تسجيل وصول المريض
- **Final Badini:** هاتنا نەخوشی تومار بکە
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 88. Confirm the patient and appointment before recording arrival.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Confirm the patient and appointment before recording arrival.
- **Final Arabic:** تأكد من المريض والموعد قبل تسجيل الوصول.
- **Final Badini:** بەری تومارکرنا هاتنێ، نەخوش و ژڤانێ پشتراست بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 89. Patient has arrived

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `success`
- **Reviewed locale:** Badini
- **English source:** Patient has arrived
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش گەهشت
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 90. Prepare for Live Queue

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `prepareQueue`
- **Reviewed locale:** Badini
- **English source:** Prepare for Live Queue
- **Final Arabic:** معلومات
- **Final Badini:** بو رێزبەندییا زندی ئامادە بە
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 91. Arrival was already recorded

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `alreadyArrived`
- **Reviewed locale:** Badini
- **English source:** Arrival was already recorded
- **Final Arabic:** معلومات
- **Final Badini:** هاتن ژبەری هاتە تومارکرن
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 92. This appointment is not eligible for arrival.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notEligible`
- **Reviewed locale:** Badini
- **English source:** This appointment is not eligible for arrival.
- **Final Arabic:** معلومات
- **Final Badini:** ئەڤ ژڤانە بو تومارکرنا هاتنێ گونجای نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 93. The appointment could not be found.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `notFound`
- **Reviewed locale:** Badini
- **English source:** The appointment could not be found.
- **Final Arabic:** معلومات
- **Final Badini:** ژڤان نەهاتە دیتن.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 94. The patient does not match this appointment.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `wrongPatient`
- **Reviewed locale:** Badini
- **English source:** The patient does not match this appointment.
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش ل گەل ڤی ژڤانی ناگونجیت.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 95. The appointment changed before arrival was recorded.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `stale`
- **Reviewed locale:** Badini
- **English source:** The appointment changed before arrival was recorded.
- **Final Arabic:** معلومات
- **Final Badini:** بەری تومارکرنا هاتنێ ژڤان هاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 96. Arrival could not be recorded.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `failure`
- **Reviewed locale:** Badini
- **English source:** Arrival could not be recorded.
- **Final Arabic:** تعذر تسجيل الوصول.
- **Final Badini:** هاتن نەشیا بهێتە تومارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 97. Recording arrival

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/i18n/index.ts`
- **Localization key:** `recording`
- **Reviewed locale:** Badini
- **English source:** Recording arrival
- **Final Arabic:** معلومات
- **Final Badini:** هاتن دهێتە تومارکرن
- **Placeholders/interpolations:** None
- **Context:** Shown while reviewing or recording patient arrival.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Live Queue

### 99. See who is being seen, who is next, and the action required now.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** See who is being seen, who is next, and the action required now.
- **Final Arabic:** اطّلع على المريض قيد المعاينة، والمريض التالي، والإجراء المطلوب الآن.
- **Final Badini:** ببینە کێ د پشکنینێ دایە، کێ ل دویفرا یە، و نوکە چ کار پێدڤییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 100. The queue is moving at a comfortable pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `healthyHelp`
- **Reviewed locale:** Arabic
- **English source:** The queue is moving at a comfortable pace.
- **Final Arabic:** تسير قائمة الانتظار حاليًا بوتيرة جيدة.
- **Final Badini:** سرا ب خێراییەکا باش دچیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 101. More patients are waiting than usual. Keep the queue moving.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `busyHelp`
- **Reviewed locale:** Arabic
- **English source:** More patients are waiting than usual. Keep the queue moving.
- **Final Arabic:** هناك مرضى أكثر من المعتاد في الانتظار. حافظ على سير قائمة الانتظار.
- **Final Badini:** ژ ئاسایی پتر نەخوش ل چاڤەرێ نە. سرایێ بەردەوام ببە پێش.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 102. Patients are waiting longer than expected.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `delayedHelp`
- **Reviewed locale:** Arabic
- **English source:** Patients are waiting longer than expected.
- **Final Arabic:** ينتظر المرضى مدة أطول من المتوقع.
- **Final Badini:** نەخوش پتر ژ دەمێ پێشبینی کری چاڤەرێ نە.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 103. Operational Actions

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `operationalActions`
- **Reviewed locale:** Arabic
- **English source:** Operational Actions
- **Final Arabic:** الإجراءات التشغيلية
- **Final Badini:** کارێن بەڕێڤەبرنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 104. Queue Operations

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `title`
- **Reviewed locale:** Badini
- **English source:** Queue Operations
- **Final Arabic:** إدارة قائمة الانتظار
- **Final Badini:** کارێن سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 105. See who is being seen, who is next, and the action required now.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** See who is being seen, who is next, and the action required now.
- **Final Arabic:** اطّلع على المريض قيد المعاينة، والمريض التالي، والإجراء المطلوب الآن.
- **Final Badini:** ببینە کێ د پشکنینێ دایە، کێ ل دویفرا یە، و نوکە چ کار پێدڤییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 106. Clinic Queue Status

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `clinicQueueStatus`
- **Reviewed locale:** Badini
- **English source:** Clinic Queue Status
- **Final Arabic:** حالة قائمة انتظار العيادة
- **Final Badini:** رەوشا سرایا کلینیکێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 107. Queue

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queue`
- **Reviewed locale:** Badini
- **English source:** Queue
- **Final Arabic:** معلومات
- **Final Badini:** سرا
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 108. Queue Health

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queueHealth`
- **Reviewed locale:** Badini
- **English source:** Queue Health
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 109. Number

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `number`
- **Reviewed locale:** Badini
- **English source:** Number
- **Final Arabic:** معلومات
- **Final Badini:** ژمارە
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 110. Elapsed consultation time

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `elapsed`
- **Reviewed locale:** Badini
- **English source:** Elapsed consultation time
- **Final Arabic:** معلومات
- **Final Badini:** دەمێ بوری یێ پشکنینێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 111. Recall Patient

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `recallPatient`
- **Reviewed locale:** Badini
- **English source:** Recall Patient
- **Final Arabic:** معلومات
- **Final Badini:** نەخوشی دیسان بانگ بکە
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 112. Waiting List

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `waitingList`
- **Reviewed locale:** Badini
- **English source:** Waiting List
- **Final Arabic:** قائمة الانتظار
- **Final Badini:** سرایا چاڤەرێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 113. Queue #

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queueNumber`
- **Reviewed locale:** Badini
- **English source:** Queue #
- **Final Arabic:** معلومات
- **Final Badini:** ژمارا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 114. Recent Activity

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `recentActivity`
- **Reviewed locale:** Badini
- **English source:** Recent Activity
- **Final Arabic:** النشاط الأخير
- **Final Badini:** چالاکییا نوی
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 115. Operational Actions

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `operationalActions`
- **Reviewed locale:** Badini
- **English source:** Operational Actions
- **Final Arabic:** الإجراءات التشغيلية
- **Final Badini:** کارێن بەڕێڤەبرنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 116. Pause Queue

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `pauseQueue`
- **Reviewed locale:** Badini
- **English source:** Pause Queue
- **Final Arabic:** إيقاف القائمة مؤقتاً
- **Final Badini:** سرایێ بو دەمکی رابگرە
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 117. Resume Queue

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `resumeQueue`
- **Reviewed locale:** Badini
- **English source:** Resume Queue
- **Final Arabic:** استئناف القائمة
- **Final Badini:** سرایێ دیسان بەردەوام بکە
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 118. Complete this consultation? The patient will leave the active queue.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `confirmComplete`
- **Reviewed locale:** Badini
- **English source:** Complete this consultation? The patient will leave the active queue.
- **Final Arabic:** معلومات
- **Final Badini:** تو دخوازی ڤێ پشکنینێ تەمام بکەی؟ نەخوش دێ ژ سرایا چالاک دەرکەڤیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 119. Queue opened

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queueOpened`
- **Reviewed locale:** Badini
- **English source:** Queue opened
- **Final Arabic:** معلومات
- **Final Badini:** سرا هاتە ڤەکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 120. Queue resumed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queueResumed`
- **Reviewed locale:** Badini
- **English source:** Queue resumed
- **Final Arabic:** معلومات
- **Final Badini:** سرا دیسان بەردەوام بوو
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 121. Patient recalled

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `patientRecalled`
- **Reviewed locale:** Badini
- **English source:** Patient recalled
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش دیسان هاتە بانگکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 122. No response recorded

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `noResponse`
- **Reviewed locale:** Badini
- **English source:** No response recorded
- **Final Arabic:** معلومات
- **Final Badini:** بێ بەرسڤ هاتە تومارکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 123. {change}. Current patient: {current}. Next patient: {next}. Queue health: {health}.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `success`
- **Reviewed locale:** Badini
- **English source:** {change}. Current patient: {current}. Next patient: {next}. Queue health: {health}.
- **Final Arabic:** معلومات
- **Final Badini:** {change}. نەخوشێ نوکە: {current}. نەخوشێ ل دویفرا: {next}. رەوشا سرایێ: {health}.
- **Placeholders/interpolations:** {change}, {current}, {next}, {health}
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 124. Resume the queue before continuing.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/messages.ts`
- **Localization key:** `queueIsPaused`
- **Reviewed locale:** Badini
- **English source:** Resume the queue before continuing.
- **Final Arabic:** معلومات
- **Final Badini:** بەری بەردەوامبوونێ سرایێ دیسان بەردەوام بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 315. Not started

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/production-messages.ts`
- **Localization key:** `notStarted`
- **Reviewed locale:** Badini
- **English source:** Not started
- **Final Arabic:** معلومات
- **Final Badini:** دەستپێ نەکری
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 316. Entry status

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/live-queue/presentation/production-messages.ts`
- **Localization key:** `entryStatus`
- **Reviewed locale:** Badini
- **English source:** Entry status
- **Final Arabic:** حالة المريض
- **Final Badini:** رەوشا چوونا ژور
- **Placeholders/interpolations:** None
- **Context:** Shown in live-queue status, controls, guidance, or feedback.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Doctor Settings

### 125. Settings unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Settings unavailable
- **Final Arabic:** الإعدادات غير متاحة.
- **Final Badini:** رێکخستن بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 126. Doctor settings cannot be loaded. No profile or preference state was changed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** Doctor settings cannot be loaded. No profile or preference state was changed.
- **Final Arabic:** تعذر تحميل إعدادات الطبيب. لم يتم تغيير الملف أو أي تفضيلات.
- **Final Badini:** بارکرنا رێکخستنێن نوژداری سەرنەکەفت. پروفایل و چ هەلبژارتنەک نەهاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 127. Your identity, clinic assignment, session, and future preferences.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Your identity, clinic assignment, session, and future preferences.
- **Final Arabic:** هويتك وتكليف العيادة والجلسة والتفضيلات المستقبلية.
- **Final Badini:** ناسناما تە، دیارکرنا کلینیکێ، دانیشتن و هەلبژارتنێن داهاتی یێن تە.
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 128. Working location

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `workingLocation`
- **Reviewed locale:** Badini
- **English source:** Working location
- **Final Arabic:** موقع العمل
- **Final Badini:** جهێ کاری
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 129. Today's Session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `todaySession`
- **Reviewed locale:** Badini
- **English source:** Today's Session
- **Final Arabic:** جلسة اليوم
- **Final Badini:** دانیشتنا ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 130. Session state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `sessionState`
- **Reviewed locale:** Badini
- **English source:** Session state
- **Final Arabic:** حالة الجلسة
- **Final Badini:** رەوشا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 131. Started at

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `startedAt`
- **Reviewed locale:** Badini
- **English source:** Started at
- **Final Arabic:** بدأت في
- **Final Badini:** دەستپێکر ل
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 132. Patients completed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `patientsCompleted`
- **Reviewed locale:** Badini
- **English source:** Patients completed
- **Final Arabic:** المرضى المكتملون
- **Final Badini:** نەخوشێن تەمامبووی
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 133. Patients remaining

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `patientsRemaining`
- **Reviewed locale:** Badini
- **English source:** Patients remaining
- **Final Arabic:** المرضى المتبقون
- **Final Badini:** نەخوشێن مایی
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 134. Queue health

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `queueHealth`
- **Reviewed locale:** Badini
- **English source:** Queue health
- **Final Arabic:** حالة قائمة الانتظار
- **Final Badini:** رەوشا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 135. Theme

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `theme`
- **Reviewed locale:** Badini
- **English source:** Theme
- **Final Arabic:** السمة
- **Final Badini:** دیمەن
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 136. Reduced motion

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `reducedMotion`
- **Reviewed locale:** Badini
- **English source:** Reduced motion
- **Final Arabic:** تقليل الحركة
- **Final Badini:** کێمکرنا جوولانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 137. Follow system setting

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `followSystem`
- **Reviewed locale:** Badini
- **English source:** Follow system setting
- **Final Arabic:** معلومات
- **Final Badini:** ل دویف رێکخستنێن سیستەمی هەرە
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 138. Text size

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `textSize`
- **Reviewed locale:** Badini
- **English source:** Text size
- **Final Arabic:** حجم النص
- **Final Badini:** قەبارێ نڤیسینێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 139. RTL status

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `rtlStatus`
- **Reviewed locale:** Badini
- **English source:** RTL status
- **Final Arabic:** حالة الاتجاه من اليمين
- **Final Badini:** رەوشا راست بو چەپ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 140. Queue notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `queueNotifications`
- **Reviewed locale:** Badini
- **English source:** Queue notifications
- **Final Arabic:** معلومات
- **Final Badini:** ئاگەهداریێن سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 141. Schedule notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `scheduleNotifications`
- **Reviewed locale:** Badini
- **English source:** Schedule notifications
- **Final Arabic:** معلومات
- **Final Badini:** ئاگەهداریێن خشتەیێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 142. Session reminders

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `sessionReminders`
- **Reviewed locale:** Badini
- **English source:** Session reminders
- **Final Arabic:** معلومات
- **Final Badini:** بیرئینانێن دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 143. Available in a future release

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `futureRelease`
- **Reviewed locale:** Badini
- **English source:** Available in a future release
- **Final Arabic:** متاح في إصدار مستقبلي
- **Final Badini:** د وەشانەکا داهاتی دا بەردەست دبیت
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 144. Production

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `production`
- **Reviewed locale:** Badini
- **English source:** Production
- **Final Arabic:** معلومات
- **Final Badini:** بەرهەمهێنان
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 145. Portal version

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `portalVersion`
- **Reviewed locale:** Badini
- **English source:** Portal version
- **Final Arabic:** معلومات
- **Final Badini:** وەشانا پۆرتالێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 146. Mock session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `mockSession`
- **Reviewed locale:** Badini
- **English source:** Mock session
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتنا تاقیکرنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 147. Repository mode

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `repositoryMode`
- **Reviewed locale:** Badini
- **English source:** Repository mode
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا رێپۆزیتۆریێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 148. Mock repository

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `mock`
- **Reviewed locale:** Badini
- **English source:** Mock repository
- **Final Arabic:** معلومات
- **Final Badini:** رێپۆزیتۆریا تاقیکرنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 149. Last localization update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `lastLocalizationUpdate`
- **Reviewed locale:** Badini
- **English source:** Last localization update
- **Final Arabic:** معلومات
- **Final Badini:** دووماهیک نویکرنا زمانان
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 150. Information link planned for a future release

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `supportPlaceholder`
- **Reviewed locale:** Badini
- **English source:** Information link planned for a future release
- **Final Arabic:** معلومات
- **Final Badini:** گرێدانەکا زانیاری د وەشانەکا داهاتی دا بەردەست دبیت
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 151. Settings unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-settings/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Settings unavailable
- **Final Arabic:** الإعدادات غير متاحة.
- **Final Badini:** رێکخستن بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in doctor settings and preferences.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Doctor Schedule

### 152. The queue is currently behind its expected pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `runningBehindHelp`
- **Reviewed locale:** Arabic
- **English source:** The queue is currently behind its expected pace.
- **Final Arabic:** تسير قائمة الانتظار حاليًا بوتيرة أبطأ من المتوقع.
- **Final Badini:** نوکە سرا ژ خێراییا پێشبینی کری پاشکەفتییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 153. There is a longer open period between appointments.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `largeGapHelp`
- **Reviewed locale:** Arabic
- **English source:** There is a longer open period between appointments.
- **Final Arabic:** توجد فترة فارغة طويلة بين المواعيد.
- **Final Badini:** د ناڤبەرا ژڤانان دا دەمەکێ ڤالا یێ درێژ هەیە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 154. A scheduled lunch break appears in today's timeline.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `lunchApproachingHelp`
- **Reviewed locale:** Arabic
- **English source:** A scheduled lunch break appears in today's timeline.
- **Final Arabic:** تظهر استراحة غداء مجدولة ضمن جدول اليوم.
- **Final Badini:** بێهنڤەدانا خوارنێ یا دیارکری د خشتەیا ئەڤرو دا دیارە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 155. The final appointment is close to the end of working hours.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `sessionEndingSoonHelp`
- **Reviewed locale:** Arabic
- **English source:** The final appointment is close to the end of working hours.
- **Final Arabic:** الموعد الأخير قريب من نهاية ساعات العمل.
- **Final Badini:** ژڤانا دووماهیێ نێزیکی دووماهیکا دەمێ کاری یە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 156. Several appointments are scheduled after midday.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `busyAfternoonHelp`
- **Reviewed locale:** Arabic
- **English source:** Several appointments are scheduled after midday.
- **Final Arabic:** توجد عدة مواعيد مجدولة بعد الظهر.
- **Final Badini:** چەند ژڤان پشتی نیڤرو هاتینە دیارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 157. The schedule has no derived warnings right now.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `noWarningsHelp`
- **Reviewed locale:** Arabic
- **English source:** The schedule has no derived warnings right now.
- **Final Arabic:** لا توجد تنبيهات مستخلصة من الجدول حاليًا.
- **Final Badini:** نوکە خشتەی چ ئاگەهدارییەکا پێکهاتی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 158. No remaining appointments are scheduled for this doctor.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `noUpcomingHelp`
- **Reviewed locale:** Arabic
- **English source:** No remaining appointments are scheduled for this doctor.
- **Final Arabic:** لا توجد مواعيد متبقية مجدولة لهذا الطبيب.
- **Final Badini:** چ ژڤانێن مایی بو ڤی نوژداری نەهاتینە دیارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 159. Schedule unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Schedule unavailable
- **Final Arabic:** الجدول غير متاح.
- **Final Badini:** خشتە بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 160. The read-only doctor schedule is unavailable. No appointment state was changed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** The read-only doctor schedule is unavailable. No appointment state was changed.
- **Final Arabic:** جدول الطبيب المخصص للعرض فقط غير متاح. لم يتم تغيير حالة أي موعد.
- **Final Badini:** خشتەیا نوژداری یا تنێ بو خواندنێ بەردەست نینە. رەوشا چ ژڤانەکێ نەهاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 161. A read-only view of today's session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** A read-only view of today's session.
- **Final Arabic:** عرض للقراءة فقط لجلسة اليوم.
- **Final Badini:** دیتنەکا تنێ بو خواندنا دانیشتنا ئەڤرو.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 162. Today's Timeline

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `todayTimeline`
- **Reviewed locale:** Badini
- **English source:** Today's Timeline
- **Final Arabic:** الجدول الزمني لليوم
- **Final Badini:** خشتەیا دەمی یا ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 163. Upcoming Sessions

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `upcomingSessions`
- **Reviewed locale:** Badini
- **English source:** Upcoming Sessions
- **Final Arabic:** الجلسات القادمة
- **Final Badini:** دانیشتنێن داهاتی
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 164. Schedule Alerts

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `scheduleAlerts`
- **Reviewed locale:** Badini
- **English source:** Schedule Alerts
- **Final Arabic:** تنبيهات الجدول
- **Final Badini:** ئاگەهداریێن خشتەیێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 165. Upcoming

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `upcoming`
- **Reviewed locale:** Badini
- **English source:** Upcoming
- **Final Arabic:** معلومات
- **Final Badini:** داهاتی
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 166. Running behind

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `runningBehind`
- **Reviewed locale:** Badini
- **English source:** Running behind
- **Final Arabic:** معلومات
- **Final Badini:** پاشکەفتی
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 167. There is a longer open period between appointments.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `largeGapHelp`
- **Reviewed locale:** Badini
- **English source:** There is a longer open period between appointments.
- **Final Arabic:** توجد فترة فارغة طويلة بين المواعيد.
- **Final Badini:** د ناڤبەرا ژڤانان دا دەمەکێ ڤالا یێ درێژ هەیە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 168. Session ending soon

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `sessionEndingSoon`
- **Reviewed locale:** Badini
- **English source:** Session ending soon
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتن نێزیکی دووماهیکێ یە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 169. Busy afternoon

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `busyAfternoon`
- **Reviewed locale:** Badini
- **English source:** Busy afternoon
- **Final Arabic:** معلومات
- **Final Badini:** پشتی نیڤرو مژویلە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 170. Several appointments are scheduled after midday.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `busyAfternoonHelp`
- **Reviewed locale:** Badini
- **English source:** Several appointments are scheduled after midday.
- **Final Arabic:** توجد عدة مواعيد مجدولة بعد الظهر.
- **Final Badini:** چەند ژڤان پشتی نیڤرو هاتینە دیارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 171. The schedule has no derived warnings right now.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `noWarningsHelp`
- **Reviewed locale:** Badini
- **English source:** The schedule has no derived warnings right now.
- **Final Arabic:** لا توجد تنبيهات مستخلصة من الجدول حاليًا.
- **Final Badini:** نوکە خشتەی چ ئاگەهدارییەکا پێکهاتی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 172. No remaining appointments are scheduled for this doctor.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `noUpcomingHelp`
- **Reviewed locale:** Badini
- **English source:** No remaining appointments are scheduled for this doctor.
- **Final Arabic:** لا توجد مواعيد متبقية مجدولة لهذا الطبيب.
- **Final Badini:** چ ژڤانێن مایی بو ڤی نوژداری نەهاتینە دیارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 173. Schedule unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Schedule unavailable
- **Final Arabic:** الجدول غير متاح.
- **Final Badini:** خشتە بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 174. The read-only doctor schedule is unavailable. No appointment state was changed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-schedule/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Badini
- **English source:** The read-only doctor schedule is unavailable. No appointment state was changed.
- **Final Arabic:** جدول الطبيب المخصص للعرض فقط غير متاح. لم يتم تغيير حالة أي موعد.
- **Final Badini:** خشتەیا نوژداری یا تنێ بو خواندنێ بەردەست نینە. رەوشا چ ژڤانەکێ نەهاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor schedule workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Doctor Workspace

### 175. Your current patient and the next patients prepared for this session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** Your current patient and the next patients prepared for this session.
- **Final Arabic:** المريض الحالي والمرضى التاليون الذين تم تجهيزهم لهذه الجلسة.
- **Final Badini:** نەخوشێ نوکە یێ تە و نەخوشێن ل دویفرا یێن بو ڤێ دانیشتنێ ئامادەکری.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 176. No consultation is active. The waiting patients remain unchanged.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `noCurrentBody`
- **Reviewed locale:** Arabic
- **English source:** No consultation is active. The waiting patients remain unchanged.
- **Final Arabic:** لا توجد استشارة نشطة حاليًا. سيبقى المرضى المنتظرون دون تغيير.
- **Final Badini:** نوکە چ پشکنینەک چالاک نینە. نەخوشێن ل چاڤەرێ وەکی خو دمینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 177. Reception has not prepared another patient for this doctor session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `noNextBody`
- **Reviewed locale:** Arabic
- **English source:** Reception has not prepared another patient for this doctor session.
- **Final Arabic:** لم يجهز الاستقبال مريضًا آخر لجلسة الطبيب هذه.
- **Final Badini:** پێشوازی هێشتا نەخوشەکێ دی بو ڤێ دانیشتنا نوژداری ئامادە نەکرییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 178. Doctor patients unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Doctor patients unavailable
- **Final Arabic:** مرضى الطبيب غير متاحين.
- **Final Badini:** نەخوشێن نوژداری بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 179. This doctor session is not enabled. No patient information has been exposed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** This doctor session is not enabled. No patient information has been exposed.
- **Final Arabic:** جلسة الطبيب هذه غير مفعّلة. لم يتم عرض أي معلومات عن المرضى.
- **Final Badini:** ئەڤ دانیشتنا نوژداری نەچالاککرییە. چ زانیاریێن نەخوشی نەهاتینە نیشاندان.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 180. Patients Today

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `title`
- **Reviewed locale:** Badini
- **English source:** Patients Today
- **Final Arabic:** مرضى اليوم
- **Final Badini:** نەخوشێن ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 181. Your current patient and the next patients prepared for this session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Your current patient and the next patients prepared for this session.
- **Final Arabic:** المريض الحالي والمرضى التاليون الذين تم تجهيزهم لهذه الجلسة.
- **Final Badini:** نەخوشێ نوکە یێ تە و نەخوشێن ل دویفرا یێن بو ڤێ دانیشتنێ ئامادەکری.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 182. Session Summary

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `sessionSummary`
- **Reviewed locale:** Badini
- **English source:** Session Summary
- **Final Arabic:** ملخص الجلسة
- **Final Badini:** پوختەیا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 183. Session state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `sessionState`
- **Reviewed locale:** Badini
- **English source:** Session state
- **Final Arabic:** حالة الجلسة
- **Final Badini:** رەوشا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 184. Visible patients

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `visiblePatients`
- **Reviewed locale:** Badini
- **English source:** Visible patients
- **Final Arabic:** المرضى الظاهرون
- **Final Badini:** نەخوشێن دیار
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 185. Arrival state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `arrivalState`
- **Reviewed locale:** Badini
- **English source:** Arrival state
- **Final Arabic:** حالة الوصول
- **Final Badini:** رەوشا هاتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 186. No patients are ready next

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `noNext`
- **Reviewed locale:** Badini
- **English source:** No patients are ready next
- **Final Arabic:** لا يوجد مرضى جاهزون تالياً
- **Final Badini:** چ نەخوش بو ل دویفرا ئامادە نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 187. Reception has not prepared another patient for this doctor session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `noNextBody`
- **Reviewed locale:** Badini
- **English source:** Reception has not prepared another patient for this doctor session.
- **Final Arabic:** لم يجهز الاستقبال مريضًا آخر لجلسة الطبيب هذه.
- **Final Badini:** پێشوازی هێشتا نەخوشەکێ دی بو ڤێ دانیشتنا نوژداری ئامادە نەکرییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 188. Doctor patients unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Doctor patients unavailable
- **Final Arabic:** مرضى الطبيب غير متاحين.
- **Final Badini:** نەخوشێن نوژداری بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 189. This doctor session is not enabled. No patient information has been exposed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-patients/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Badini
- **English source:** This doctor session is not enabled. No patient information has been exposed.
- **Final Arabic:** جلسة الطبيب هذه غير مفعّلة. لم يتم عرض أي معلومات عن المرضى.
- **Final Badini:** ئەڤ دانیشتنا نوژداری نەچالاککرییە. چ زانیاریێن نەخوشی نەهاتینە نیشاندان.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 243. Doctor session unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Doctor session unavailable
- **Final Arabic:** جلسة الطبيب غير متاحة.
- **Final Badini:** دانیشتنا نوژداری بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 244. This doctor workspace is not enabled. No clinical or queue information has been exposed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** This doctor workspace is not enabled. No clinical or queue information has been exposed.
- **Final Arabic:** مساحة عمل الطبيب غير مفعّلة. لم يتم عرض أي معلومات سريرية أو معلومات عن قائمة الانتظار.
- **Final Badini:** ئەڤ جهێ کارێ نوژداری نەچالاککرییە. چ زانیاریێن پشکنینێ یان سرایێ نەهاتینە نیشاندان.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 245. Your current consultation and the next safe action.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Arabic
- **English source:** Your current consultation and the next safe action.
- **Final Arabic:** الاستشارة الحالية والإجراء الآمن التالي.
- **Final Badini:** پشکنینا نوکە یا تە و کارێ پاراستی یێ ل دویفرا.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 246. No consultation is active. The waiting list remains unchanged until reception calls the next patient.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `noActivePatientBody`
- **Reviewed locale:** Arabic
- **English source:** No consultation is active. The waiting list remains unchanged until reception calls the next patient.
- **Final Arabic:** لا توجد استشارة نشطة حاليًا. ستبقى قائمة الانتظار دون تغيير حتى يستدعي الاستقبال المريض التالي.
- **Final Badini:** نوکە چ پشکنینەک چالاک نینە. سرایا چاڤەرێ هەروەسا دمینیت هەتا پێشوازی نەخوشێ ل دویفرا بانگ بکەت
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 247. There is nothing to call from this workspace. Reception can continue managing arrivals safely.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `noWaitingBody`
- **Reviewed locale:** Arabic
- **English source:** There is nothing to call from this workspace. Reception can continue managing arrivals safely.
- **Final Arabic:** لا يوجد مريض جاهز للاستدعاء من مساحة العمل هذه. يمكن للاستقبال متابعة إدارة حالات الوصول بأمان.
- **Final Badini:** ل ڤی جهێ کاری چ تشت بو بانگکرنێ نینە. پێشوازی دشێت ب پاراستی بەردەوام بیت د رێڤەبرنا هاتنان دا.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 248. The queue is moving at a comfortable pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `healthyHelp`
- **Reviewed locale:** Arabic
- **English source:** The queue is moving at a comfortable pace.
- **Final Arabic:** تسير قائمة الانتظار حاليًا بوتيرة جيدة.
- **Final Badini:** سرا ب خێراییەکا باش دچیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 249. Several patients are waiting. Continue the current consultation normally.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `busyHelp`
- **Reviewed locale:** Arabic
- **English source:** Several patients are waiting. Continue the current consultation normally.
- **Final Arabic:** هناك عدة مرضى في الانتظار. تابع الاستشارة الحالية بشكل طبيعي.
- **Final Badini:** چەند نەخوش ل چاڤەرێ نە. پشکنینا نوکە ب شێوەیەکێ ئاسایی بەردەوام بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 250. Patients are waiting longer than expected.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `delayedHelp`
- **Reviewed locale:** Arabic
- **English source:** Patients are waiting longer than expected.
- **Final Arabic:** ينتظر المرضى مدة أطول من المتوقع.
- **Final Badini:** نەخوش پتر ژ دەمێ پێشبینی کری چاڤەرێ نە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 251. Not available in this Sprint

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `placeholderTitle`
- **Reviewed locale:** Arabic
- **English source:** Not available in this Sprint
- **Final Arabic:** غير متاح في هذا الإصدار حاليًا.
- **Final Badini:** د ڤی وەشانێ دا بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 252. This doctor destination is intentionally unavailable. Return to Workspace to continue the active session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `placeholderBody`
- **Reviewed locale:** Arabic
- **English source:** This doctor destination is intentionally unavailable. Return to Workspace to continue the active session.
- **Final Arabic:** هذه الوجهة الخاصة بالطبيب غير متاحة حاليًا. عد إلى مساحة العمل لمتابعة الجلسة النشطة.
- **Final Badini:** ئەڤ جهێ نوژداری ب مەبەست بەردەست نینە. ب ڤەگەرە بو جهێ کاری دا دانیشتنا چالاک بەردەوام بکەی.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 253. Saxlem Doctor Workspace

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `app`
- **Reviewed locale:** Badini
- **English source:** Saxlem Doctor Workspace
- **Final Arabic:** مساحة عمل الطبيب
- **Final Badini:** جهێ کارێ نوژداری یێ ساخلەم
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 254. Patients Today

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `patientsToday`
- **Reviewed locale:** Badini
- **English source:** Patients Today
- **Final Arabic:** مرضى اليوم
- **Final Badini:** نەخوشێن ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 255. Doctor session unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Doctor session unavailable
- **Final Arabic:** جلسة الطبيب غير متاحة.
- **Final Badini:** دانیشتنا نوژداری بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 256. This doctor workspace is not enabled. No clinical or queue information has been exposed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Badini
- **English source:** This doctor workspace is not enabled. No clinical or queue information has been exposed.
- **Final Arabic:** مساحة عمل الطبيب غير مفعّلة. لم يتم عرض أي معلومات سريرية أو معلومات عن قائمة الانتظار.
- **Final Badini:** ئەڤ جهێ کارێ نوژداری نەچالاککرییە. چ زانیاریێن پشکنینێ یان سرایێ نەهاتینە نیشاندان.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 257. Return to portal

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `returnHome`
- **Reviewed locale:** Badini
- **English source:** Return to portal
- **Final Arabic:** معلومات
- **Final Badini:** ب ڤەگەرە بو پۆرتالێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 258. Your current consultation and the next safe action.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Your current consultation and the next safe action.
- **Final Arabic:** الاستشارة الحالية والإجراء الآمن التالي.
- **Final Badini:** پشکنینا نوکە یا تە و کارێ پاراستی یێ ل دویفرا.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 259. Session Status

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `sessionStatus`
- **Reviewed locale:** Badini
- **English source:** Session Status
- **Final Arabic:** حالة الجلسة
- **Final Badini:** رەوشا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 260. Working session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `workingSession`
- **Reviewed locale:** Badini
- **English source:** Working session
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتنا کاری
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 261. Session state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `sessionState`
- **Reviewed locale:** Badini
- **English source:** Session state
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 262. Queue state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `queueState`
- **Reviewed locale:** Badini
- **English source:** Queue state
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 263. Total waiting patients

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `totalWaiting`
- **Reviewed locale:** Badini
- **English source:** Total waiting patients
- **Final Arabic:** معلومات
- **Final Badini:** کوی گشتی یێ نەخوشێن ل چاڤەرێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 264. Arrival state

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `arrivalState`
- **Reviewed locale:** Badini
- **English source:** Arrival state
- **Final Arabic:** معلومات
- **Final Badini:** رەوشا هاتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 265. Open Appointment Workspace

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `openAppointment`
- **Reviewed locale:** Badini
- **English source:** Open Appointment Workspace
- **Final Arabic:** فتح الموعد
- **Final Badini:** جهێ کارێ ژڤانێ ڤەکە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 266. Queue history

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `queueHistory`
- **Reviewed locale:** Badini
- **English source:** Queue history
- **Final Arabic:** معلومات
- **Final Badini:** مێژوویا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 267. Recent update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `recentUpdate`
- **Reviewed locale:** Badini
- **English source:** Recent update
- **Final Arabic:** معلومات
- **Final Badini:** نویکرنا دویماهیێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 268. No patients are currently ready

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `noWaiting`
- **Reviewed locale:** Badini
- **English source:** No patients are currently ready
- **Final Arabic:** معلومات
- **Final Badini:** نوکە چ نەخوش ئامادە نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 269. There is nothing to call from this workspace. Reception can continue managing arrivals safely.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `noWaitingBody`
- **Reviewed locale:** Badini
- **English source:** There is nothing to call from this workspace. Reception can continue managing arrivals safely.
- **Final Arabic:** لا يوجد مريض جاهز للاستدعاء من مساحة العمل هذه. يمكن للاستقبال متابعة إدارة حالات الوصول بأمان.
- **Final Badini:** ل ڤی جهێ کاری چ تشت بو بانگکرنێ نینە. پێشوازی دشێت ب پاراستی بەردەوام بیت د رێڤەبرنا هاتنان دا.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 270. Queue Health

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `queueHealth`
- **Reviewed locale:** Badini
- **English source:** Queue Health
- **Final Arabic:** حالة قائمة الانتظار
- **Final Badini:** رەوشا سرایێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 271. Several patients are waiting. Continue the current consultation normally.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `busyHelp`
- **Reviewed locale:** Badini
- **English source:** Several patients are waiting. Continue the current consultation normally.
- **Final Arabic:** هناك عدة مرضى في الانتظار. تابع الاستشارة الحالية بشكل طبيعي.
- **Final Badini:** چەند نەخوش ل چاڤەرێ نە. پشکنینا نوکە ب شێوەیەکێ ئاسایی بەردەوام بکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 272. Doctor delay

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `doctorDelay`
- **Reviewed locale:** Badini
- **English source:** Doctor delay
- **Final Arabic:** معلومات
- **Final Badini:** پاشکەفتنا نوژداری
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 273. Recent Session Activity

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `recentActivity`
- **Reviewed locale:** Badini
- **English source:** Recent Session Activity
- **Final Arabic:** نشاط الجلسة الأخير
- **Final Badini:** چالاکییا نویا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 274. Session started

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `sessionStarted`
- **Reviewed locale:** Badini
- **English source:** Session started
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتن دەستپێکر
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 275. Patient recalled

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `patientRecalled`
- **Reviewed locale:** Badini
- **English source:** Patient recalled
- **Final Arabic:** معلومات
- **Final Badini:** نەخوش دیسان هاتە بانگکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 276. Session paused

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `sessionPaused`
- **Reviewed locale:** Badini
- **English source:** Session paused
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتن بو دەمکی هاتە راگرتن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 277. Session resumed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `sessionResumed`
- **Reviewed locale:** Badini
- **English source:** Session resumed
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتن دیسان بەردەوام بوو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 278. Pause Session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `pauseSession`
- **Reviewed locale:** Badini
- **English source:** Pause Session
- **Final Arabic:** إيقاف الجلسة مؤقتاً
- **Final Badini:** دانیشتنێ بو دەمکی رابگرە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 279. Resume Session

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `resumeSession`
- **Reviewed locale:** Badini
- **English source:** Resume Session
- **Final Arabic:** استئناف الجلسة
- **Final Badini:** دانیشتنێ دیسان بەردەوام بکە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 280. Complete this consultation? The patient will leave the active queue.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `confirmComplete`
- **Reviewed locale:** Badini
- **English source:** Complete this consultation? The patient will leave the active queue.
- **Final Arabic:** معلومات
- **Final Badini:** تو دخوازی ڤێ پشکنینێ تەمام بکەی؟ نەخوش دێ ژ سرایا چالاک دەرکەڤیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 281. Finish this session? No further doctor actions will be available.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `confirmFinish`
- **Reviewed locale:** Badini
- **English source:** Finish this session? No further doctor actions will be available.
- **Final Arabic:** معلومات
- **Final Badini:** تو دخوازی ب ڤێ دانیشتنێ دووماهی بینی؟ پشتی هنگی چ کارێن دی یێن نوژداری بەردەست نابن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 282. {action}. Current patient: {patient}. Queue health: {health}.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `success`
- **Reviewed locale:** Badini
- **English source:** {action}. Current patient: {patient}. Queue health: {health}.
- **Final Arabic:** معلومات
- **Final Badini:** {action}. نەخوشێ نوکە: {patient}. رەوشا سرایێ: {health}.
- **Placeholders/interpolations:** {action}, {patient}, {health}
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 283. The action could not be completed. Existing queue state remains safe.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `operationFailed`
- **Reviewed locale:** Badini
- **English source:** The action could not be completed. Existing queue state remains safe.
- **Final Arabic:** معلومات
- **Final Badini:** کار نەشیا بهێتە تەمامکرن. رەوشا سرایێ یا نوکە پاراستی دمینیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 284. Not available in this Sprint

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `placeholderTitle`
- **Reviewed locale:** Badini
- **English source:** Not available in this Sprint
- **Final Arabic:** غير متاح في هذا الإصدار حاليًا.
- **Final Badini:** د ڤی وەشانێ دا بەردەست نینە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 285. This doctor destination is intentionally unavailable. Return to Workspace to continue the active session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor/presentation/messages.ts`
- **Localization key:** `placeholderBody`
- **Reviewed locale:** Badini
- **English source:** This doctor destination is intentionally unavailable. Return to Workspace to continue the active session.
- **Final Arabic:** هذه الوجهة الخاصة بالطبيب غير متاحة حاليًا. عد إلى مساحة العمل لمتابعة الجلسة النشطة.
- **Final Badini:** ئەڤ جهێ نوژداری ب مەبەست بەردەست نینە. ب ڤەگەرە بو جهێ کاری دا دانیشتنا چالاک بەردەوام بکەی.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor workspace or current-patient workflow.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Doctor Notifications

### 190. The patient is ready at reception.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `patientArrivedDescription`
- **Reviewed locale:** Arabic
- **English source:** The patient is ready at reception.
- **Final Arabic:** المريض جاهز لدى الاستقبال.
- **Final Badini:** نەخوش ل پێشوازیێ ئامادەیە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 191. Continue the current consultation. Reception will manage the queue.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `patientArrivedAction`
- **Reviewed locale:** Arabic
- **English source:** Continue the current consultation. Reception will manage the queue.
- **Final Arabic:** تابع الاستشارة الحالية. سيتولى الاستقبال إدارة قائمة الانتظار.
- **Final Badini:** پشکنینا نوکە بەردەوام بکە. پێشوازی دێ سرایێ رێڤەبەت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 192. The current queue is behind its expected pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `runningBehindDescription`
- **Reviewed locale:** Arabic
- **English source:** The current queue is behind its expected pace.
- **Final Arabic:** قائمة الانتظار الحالية أبطأ من الوتيرة المتوقعة.
- **Final Badini:** سرایا نوکە ژ خێراییا پێشبینی کری پاشکەفتییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 193. Continue safely and review the schedule before the next consultation.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `runningBehindAction`
- **Reviewed locale:** Arabic
- **English source:** Continue safely and review the schedule before the next consultation.
- **Final Arabic:** تابع العمل بأمان وراجع الجدول قبل الاستشارة التالية.
- **Final Badini:** ب پاراستی بەردەوام بە و بەری پشکنینا ل دویفرا خشتەیێ بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 194. Reception shared a read-only session update.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionDescription`
- **Reviewed locale:** Arabic
- **English source:** Reception shared a read-only session update.
- **Final Arabic:** شارك الاستقبال تحديثًا للجلسة مخصصًا للعرض فقط.
- **Final Badini:** پێشوازی نویکرنەکا دانیشتنێ یا تنێ بو خواندنێ بەلاڤ کر.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 195. Open the workspace when the consultation is ready to begin.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionAction`
- **Reviewed locale:** Arabic
- **English source:** Open the workspace when the consultation is ready to begin.
- **Final Arabic:** افتح مساحة العمل عندما تصبح الاستشارة جاهزة للبدء.
- **Final Badini:** دەمێ پشکنین بو دەستپێکرنێ ئامادە بیت، جهێ کاری ڤەکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 196. A scheduled break is approaching.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `breakDescription`
- **Reviewed locale:** Arabic
- **English source:** A scheduled break is approaching.
- **Final Arabic:** تقترب فترة الاستراحة المجدولة.
- **Final Badini:** بێهنڤەدانا دیارکری نێزیکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 197. Review the schedule before the break.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `breakAction`
- **Reviewed locale:** Arabic
- **English source:** Review the schedule before the break.
- **Final Arabic:** راجع الجدول قبل الاستراحة.
- **Final Badini:** بەری بێهنڤەدانێ خشتەیێ بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 198. The appointment time was updated.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledDescription`
- **Reviewed locale:** Arabic
- **English source:** The appointment time was updated.
- **Final Arabic:** تم تحديث وقت الموعد.
- **Final Badini:** دەمێ ژڤانێ هاتە نویکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 199. Review the updated appointment context.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledAction`
- **Reviewed locale:** Arabic
- **English source:** Review the updated appointment context.
- **Final Arabic:** راجع معلومات الموعد المحدّثة.
- **Final Badini:** زانیاریێن نویکری یێن ژڤانێ بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 200. Clinic management published a staff notice.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `announcementDescription`
- **Reviewed locale:** Arabic
- **English source:** Clinic management published a staff notice.
- **Final Arabic:** نشرت إدارة العيادة إعلانًا للموظفين.
- **Final Badini:** رێڤەبەرییا کلینیکێ راگەهاندنەک بو کارمەندان بەلاڤ کر.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 201. No action is needed during the current consultation.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `announcementAction`
- **Reviewed locale:** Arabic
- **English source:** No action is needed during the current consultation.
- **Final Arabic:** لا يلزم اتخاذ أي إجراء أثناء الاستشارة الحالية.
- **Final Badini:** د پشکنینا نوکە دا چ کار پێدڤی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 202. Session update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericTitle`
- **Reviewed locale:** Arabic
- **English source:** Session update
- **Final Arabic:** تحديث الجلسة
- **Final Badini:** نویکرنا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 203. A read-only session update is available.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericDescription`
- **Reviewed locale:** Arabic
- **English source:** A read-only session update is available.
- **Final Arabic:** يتوفر تحديث جديد للجلسة للعرض فقط.
- **Final Badini:** نویکرنەکا نوی یا دانیشتنێ بو خواندنێ تنێ بەردەستە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 204. Review the related workspace when safe.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericAction`
- **Reviewed locale:** Arabic
- **English source:** Review the related workspace when safe.
- **Final Arabic:** راجع مساحة العمل ذات الصلة عندما يكون ذلك آمنًا.
- **Final Badini:** دەمێ پاراستی بیت، جهێ کارێ پەیوەندیدار بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 205. Notifications unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Arabic
- **English source:** Notifications unavailable
- **Final Arabic:** الإشعارات غير متاحة.
- **Final Badini:** ئاگەهداری بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 206. Doctor notifications cannot be loaded. No notification state was changed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `unavailableBody`
- **Reviewed locale:** Arabic
- **English source:** Doctor notifications cannot be loaded. No notification state was changed.
- **Final Arabic:** تعذر تحميل إشعارات الطبيب. لم يتم تغيير حالة أي إشعار.
- **Final Badini:** بارکرنا ئاگەهداریێن نوژداری سەرنەکەفت. رەوشا چ ئاگەهدارییەکێ نەهاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 207. The notification could not be opened. Existing read state remains safe.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `failure`
- **Reviewed locale:** Arabic
- **English source:** The notification could not be opened. Existing read state remains safe.
- **Final Arabic:** تعذر فتح الإشعار. لم يتم إجراء أي تغيير على حالة القراءة الحالية.
- **Final Badini:** ئاگەهداری نەشیا بهێتە ڤەکرن. رەوشا خواندنێ یا نوکە پاراستی دمینیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 208. Read-only updates that affect your current clinic session.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `subtitle`
- **Reviewed locale:** Badini
- **English source:** Read-only updates that affect your current clinic session.
- **Final Arabic:** تحديثات للقراءة فقط تؤثر في جلسة العيادة الحالية.
- **Final Badini:** نویکرنێن تنێ بو خواندنێ کو کارتێکرن ل دانیشتنا کلینیکا نوکە یا تە دکەن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 209. Unread count

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `unreadCount`
- **Reviewed locale:** Badini
- **English source:** Unread count
- **Final Arabic:** غير المقروء
- **Final Badini:** ژمارا نەڤەکرییان
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 210. Today's notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `todayCount`
- **Reviewed locale:** Badini
- **English source:** Today's notifications
- **Final Arabic:** إشعارات اليوم
- **Final Badini:** ئاگەهداریێن ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 211. Last updated

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `lastUpdated`
- **Reviewed locale:** Badini
- **English source:** Last updated
- **Final Arabic:** آخر تحديث
- **Final Badini:** دووماهیک نویکرن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 212. Unread Notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `unread`
- **Reviewed locale:** Badini
- **English source:** Unread Notifications
- **Final Arabic:** الإشعارات غير المقروءة
- **Final Badini:** ئاگەهداریێن نەڤەکری
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 213. Today's Notifications

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `today`
- **Reviewed locale:** Badini
- **English source:** Today's Notifications
- **Final Arabic:** إشعارات اليوم
- **Final Badini:** ئاگەهداریێن ئەڤرو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 214. Open notification: {title}

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `openNotification`
- **Reviewed locale:** Badini
- **English source:** Open notification: {title}
- **Final Arabic:** معلومات
- **Final Badini:** ئاگەهداریێ ڤەکە: {title}
- **Placeholders/interpolations:** {title}
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 215. What happened

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `whatHappened`
- **Reviewed locale:** Badini
- **English source:** What happened
- **Final Arabic:** ماذا حدث
- **Final Badini:** چ چێبوو
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 216. Why

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `why`
- **Reviewed locale:** Badini
- **English source:** Why
- **Final Arabic:** السبب
- **Final Badini:** بوچی
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 217. Recommended action

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `recommendedAction`
- **Reviewed locale:** Badini
- **English source:** Recommended action
- **Final Arabic:** الإجراء المقترح
- **Final Badini:** کارێ پێشنیارکری
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 218. Related links

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `relatedLinks`
- **Reviewed locale:** Badini
- **English source:** Related links
- **Final Arabic:** روابط ذات صلة
- **Final Badini:** گرێدانێن پەیوەندیدار
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 219. The patient is ready at reception.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `patientArrivedDescription`
- **Reviewed locale:** Badini
- **English source:** The patient is ready at reception.
- **Final Arabic:** المريض جاهز لدى الاستقبال.
- **Final Badini:** نەخوش ل پێشوازیێ ئامادەیە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 220. Reception recorded the patient's arrival.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `patientArrivedWhat`
- **Reviewed locale:** Badini
- **English source:** Reception recorded the patient's arrival.
- **Final Arabic:** معلومات
- **Final Badini:** پێشوازی هاتنا نەخوشی تومار کر.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 221. The appointment is approaching and the patient is ready.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `patientArrivedWhy`
- **Reviewed locale:** Badini
- **English source:** The appointment is approaching and the patient is ready.
- **Final Arabic:** معلومات
- **Final Badini:** ژڤان نێزیکە و نەخوش ئامادەیە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 222. Session running behind

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `runningBehind`
- **Reviewed locale:** Badini
- **English source:** Session running behind
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتن پاشکەفتییە
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 223. The current queue is behind its expected pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `runningBehindDescription`
- **Reviewed locale:** Badini
- **English source:** The current queue is behind its expected pace.
- **Final Arabic:** قائمة الانتظار الحالية أبطأ من الوتيرة المتوقعة.
- **Final Badini:** سرایا نوکە ژ خێراییا پێشبینی کری پاشکەفتییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 224. The current session is exceeding its planned pace.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `runningBehindWhy`
- **Reviewed locale:** Badini
- **English source:** The current session is exceeding its planned pace.
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتنا نوکە ژ خێراییا پلانکری پاشکەفتییە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 225. Reception update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionUpdate`
- **Reviewed locale:** Badini
- **English source:** Reception update
- **Final Arabic:** معلومات
- **Final Badini:** نویکرنا پێشوازیێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 226. Reception shared a read-only session update.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionDescription`
- **Reviewed locale:** Badini
- **English source:** Reception shared a read-only session update.
- **Final Arabic:** شارك الاستقبال تحديثًا للجلسة مخصصًا للعرض فقط.
- **Final Badini:** پێشوازی نویکرنەکا دانیشتنێ یا تنێ بو خواندنێ بەلاڤ کر.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 227. Reception confirmed the morning arrival.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionWhat`
- **Reviewed locale:** Badini
- **English source:** Reception confirmed the morning arrival.
- **Final Arabic:** معلومات
- **Final Badini:** پێشوازی هاتنا سپێدێ پشتراست کر.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 228. The doctor may begin the session when ready.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionWhy`
- **Reviewed locale:** Badini
- **English source:** The doctor may begin the session when ready.
- **Final Arabic:** معلومات
- **Final Badini:** نوژدار دشێت دەمێ ئامادە بیت دانیشتنێ دەستپێبکەت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 229. Open the workspace when the consultation is ready to begin.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `receptionAction`
- **Reviewed locale:** Badini
- **English source:** Open the workspace when the consultation is ready to begin.
- **Final Arabic:** افتح مساحة العمل عندما تصبح الاستشارة جاهزة للبدء.
- **Final Badini:** دەمێ پشکنین بو دەستپێکرنێ ئامادە بیت، جهێ کاری ڤەکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 230. Break reminder

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `breakReminder`
- **Reviewed locale:** Badini
- **English source:** Break reminder
- **Final Arabic:** معلومات
- **Final Badini:** بیرئینانا بێهنڤەدانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 231. Review the schedule before the break.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `breakAction`
- **Reviewed locale:** Badini
- **English source:** Review the schedule before the break.
- **Final Arabic:** راجع الجدول قبل الاستراحة.
- **Final Badini:** بەری بێهنڤەدانێ خشتەیێ بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 232. The appointment time was updated.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledDescription`
- **Reviewed locale:** Badini
- **English source:** The appointment time was updated.
- **Final Arabic:** تم تحديث وقت الموعد.
- **Final Badini:** دەمێ ژڤانێ هاتە نویکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 233. Reception changed the scheduled appointment time.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledWhat`
- **Reviewed locale:** Badini
- **English source:** Reception changed the scheduled appointment time.
- **Final Arabic:** معلومات
- **Final Badini:** پێشوازی دەمێ ژڤانا دیارکری گهوراند.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 234. The patient requested a different available time.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledWhy`
- **Reviewed locale:** Badini
- **English source:** The patient requested a different available time.
- **Final Arabic:** معلومات
- **Final Badini:** نەخوشی دەمەکێ بەردەست یێ دی خواست.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 235. Review the updated appointment context.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `rescheduledAction`
- **Reviewed locale:** Badini
- **English source:** Review the updated appointment context.
- **Final Arabic:** راجع معلومات الموعد المحدّثة.
- **Final Badini:** زانیاریێن نویکری یێن ژڤانێ بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 236. Working doctors should be aware of the update.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `announcementWhy`
- **Reviewed locale:** Badini
- **English source:** Working doctors should be aware of the update.
- **Final Arabic:** معلومات
- **Final Badini:** نوژدارێن د کار دا پێدڤییە ژ ڤێ نویکرنێ ئاگەهدار بن.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 237. No action is needed during the current consultation.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `announcementAction`
- **Reviewed locale:** Badini
- **English source:** No action is needed during the current consultation.
- **Final Arabic:** لا يلزم اتخاذ أي إجراء أثناء الاستشارة الحالية.
- **Final Badini:** د پشکنینا نوکە دا چ کار پێدڤی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 238. Session update

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericTitle`
- **Reviewed locale:** Badini
- **English source:** Session update
- **Final Arabic:** تحديث الجلسة
- **Final Badini:** نویکرنا دانیشتنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 239. The clinic session changed.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericWhat`
- **Reviewed locale:** Badini
- **English source:** The clinic session changed.
- **Final Arabic:** معلومات
- **Final Badini:** دانیشتنا کلینیکێ هاتە گهورین.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 240. Review the related workspace when safe.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `genericAction`
- **Reviewed locale:** Badini
- **English source:** Review the related workspace when safe.
- **Final Arabic:** راجع مساحة العمل ذات الصلة عندما يكون ذلك آمنًا.
- **Final Badini:** دەمێ پاراستی بیت، جهێ کارێ پەیوەندیدار بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 241. Notifications unavailable

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Notifications unavailable
- **Final Arabic:** الإشعارات غير متاحة.
- **Final Badini:** ئاگەهداری بەردەست نینن
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 242. The notification could not be opened. Existing read state remains safe.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/doctor-notifications/presentation/messages.ts`
- **Localization key:** `failure`
- **Reviewed locale:** Badini
- **English source:** The notification could not be opened. Existing read state remains safe.
- **Final Arabic:** تعذر فتح الإشعار. لم يتم إجراء أي تغيير على حالة القراءة الحالية.
- **Final Badini:** ئاگەهداری نەشیا بهێتە ڤەکرن. رەوشا خواندنێ یا نوکە پاراستی دمینیت.
- **Placeholders/interpolations:** None
- **Context:** Shown in the doctor notification workspace.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Billing

### 286. Select an authoritative organization before viewing global billing.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `chooseOrganizationHelp`
- **Reviewed locale:** Arabic
- **English source:** Select an authoritative organization before viewing global billing.
- **Final Arabic:** اختر مؤسسة معتمدة قبل عرض الفوترة العامة.
- **Final Badini:** بەری دیتنا حیسابکرنا گشتی، رێکخراوەکا دەستهەلاتدار ب هەلبژێرە.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 287. Finalize this statement?

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `finalizeTitle`
- **Reviewed locale:** Arabic
- **English source:** Finalize this statement?
- **Final Arabic:** هل تريد اعتماد كشف الحساب نهائيًا؟
- **Final Badini:** تو دخوازی کەشفا حیسابێ ب دووماهی بینی؟
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 288. The figures will become an immutable snapshot. This is not a payment or settlement action.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `finalizeHelp`
- **Reviewed locale:** Arabic
- **English source:** The figures will become an immutable snapshot. This is not a payment or settlement action.
- **Final Arabic:** ستصبح هذه الأرقام نسخة ثابتة غير قابلة للتغيير. هذا الإجراء لا يمثل عملية دفع أو تسوية.
- **Final Badini:** ژمارە دێ ببنە وێنەیەکا نەگهور. ئەڤە کارەکێ پارەدانێ یان رێکخستنا پارەیی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 289. Overview

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `overview`
- **Reviewed locale:** Badini
- **English source:** Overview
- **Final Arabic:** نظرة عامة
- **Final Badini:** پوختە
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 290. Select an authoritative organization before viewing global billing.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `chooseOrganizationHelp`
- **Reviewed locale:** Badini
- **English source:** Select an authoritative organization before viewing global billing.
- **Final Arabic:** اختر مؤسسة معتمدة قبل عرض الفوترة العامة.
- **Final Badini:** بەری دیتنا حیسابکرنا گشتی، رێکخراوەکا دەستهەلاتدار ب هەلبژێرە.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 291. You do not have access to this billing information.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `forbidden`
- **Reviewed locale:** Badini
- **English source:** You do not have access to this billing information.
- **Final Arabic:** ليس لديك صلاحية لعرض معلومات الفوترة.
- **Final Badini:** دەستویری تە بو دیتنا ڤان زانیاریێن حیسابکرنێ نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 292. Period

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `period`
- **Reviewed locale:** Badini
- **English source:** Period
- **Final Arabic:** الفترة
- **Final Badini:** ماوە
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 293. Qualifying appointments

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `qualifying`
- **Reviewed locale:** Badini
- **English source:** Qualifying appointments
- **Final Arabic:** المواعيد المؤهلة
- **Final Badini:** ژڤانێن گونجای
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 294. Reversal count

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `reversalCount`
- **Reviewed locale:** Badini
- **English source:** Reversal count
- **Final Arabic:** عدد العكس
- **Final Badini:** ژمارا ڤەگەراندنان
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 295. Reversed

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `reversed`
- **Reviewed locale:** Badini
- **English source:** Reversed
- **Final Arabic:** معكوسة
- **Final Badini:** ڤەگەراندی
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 296. View statement

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `view`
- **Reviewed locale:** Badini
- **English source:** View statement
- **Final Arabic:** عرض الكشف
- **Final Badini:** کەشفا حیسابێ ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 297. The figures will become an immutable snapshot. This is not a payment or settlement action.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `finalizeHelp`
- **Reviewed locale:** Badini
- **English source:** The figures will become an immutable snapshot. This is not a payment or settlement action.
- **Final Arabic:** ستصبح هذه الأرقام نسخة ثابتة غير قابلة للتغيير. هذا الإجراء لا يمثل عملية دفع أو تسوية.
- **Final Badini:** ژمارە دێ ببنە وێنەیەکا نەگهور. ئەڤە کارەکێ پارەدانێ یان رێکخستنا پارەیی نینە.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 298. Plan code

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `planCode`
- **Reviewed locale:** Badini
- **English source:** Plan code
- **Final Arabic:** معلومات
- **Final Badini:** کودێ پلانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 299. Plan name

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `planName`
- **Reviewed locale:** Badini
- **English source:** Plan name
- **Final Arabic:** معلومات
- **Final Badini:** ناڤێ پلانێ
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 300. Plan assigned.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `assigned`
- **Reviewed locale:** Badini
- **English source:** Plan assigned.
- **Final Arabic:** معلومات
- **Final Badini:** پلان هاتە دیارکرن.
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 301. Read-only billing

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/billing/presentation/messages.ts`
- **Localization key:** `readOnly`
- **Reviewed locale:** Badini
- **English source:** Read-only billing
- **Final Arabic:** فوترة للقراءة فقط
- **Final Badini:** حیسابکرنا تنێ بو خواندنێ
- **Placeholders/interpolations:** None
- **Context:** Shown in billing, plan, commission, or statement workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Organizations

### 302. View the organizations currently registered with Saxlem.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `organizationsHelp`
- **Reviewed locale:** Badini
- **English source:** View the organizations currently registered with Saxlem.
- **Final Arabic:** عرض المؤسسات المسجلة حالياً في ساكلم.
- **Final Badini:** رێکخراوێن نوکە تومارکری ل ساخلەم ببینە.
- **Placeholders/interpolations:** None
- **Context:** Shown while listing or managing organizations.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 303. View organization

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `viewOrganization`
- **Reviewed locale:** Badini
- **English source:** View organization
- **Final Arabic:** عرض المؤسسة
- **Final Badini:** رێکخراوی ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown while listing or managing organizations.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Clinics/onboarding

### 304. View clinics across registered organizations.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `clinicsHelp`
- **Reviewed locale:** Badini
- **English source:** View clinics across registered organizations.
- **Final Arabic:** عرض العيادات التابعة للمؤسسات المسجلة.
- **Final Badini:** کلینیکێن د رێکخراوێن تومارکری دا ببینە.
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 305. View clinic

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `viewClinic`
- **Reviewed locale:** Badini
- **English source:** View clinic
- **Final Arabic:** عرض العيادة
- **Final Badini:** کلینیکێ ببینە
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 307. Use 2–32 letters, numbers, underscores, or hyphens.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `invalidCode`
- **Reviewed locale:** Badini
- **English source:** Use 2–32 letters, numbers, underscores, or hyphens.
- **Final Arabic:** استخدم من 2 إلى 32 حرفاً أو رقماً أو _ أو -.
- **Final Badini:** 2–32 پیت، ژمارە، _ یان - بکاربینە.
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 308. Enter an IANA timezone such as Asia/Baghdad.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `invalidTimezone`
- **Reviewed locale:** Badini
- **English source:** Enter an IANA timezone such as Asia/Baghdad.
- **Final Arabic:** أدخل منطقة زمنية مثل Asia/Baghdad.
- **Final Badini:** ناوچەیا دەمێ یا IANA وەک Asia/Baghdad بنڤیسە.
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 309. That clinic code is already used in this organization.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `duplicateClinicCode`
- **Reviewed locale:** Badini
- **English source:** That clinic code is already used in this organization.
- **Final Arabic:** رمز العيادة مستخدم بالفعل في هذه المؤسسة.
- **Final Badini:** ئەو کودێ کلینیکێ ژبەری د ڤی رێکخراوی دا هاتیە بکارئینان.
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 314. Back to clinics

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `backToClinics`
- **Reviewed locale:** Badini
- **English source:** Back to clinics
- **Final Arabic:** العودة إلى العيادات
- **Final Badini:** ب ڤەگەرە بو کلینیکان
- **Placeholders/interpolations:** None
- **Context:** Shown while listing, validating, or onboarding clinics.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Administration

### 306. The value is too long.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `maximumLength`
- **Reviewed locale:** Badini
- **English source:** The value is too long.
- **Final Arabic:** القيمة طويلة جداً.
- **Final Badini:** بها زۆر درێژە.
- **Placeholders/interpolations:** None
- **Context:** Shown in platform administration workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 310. Saxlem services are temporarily unavailable.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `unavailable`
- **Reviewed locale:** Badini
- **English source:** Saxlem services are temporarily unavailable.
- **Final Arabic:** خدمات ساكلم غير متاحة مؤقتاً.
- **Final Badini:** خزمەتگوزاریێن ساخلەم بو دەمکی بەردەست نینن.
- **Placeholders/interpolations:** None
- **Context:** Shown in platform administration workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 311. This information conflicts with an existing record.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `conflict`
- **Reviewed locale:** Badini
- **English source:** This information conflicts with an existing record.
- **Final Arabic:** تتعارض هذه المعلومات مع سجل موجود.
- **Final Badini:** ئەڤ زانیاری ل گەل تومارەکێ هەیی ناکۆکە.
- **Placeholders/interpolations:** None
- **Context:** Shown in platform administration workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 312. Review the highlighted information.

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `validation`
- **Reviewed locale:** Badini
- **English source:** Review the highlighted information.
- **Final Arabic:** راجع المعلومات المحددة.
- **Final Badini:** زانیاریێن دیارکری بپشکنە.
- **Placeholders/interpolations:** None
- **Context:** Shown in platform administration workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.

### 313. Please correct the following:

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Clinic Portal
- **Source file/module:** `clinic-portal/src/features/administration/presentation/messages.ts`
- **Localization key:** `errorSummary`
- **Reviewed locale:** Badini
- **English source:** Please correct the following:
- **Final Arabic:** يرجى تصحيح ما يلي:
- **Final Badini:** هیڤییە ئەڤێن ل خوارێ راست بکە:
- **Placeholders/interpolations:** None
- **Context:** Shown in platform administration workflows.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.


## Authentication

### 318. 750 123 4567

- **Final status:** `APPROVED_APPLIED`
- **Surface:** Flutter
- **Source file/module:** `mobile/lib/l10n/app_ku.arb`
- **Localization key:** `phoneHint`
- **Reviewed locale:** Badini
- **English source:** 750 123 4567
- **Final Arabic:** معلومات
- **Final Badini:** 750 123 4567
- **Placeholders/interpolations:** None
- **Context:** Shown during phone-number entry or authentication.
- **Certification note:** The exact product-owner-approved locale value was applied and verified.
