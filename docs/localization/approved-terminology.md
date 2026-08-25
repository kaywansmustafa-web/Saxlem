# Approved Terminology

This document is the durable source of truth for Saxlem English, Arabic, and Badini product language. Product-owner-approved wording must not be silently normalized or respelled.

## Policy

- English is the canonical source language.
- Portal routes use `en`, `ar`, and `ku`. Flutter runtime and persisted selections remain `en`, `ar_IQ`, and `ku_IQ`; generated ARB resources use their `ar`/`ku` language identifiers and resolve the Iraq locales by language code. Arabic and Badini both render right-to-left.
- Badini user-interface copy uses Arabic script only. Latin text is limited to technical values such as URLs, email addresses, UUIDs, API identifiers, IANA timezones, stable codes, product versions, and data-supplied proper names.
- ICU syntax, placeholders, interpolation variables, and escaping must be preserved exactly.
- New strings require English source copy, Arabic and Arabic-script Badini translations, parity tests, RTL review, accessibility review, and native-language review before merge.

## Approved mappings

| English | Arabic | Badini |
|---|---|---|
| 6-digit verification code | رمز تحقق مكوّن من 6 أرقام | کودێ پشتراستکرنێ یێ 6 ژمارەیی |
| A new clinic-wide notice is available. | ? | راگەهاندنەکا نوی بو کلینیکێ بەردەستە. |
| A patient account is required. | ? | هژمارا نەخوشی پێدڤییە. |
| A patient is already current. | ? | نەخوشەک ژبەری نوکە هەیە. |
| A read-only session update is available. | ? | نویکرنەکا نوی یا دانیشتنێ بو خواندنێ تنێ بەردەستە. |
| A scheduled break is approaching. | ? | بێهنڤەدانا دیارکری نێزیکە. |
| A scheduled lunch break appears in today’s timeline. | ? | بێهنڤەدانا خوارنێ یا دیارکری د خشتەیا ئەڤرو دا دیارە. |
| About Saxlem | حول ساخلەم | دەربارەی ساخلەم |
| About {minutes} minutes | نحو {minutes} دقيقة | نێزیکی {minutes} خولەکان |
| Action | الإجراء | کار |
| Active | نشط | چالاک |
| Active clinic | ? | کلینیکا چالاک |
| Active organization | ? | رێکخراوا چالاک |
| Add family member | إضافة فرد من العائلة | ئەندامەکێ خێزانێ زێدە بکە |
| Administration | الإدارة | رێڤەبەری |
| Administration overview | نظرة عامة على الإدارة | پوختەیا رێڤەبەریێ |
| Affected appointment | ? | ژڤانێ پەیوەندیدار |
| Affected patient | ? | نەخوشێ پەیوەندیدار |
| Age | العمر | تەمەن |
| Alerts | التنبيهات | ئاگەهداری |
| Application preferences | تفضيلات التطبيق | هەلبژارتنێن بەرنامەی |
| Apply filters | تطبيق عوامل التصفية | جوداکرنێ جێبەجێ بکە |
| Appointment | الموعد | ژڤان |
| Appointment confirmed | تم تأكيد الموعد | ژڤان هاتە پشتراستکرن |
| Appointment context | سياق الموعد | زانیاریێن ژڤانی |
| Appointment created | تم إنشاء الموعد | ژڤان هاتە دروستکرن |
| Appointment details | تفاصيل الموعد | هویرکاتیێن ژڤانێ |
| Appointment ID | رقم الموعد | ژمارا ژڤانێ |
| Appointment notifications | إشعارات المواعيد | ئاگەهداریێن ژڤانان |
| Appointment reason | سبب الموعد | ئەگەرێ ژڤانێ |
| Appointment reference | مرجع الموعد | ناسناما ژڤانێ |
| Appointment reminder | تذكير بالموعد | بیرئینانا ژڤانێ |
| Appointment rescheduled | تم تغيير موعد الحجز | دەمێ ژڤانێ هاتە گهورین |
| Appointment status | حالة الموعد | رەوشا ژڤانێ |
| Appointment time | وقت الموعد | دەمێ ژڤانێ |
| Appointment type | نوع الموعد | جورێ ژڤانێ |
| Appointment updated | تم تحديث الموعد | ژڤان هاتە نویکرن |
| Appointments | المواعيد | ژڤان |
| Appointments are temporarily unavailable. | ? | ژڤان بو دەمکی بەردەست نینن |
| Appointments today | مواعيد اليوم | ژڤانێن ئەڤرو |
| Arabic | العربية | عەرەبی |
| Arrival | الوصول | هاتن |
| Arrival not recorded | لم يتم تسجيل الوصول | هاتن نەهاتە تومارکرن |
| Arrival recorded | تم تسجيل الوصول | هاتن هاتە تومارکرن |
| Arrival status | حالة الوصول | رەوشا هاتنێ |
| Arrival time | وقت الوصول | دەمێ هاتنێ |
| Arrived | وصل | گەهشت |
| Assign plan | تعيين الخطة | پلانێ دیار بکە |
| Availability | ? | ژڤانێن بەردەست |
| Availability in booking context | المواعيد المتاحة | ? |
| Availability Summary | ملخص التوفر | پوختەیا بەردەستبوونێ |
| Available | متاح | بەردەست |
| Average wait | متوسط الانتظار | تێکڕا چاڤەرێکرنێ |
| Back | رجوع | ب ڤەگەرە |
| Back to billing | العودة إلى الفوترة | ب ڤەگەرە بو حیسابکرنێ |
| Back to organizations | العودة إلى المؤسسات | ب ڤەگەرە بو رێکخراوان |
| Badini Kurdish | الكردية البادينية | کوردی بادینی |
| Billing | الفوترة | حیسابکرن |
| Billing information | معلومات الفوترة | زانیاریێن حیسابکرنێ |
| Billing is unavailable. Try again. | ? | حیسابکرن بەردەست نینە. دیسان هەول بدە. |
| Billing overview | نظرة عامة على الفوترة | پوختەیا حیسابکرنێ |
| Billing plan | خطة الفوترة | پلانا حیسابکرنێ |
| Billing records only. No payment or settlement is collected here. | ? | ئەڤە تنێ تومارێن حیسابکرنێ نە. ل ڤێرێ چ پارەدان یان رێکخستنا پارەیی ناهێتە ئەنجامدان. |
| Billing rule | قاعدة الفوترة | یاسایا حیسابکرنێ |
| Billing timezone | المنطقة الزمنية للفوترة | ناوچەیا دەمێ حیسابکرنێ |
| Billing unavailable | الفوترة غير متاحة حاليًا | حیسابکرن نەبەردەستە |
| Book | احجز | ژڤانی بگرە |
| Book again | احجز مجددًا | دووبارە ژڤانی بگرە |
| Book appointment | حجز موعد | ژڤانی بگرە |
| Booking | الحجز | گرتنا ژڤانی |
| Booking for | الحجز لـ | ژڤان بو |
| Booking unavailable | الحجز غير متاح | گرتنا ژڤانی بەردەست نینە |
| Break | استراحة | بێهنڤەدان |
| Breaks | فترات الاستراحة | بێهنڤەدان |
| Build mode | وضع الإصدار | شێوازێ وەشانێ |
| Busy | مشغول | مژویل |
| Call next | استدعاء المريض التالي | نەخوشێ ل دویفرا بانگ بکە |
| Called | تم الاستدعاء | هاتە بانگکرن |
| Cancel | إلغاء | ب هەلوەشینە |
| Cancellation reason | سبب الإلغاء | ئەگەرێ هەلوەشاندنێ |
| Cancelled | ملغى | هەلوەشای |
| Cancelled appointments | المواعيد الملغاة | ژڤانێن هەلوەشای |
| Change language | تغيير اللغة | زمانی بگهورە |
| Check availability | تحقق من المواعيد المتاحة | ژڤانێن بەردەست ب پشکنە |
| Check the information and try again. | ? | زانیارییان بپشکنە و دیسان هەول بدە |
| Check the name, phone number, or patient ID and try again. | ? | ناڤ، ژمارا موبایلێ یان ژمارا نەخوشی بپشکنە و دیسان هەول بدە |
| Check the patient, doctor, phone, or appointment ID. | ? | نەخوش، نوژدار، ژمارا موبایلێ یان ژمارا ژڤانێ بپشکنە |
| Check your booking details and try again. | ? | هویرکاتیێن گرتنا ژڤانی بپشکنە و دیسان هەول بدە |
| Check your connection and try again. | ? | پەیوەندییا ئینتەرنێتێ بپشکنە و دیسان هەول بدە. |
| Checked in | تم تسجيل الوصول | هاتن هاتە تومارکرن |
| Checked-in patients | المرضى المسجل وصولهم | نەخوشێن هاتن تۆمارکری |
| Choose a clinic | اختر العيادة | کلینیکەکێ ب هەلبژێرە |
| Choose a date | اختر التاريخ | رێکەفتەکێ ب هەلبژێرە |
| Choose a new date and time | اختر تاريخًا ووقتًا جديدين | رێکەفت و دەمەکێ نوی ب هەلبژێرە |
| Choose a notification to view its details. | ? | ئاگەهدارییەکێ ب هەلبژێرە دا هویرکاتیێن وێ ببینی. |
| Choose a time | اختر الوقت | دەمەکی ب هەلبژێرە |
| Choose an organization | اختر مؤسسة | رێکخراوەکێ ب هەلبژێرە |
| Choose patient | اختر المريض | نەخوشەکی ب هەلبژێرە |
| Choose real dates and make sure From is not after To. | ? | رێکەفتێن دروست ب هەلبژێرە و پشتراست بکە رێکەفتا دەستپێکێ پشتی رێکەفتا دووماهیێ نەبیت |
| Choose your language | اختر لغتك | زمانێ خو ب هەلبژێرە |
| Clear filters | مسح عوامل التصفية | جوداکرنێ پاک بکە |
| Clear search | مسح البحث | گەریانێ پاک بکە |
| Clinic | العيادة | کلینیک |
| Clinic announcement | إعلان من العيادة | راگەهاندنا کلینیکێ |
| Clinic announcements | إعلانات العيادة | راگەهاندنێن کلینیکێ |
| Clinic breakdown | تفصيل حسب العيادة | جوداکرنا کلینیکان |
| Clinic code | رمز العيادة | کودێ کلینیکێ |
| Clinic created | تم إنشاء العيادة | کلینیک هاتە دروستکرن |
| Clinic information | معلومات العيادة | زانیاریێن کلینیکێ |
| Clinic management published a staff notice. | ? | رێڤەبەرییا کلینیکێ راگەهاندنەک بو کارمەندان بەلاڤ کر. |
| Clinic manager | مدير العيادة | رێڤەبەرێ کلینیکێ |
| Clinic name | اسم العيادة | ناڤێ کلینیکێ |
| Clinic onboarding | إضافة العيادة | زێدەکرنا کلینیکێ |
| Clinic open | العيادة مفتوحة | کلینیک ڤەکرییە |
| Clinics | العيادات | کلینیک |
| Clinics in organization | عيادات المؤسسة | کلینیکێن رێکخراوێ |
| Close | إغلاق | بگرە |
| Close navigation | إغلاق قائمة التنقل | رێنیشاندانێ بگرە |
| Close queue | إغلاق قائمة الانتظار | رێزبەندیێ بگرە |
| Closed | مغلق | گرتی |
| Commission | العمولة | کومیسیون |
| Commission amount | قيمة العمولة | بهایێ کومیسیونێ |
| Commissions | العمولات | کومیسیون |
| Complete consultation | إكمال الاستشارة | پشکنینێ تەمام بکە |
| Completed | مكتمل | تەمامبووی |
| Completed appointments | المواعيد المكتملة | ژڤانێن تەمامبووی |
| Completion date | تاريخ الإكمال | رێکەفتا تەمامبوونێ |
| Confirm | تأكيد | پشتراست بکە |
| Confirm appointment | تأكيد الموعد | ژڤانێ پشتراست بکە |
| Confirm arrival | تأكيد الوصول | هاتنێ پشتراست بکە |
| Confirm cancellation | تأكيد الإلغاء | هەلوەشاندنێ پشتراست بکە |
| Confirm finalization | تأكيد الاعتماد النهائي | دووماهی هاتنێ پشتراست بکە |
| Confirmed | مؤكد | پشتڕاستکری |
| Consultation | الاستشارة | پشکنین |
| Consultation completed | اكتملت الاستشارة | پشکنین تەمام بوو |
| Consultation elapsed | الوقت المنقضي للاستشارة | دەمێ بوری یێ پشکنینێ |
| Consultation started | بدأت الاستشارة | پشکنین دەستپێکر |
| Consultations are taking longer than scheduled. | ? | پشکنین ژ دەمێ دیارکری پتر دەم دخوازن. |
| Continue | متابعة | بەردەوام بە |
| Continue as Guest | المتابعة كضيف | وەک مێهڤان بەردەوام بە |
| Continue safely and review the schedule before the next consultation. | ? | ب پاراستی بەردەوام بە و بەری پشکنینا ل دویفرا خشتەیێ بپشکنە. |
| Continue the current consultation. Reception will manage the queue. | ? | پشکنینا نوکە بەردەوام بکە. پێشوازی دێ سرایێ رێڤەبەت. |
| Country | الدولة | وەلات |
| Create | إنشاء | دروستبکە |
| Creating | جارٍ الإنشاء… | دهێتە دروستکرن… |
| Current arrival state | حالة الوصول الحالية | رەوشا هاتنا نوکە |
| Current consultation | الاستشارة الحالية | پشکنینا نوکە |
| Current number | الرقم الحالي | ژمارا نوکە |
| Current patient | المريض الحالي | نەخوشێ نوکە |
| Current plan | الخطة الحالية | پلانا نوکە |
| Current queue | قائمة الانتظار الحالية | سرایا نوکە |
| Current shift | الفترة الحالية | شێفتا نوکە |
| Current state | الحالة الحالية | رەوشا نوکە |
| Current statement | كشف الحساب الحالي | کەشفا حیسابێ یا نوکە |
| Current status | الحالة الحالية | رەوشا نوکە |
| Current time | الوقت الحالي | دەمێ نوکە |
| Dashboard | لوحة المتابعة | سەرەکی |
| Date | التاريخ | رێکەفت |
| Date of birth | تاريخ الميلاد | رێکەفتا ژدایکبوونێ |
| Default | افتراضي | بنەرەتی |
| Delayed | متأخر | پاشکەفتی |
| Delete | حذف | ژێ ببە |
| Department | القسم | بەش |
| Development | بيئة التطوير | پەرەپێدان |
| Disabled | معطّل | نەچالاککری |
| Doctor | الطبيب | نوژدار |
| Doctor Actions | إجراءات الطبيب | کارێن نوژداری |
| Doctor availability | توفر الطبيب | بەردەستییا نوژداری |
| Doctor delayed | الطبيب متأخر | نوژدار پاشکەفتییە |
| Doctor ID | معرّف الطبيب | ناسناما نوژداری |
| Doctor Notifications | إشعارات الطبيب | ئاگەهداریێن نوژداری |
| Doctor notifications cannot be loaded. No notification state was changed. | ? | بارکرنا ئاگەهداریێن نوژداری سەرنەکەفت. رەوشا چ ئاگەهدارییەکێ نەهاتە گهورین. |
| Doctor Profile | ملف الطبيب | پروفایلێ نوژداری |
| Doctor Schedule | جدول الطبيب | خشتەیێ نوژداری |
| Doctor Settings | إعدادات الطبيب | رێکخستنێن نوژداری |
| Doctor settings cannot be loaded. No profile or preference state was changed. | ? | بارکرنا رێکخستنێن نوژداری سەرنەکەفت. پروفایل و چ هەلبژارتنەک نەهاتە گهورین. |
| Doctor status | حالة الطبيب | رەوشا نوژداری |
| Doctor unavailable | الطبيب غير متاح | نوژدار بەردەست نینە |
| Doctor Workspace | مساحة عمل الطبيب | جهێ کارێ نوژداری |
| Doctors working | الأطباء العاملون | نوژدارێن د کار دا |
| Documentation | التوثيق | بەلگەنامە |
| Draft | مسودة | رەشنڤیس |
| Draft statement | كشف حساب مسودة | کەشفا حیسابێ یا رەشنڤیس |
| Draft values may change until the period is finalized. | ? | بها د رەشنڤیسێ دا دشێن بهێنە گهورین هەتا ماوە ب دووماهی دهێت. |
| Duration | المدة | مایی |
| Earlier | سابقًا | بەری نوکە |
| Earlier notifications | الإشعارات السابقة | ئاگەهداریێن بوری |
| Earned | مكتسبة | دەستکەفتی |
| Effective from | سارية من | ژ ڤی دەمێ ڤە |
| Effective until | سارية حتى | هەتا ڤی دەمی |
| Email | البريد الإلكتروني | ئیمەیل |
| Enabled | مفعّل | چالاککری |
| End | النهاية | دووماهیک |
| English | الإنجليزية | ئینگلیزی |
| Enter 6 digits | أدخل 6 أرقام | 6 ژماران بنڤیسە |
| Enter a valid email address | أدخل عنوان بريد إلكتروني صحيحًا. | ? |
| Enter a valid email address. | ? | ئیمەیلەکێ دروست بنڤیسە |
| Enter a valid Iraqi mobile number | أدخل رقم هاتف عراقي صحيحًا. | ? |
| Enter a valid Iraqi mobile number. | ? | ژمارەکا موبایلا ئیراقی یا دروست بنڤیسە |
| Enter a valid value | أدخل قيمة صحيحة. | ? |
| Enter a valid value. | ? | بهایەکێ دروست بنڤیسە |
| Enter your code | أدخل رمز التحقق | کودێ خو بنڤیسە |
| Environment | البيئة | ژینگەهـ |
| Environment Information | معلومات البيئة | زانیاریێن ژینگەهێ |
| Estimated duration | المدة المتوقعة | ماوێ پێشبینی کری |
| Estimated finish | وقت الانتهاء المتوقع | دەمێ دووماهی هاتنێ یێ پێشبینی کری |
| Estimated remaining | الوقت المتبقي المتوقع | دەمێ مایی یێ پێشبینی کری |
| Estimated wait | وقت الانتظار المتوقع | دەمێ چاڤەرێکرنا پێشبینی کری |
| Estimated wait: X minutes | وقت الانتظار المتوقع: X دقيقة | دەمێ چاڤەرێکرنا پێشبینی کری: X خولەک |
| Expected | متوقع | چاڤەرێکری |
| Family context | معلومات العائلة | زانیاریێن خێزانێ |
| Family members | أفراد العائلة | ئەندامێن خێزانێ |
| Female | أنثى | مێ |
| Filters | عوامل التصفية | جوداکرن |
| Finalize statement | اعتماد كشف الحساب نهائيًا | کەشفا حیسابێ ب دووماهی بینە |
| Finalize this statement? | ? | تو دخوازی کەشفا حیسابێ ب دووماهی بینی؟ |
| Finalized | نهائي | دووماهی هات |
| Finalized lines | بنود كشف الحساب النهائية | رێزێن دووماهی یێن کەشفا حیسابێ |
| Finalized statement | كشف حساب نهائي | کەشفا حیسابێ یا دووماهی هاتی |
| Find a patient and understand what happens next. | ? | ل نەخوشەکێ بگەرە و بزانە ل دویفرا چ دبیت. |
| Find Patient | البحث عن مريض | ل نەخوشی بگەڕێ |
| Finish session | إنهاء الجلسة | دووماهی ب دانیشتنێ بینە |
| Finished | منتهية | دووماهی هات |
| First name | الاسم الأول | ناڤێ ئێکێ |
| Follow system | اتباع إعدادات النظام | ل دویف رێکخستنێن سیستەمی هەرە |
| Follow-up appointment | موعد متابعة | ژڤانێ ل دویفچوونێ |
| Follow-up consultation | استشارة متابعة | پشکنینا ل دویفچوونێ |
| Forbidden | ليس لديك صلاحية للوصول | دەستویری تە بو ڤی تشتی نینە |
| Free slots | المواعيد المتاحة | دەمێن بەردەست |
| Gender | الجنس | رەگەز |
| Go Back | رجوع | ب ڤەگەرە |
| Gross earned | إجمالي العمولات المكتسبة | کوی گشتی یێ کومیسیونێن دەستکەفتی |
| Guest mode | وضع الضيف | رەوشا مێهڤانی |
| Healthy | مستقرة | باش |
| Help | المساعدة | هاریکاری |
| Hide password | إخفاء كلمة المرور | پەیڤا نهێنی ڤەشێرە |
| High | ? | بلند |
| High priority | أولوية عالية | پێشینەیا بلند |
| High priority notifications | ? | ئاگەهداریێن گرنگ |
| Home | الرئيسية | سەرەکی |
| Identifier | المعرّف | ناسنامە |
| Important appointment and clinic updates will appear here. | ? | نویکرنێن گرنگ یێن ژڤان و کلینیکێ دێ ل ڤێرێ دیار بن. |
| Important appointment note | ملاحظة مهمة عن الموعد | تێبینییا گرنگ دەربارەی ژڤانی |
| Important note | ملاحظة مهمة | تێبینییا گرنگ |
| Important Updates | تحديثات مهمة | نویکرنێن گرنگ |
| In consultation | قيد الاستشارة | د پشکنینێ دا |
| Inactive | غير نشط | نەچالاک |
| Inactive clinic | ? | کلینیکا نەچالاک |
| Inactive organization | ? | رێکخراوا نەچالاک |
| Information | المعلومات | زانیاری |
| Initial appointment | موعد أولي | ئێکەم ژڤان |
| Invalid credentials | بيانات تسجيل الدخول غير صحيحة | زانیاریێن چوونا ژور دروست نینن |
| Iraq | العراق | ئیراق |
| Language | اللغة | زمان |
| Languages | اللغات | زمان |
| Large gap | فترة فارغة طويلة | دەمەکێ ڤالا یێ درێژ |
| Last name | اسم العائلة | ناڤێ دووماهیێ |
| Length | المدة | مایی |
| License | الترخيص | مولەت |
| Live Queue | قائمة الانتظار المباشرة | رێزبەندییا زندی |
| Load more | تحميل المزيد | پتر بار بکە |
| Loading | جارٍ التحميل… | دهێتە بارکرن… |
| Loading billing information | جارٍ تحميل معلومات الفوترة… | زانیاریێن حیسابکرنێ دهێنە بارکرن… |
| Loading clinics… | جارٍ تحميل العيادات… | کلینیک دهێنە بارکرن… |
| Loading organizations… | جارٍ تحميل المؤسسات… | رێکخراو دهێنە بارکرن… |
| Loading today’s clinic overview | ? | پوختەیا کلینیکا ئەڤرو دهێتە بارکرن… |
| Log in | ? | چوونا ژور |
| Log out | تسجيل الخروج | دەرکەڤە |
| Log out all devices | تسجيل الخروج من جميع الأجهزة | ژ هەمی ئامیران دەرکەڤە |
| Lunch approaching | موعد استراحة الغداء يقترب | بێهنڤەدانا خوارنێ نێزیکە |
| Lunch break | استراحة الغداء | بێهنڤەدانا خوارنێ |
| Male | ذكر | نێر |
| Mark as Arrived | تسجيل الوصول | هاتنێ تۆمار بکە |
| Mark no response | تسجيل عدم الرد | بێ بەرسڤ تومار بکە |
| Mobile number | رقم الهاتف | ژمارا موبایلێ |
| More patients are waiting than usual. Keep the queue moving. | ? | ژ ئاسایی پتر نەخوش ل چاڤەرێ نە. سرایێ بەردەوام ببە پێش. |
| Morning handover is ready for review. | ? | رادەستکرنا سپێدێ بو پشکنینێ ئامادەیە. |
| Morning shift | الفترة الصباحية | شێفتا سپێدێ |
| My Appointments | مواعيدي | ژڤانێن من |
| My profile | ملفي الشخصي | پروفایلێ من |
| Net commission | صافي العمولة | کومیسیونا خالص |
| New consultation | استشارة جديدة | پشکنینا نوی |
| New date and time | التاريخ والوقت الجديدان | رێکەفت و دەمێ نوی |
| New information became available. | ? | زانیاریێن نوی بەردەست بوون. |
| Next | التالي | ل دویفرا |
| Next appointment | الموعد القادم | ژڤانێ ل دویفرا |
| Next Arrivals | القادمون تالياً | هاتنێن ل دویفرا |
| Next patient | المريض التالي | نەخوشێ ل دویفرا |
| Next patients | المرضى التاليون | نەخوشێن ل دویفرا |
| Next step | الخطوة التالية | گاڤا ل دویفرا |
| Next three patients | المرضى الثلاثة التاليون | سێ نەخوشێن ل دویفرا |
| No active patient | لا يوجد مريض حالي | هیچ نەخوشەک نینە |
| No appointments match your search. | ? | چ ژڤان ل گەل لێگەریانا تە ناگونجن |
| No appointments today | لا توجد مواعيد اليوم | ئەڤرو چ ژڤان نینن |
| No available times | لا توجد مواعيد متاحة | چ دەمێن بەردەست نینن |
| No available times in this date range. | ? | د ڤی ماوەی دا چ دەمێن بەردەست نینن |
| No billing data is available | لا توجد بيانات فوترة متاحة | چ زانیاریێن حیسابکرنێ بەردەست نینن |
| No billing data is available. | ? | چ زانیاریێن حیسابکرنێ بەردەست نینن. |
| No clinic activity yet | ? | هێشتا چ چالاکییەکا کلینیکێ نینە. |
| No clinics have been created yet. | ? | هێشتا چ کلینیک نەهاتیە دروستکرن. |
| No consultation is active. The waiting list remains unchanged until reception calls the next patient. | ? | نوکە چ پشکنینەک چالاک نینە. سرایا چاڤەرێ هەروەسا دمینیت هەتا پێشوازی نەخوشێ ل دویفرا بانگ بکەت |
| No consultation is active. The waiting patients remain unchanged. | ? | نوکە چ پشکنینەک چالاک نینە. نەخوشێن ل چاڤەرێ وەکی خو دمینن. |
| No data available | لا توجد بيانات متاحة | چ زانیاری بەردەست نینن |
| No doctors found | لم يتم العثور على أطباء | چ نوژدار نەهاتنە دیتن |
| No earlier notifications | لا توجد إشعارات سابقة | هیچ ئاگەهدارییەکا بوری نینە. |
| No notifications | لا توجد إشعارات | چ ئاگەهداری نینن |
| No organizations have been created yet. | ? | هێشتا چ رێکخراو نەهاتیە دروستکرن. |
| No patient is currently being seen. | ? | نوکە چ نەخوش د پشکنینێ دا نینە |
| No patients | لا يوجد مرضى | چ نەخوش نینن |
| No patients are expected to arrive today. | ? | ئەڤرو چ نەخوش ناهێن |
| No patients are ready to be called. | ? | چ نەخوش بو بانگکرنێ ئامادە نینن |
| No patients match your search. | ? | چ نەخوش ل گەل لێگەریانا تە ناگونجن |
| No patients waiting | لا يوجد مرضى في الانتظار | چ نەخوش ل چاڤەرێ نینن |
| No read notifications from today | ? | ئەڤرو چ ئاگەهداریێن ڤەکری نینن. |
| No recently viewed patients | ? | هیچ نەخوشەکێ کو بوری هاتیە دیتن نینە. |
| No response | لم يرد | بێ بەرسڤ |
| No results | لا توجد نتائج | چ ئەنجام نینن |
| No unread notifications | لا توجد إشعارات غير مقروءة | هیچ ئاگەهداریێن نەڤەکری نینن. |
| No unsafe change was made. Go back and review the appointment before trying again. | ? | چ گهورینەکا نەپاراستی نەهاتە کرن. ب ڤەگەرە و ژڤانێ بپشکنە بەری کو دیسان هەول بدەی. |
| No upcoming appointments | لا توجد مواعيد قادمة | چ ژڤان ل دویفرا نینن |
| No upcoming sessions | لا توجد جلسات قادمة | هیچ دانیشتنەکا داهاتی نینە |
| No warnings | لا توجد تنبيهات | هیچ ئاگەهدارییەک نینە |
| No-show | لم يحضر | نەهات |
| None | لا يوجد | نینە |
| Normal | ? | ئاسایی |
| Normal priority | أولوية عادية | پێشینەیا ئاسایی |
| Not found | غير موجود | نەهاتە دیتن |
| Not specified | غير محدد | دیار نەکری |
| Nothing here right now | لا يوجد شيء هنا الآن | نوکە هیچ تشتەک ل ڤێرێ نینە |
| Nothing needs attention | ? | هیچ تشتەک پێدڤی ب گرنگیدانێ نینە. |
| Notification details | تفاصيل الإشعار | هویرکاتیێن ئاگەهداریێ |
| Notification preferences | تفضيلات الإشعارات | هەلبژارتنێن ئاگەهدارییان |
| Notification summary | ملخص الإشعارات | پوختەیا ئاگەهدارییان |
| Notifications | الإشعارات | ئاگەهداری |
| Notifications changed before this item was opened. Refresh and try again. | ? | بەری ڤەکرنا ڤی تشتی ئاگەهداری هاتنە گهورین. لاپەری نوی بکە و دیسان هەول بدە. |
| Offline | لا يوجد اتصال بالإنترنت | ئینتەرنێت نینە |
| On break | في استراحة | د بێهنڤەدانێ دایە |
| On time | في الموعد | ل دەمێ خو دا |
| Onboard clinic | إضافة عيادة | کلینیکەکێ زێدە بکە |
| Onboard organizations and clinics for the Saxlem platform. | ? | رێکخراو و کلینیکان بو پلاتفورما ساخلەم زێدە بکە. |
| Onboarding | الإضافة | زێدەکرن |
| Only updates affecting today’s work. | ? | تنێ نویکرنێن کو کارێ ئەڤرو کارتێدکەن ل ڤێرێ دیارن. |
| Open | فتح | ڤەکە |
| Open appointment | فتح الموعد | ژڤانی ڤەکە |
| Open current patient | فتح ملف المريض الحالي | نەخوشێ نوکە ڤەکە |
| Open Live Queue | فتح قائمة الانتظار المباشرة | رێزبەندییا زندی ڤەکە |
| Open Live Queue when you are ready to follow your place. | ? | دەمێ ئامادە دبی رێزبەندییا زندی ڤەکە دا لدویف جهێ خو بچی. |
| Open navigation | فتح قائمة التنقل | رێنیشاندانێ ڤەکە |
| Open notification | فتح الإشعار | ئاگەهداریێ ڤەکە |
| Open notifications | فتح الإشعارات | ئاگەهدارییان ڤەکە |
| Open organizations | فتح المؤسسات | رێکخراوان ڤەکە |
| Open patient | فتح ملف المريض | نەخوشی ڤەکە |
| Open patient workspace | فتح مساحة عمل المريض | جهێ کارێ نەخوشی ڤەکە |
| Open schedule | فتح الجدول | خشتەیێ ڤەکە |
| Open status | مفتوح | ڤەکری |
| Open the queue before calling a patient. | ? | بەری بانگکرنا نەخوشی سرایێ ڤەکە. |
| Open today’s queue | فتح قائمة انتظار اليوم | رێزبەندییا ئەڤرو ڤەکە |
| Open workspace | فتح مساحة العمل | جهێ کاری ڤەکە |
| Operational details | التفاصيل التشغيلية | هویرکاتیێن کارکرنێ |
| Organization | المؤسسة | رێکخراو |
| Organization created | تم إنشاء المؤسسة | رێکخراو هاتە دروستکرن |
| Organization name | اسم المؤسسة | ناڤێ رێکخراوێ |
| Organization onboarding | إضافة المؤسسة | زێدەکرنا رێکخراوێ |
| Organizations | المؤسسات | رێکخراو |
| Page not found | الصفحة غير موجودة | لاپەر نەهاتە دیتن |
| Password | كلمة المرور | پەیڤا نهێنی |
| Password must contain at least 12 characters | يجب أن تتكون كلمة المرور من 12 حرفًا على الأقل. | ? |
| Password must contain at least 12 characters. | ? | پەیڤا نهێنی پێدڤییە ب کێمی 12 پیت بیت |
| Patient | المريض | نەخوش |
| Patient arrived | وصل المريض | نەخوش گەهشت |
| Patient called | تم استدعاء المريض | نەخوش هاتە بانگکرن |
| Patient details | تفاصيل المريض | هویرکاتیێن نەخوشی |
| Patient ID | رقم المريض | ژمارا نەخوشی |
| Patient profile | ملف المريض | پروفایلێ نەخوشی |
| Patient Workspace | مساحة عمل المريض | جهێ کارێ نەخوشی |
| Patients ahead | المرضى قبلك | نەخوشێن بەری تە |
| Patients are waiting longer than expected. | ? | نەخوش پتر ژ دەمێ پێشبینی کری چاڤەرێ نە. |
| Patients waiting | المرضى في الانتظار | نەخوشێن چاڤەرێ |
| Pause this queue? Patients will remain in their current positions. | ? | تو دخوازی ڤێ سرایێ بو دەمکی رابگری؟ نەخوش د جهێن خو یێن نوکە دا دمینن. |
| Paused | متوقف مؤقتًا | بو دەمکی هاتە راگرتن |
| Phone | الهاتف | ژمارا تەلەفونێ |
| Plan | الخطة | پلان |
| Plan assignment | تعيين الخطة | دیارکرنا پلانێ |
| Plan changes are effective-dated. Historical commissions remain unchanged. | ? | گهورینێن پلانێ ژ رێکەفتا دیارکری دەستپێدکەن. کومیسیونێن بوری وەکی خو دمینن |
| Plans | الخطط | پلان |
| Platform administrator | مسؤول المنصة | رێڤەبەرێ پلاتفورمێ |
| Previous appointment | الموعد السابق | ژڤانێ بوری |
| Privacy | الخصوصية | تایبەتمەندی |
| Profile | الملف الشخصي | پروفایل |
| Queue available today | ? | رێزبەندییا زندی بو ئەڤرو بەردەستە |
| Queue closed | قائمة الانتظار مغلقة | رێزبەندی گرتیە |
| Queue number | رقم الدور | ژمارا سرایێ |
| Queue open | قائمة الانتظار مفتوحة | رێزبەندی ڤەکریە |
| Queue paused | قائمة الانتظار متوقفة مؤقتًا | رێزبەندی بو دەمکی هاتە راگرتن |
| Queue status | حالة قائمة الانتظار | رەوشا رێزبەندیێ |
| Quick Actions | إجراءات سريعة | کارێن بلەز |
| Read | مقروء | ڤەکری |
| Ready | جاهز | ئامادە |
| Ready for Live Queue | جاهز لقائمة الانتظار المباشرة | بو رێزبەندییا زندی ئامادەیە |
| Record arrival | تسجيل الوصول | هاتنێ تومار بکە |
| Refresh | تحديث | نوو بکە |
| Relationship | صلة القرابة | پەیوەندی |
| Remaining | المتبقي | یێ مای |
| Reschedule | تغيير الموعد | دەمێ ژڤانێ بگهورە |
| Reschedule appointment | تغيير الموعد | دەمێ ژڤانێ بگهورە |
| Resend code | إعادة إرسال الرمز | کودی دیسان فرێکە |
| Resend in {seconds}s | ? | پشتی {seconds} چرکەیان دیسان فرێکە |
| Retry | ? | دیسان هەول بدە |
| Retry / Try again | إعادة المحاولة | ? |
| Return Home | العودة إلى الرئيسية | ب ڤەگەرە بو سەرەکی |
| Return to Workspace | العودة إلى مساحة العمل | ڤەگەڕە جهێ کاری |
| Reversal | عكس العمولة | ڤەگەراندنا کومیسیونێ |
| Reversals | عمولات معكوسة | ڤەگەراندنێن کومیسیونێ |
| Room | الغرفة | ژوور |
| Running on time | يسير في الموعد | د دەمێ خۆ دایە |
| Running {minutes} minutes late | متأخر {minutes} دقيقة | {minutes} خولەک پاشکەفتییە |
| Save | حفظ | پارێزە |
| Saving | جارٍ الحفظ… | دهێتە پاراستن… |
| Schedule | الجدول | خشتە |
| Search | بحث | لێ بگەرە |
| Search doctors | البحث عن الأطباء | ل نوژداران بگەرە |
| Search patients | البحث عن المرضى | ل نەخوشان بگەرە |
| Search results | نتائج البحث | ئەنجامێن لێ گەریانێ |
| Secure access for Saxlem clinic teams. | ? | چوونا ژورا پاراستی بو تیمێن کلینیکێن ساخلەم |
| See all | عرض الكل | هەمیان ببینە |
| Send code | إرسال الرمز | کودی فرێکە |
| Session expired | انتهت صلاحية الجلسة | دانیشتن ب دووماهی هات |
| Session finished | انتهت الجلسة | دانیشتن ب دووماهی هات |
| Settings | الإعدادات | رێکخستن |
| Shift | الفترة | شێفت |
| Show password | إظهار كلمة المرور | پەیڤا نهێنی نیشان بدە |
| Sign in | ? | چوونا ژور |
| Sign in / Log in | تسجيل الدخول | ? |
| Skip to main content | الانتقال إلى المحتوى الرئيسي | بڕۆ ناڤەرۆکا سەرەکی |
| Something went wrong | حدث خطأ ما | تشتەک خەلەت چێبوو |
| Specialty | التخصص | پسپۆڕی |
| Start | البداية | دەستپێک |
| Start consultation | بدء الاستشارة | پشکنینێ دەستپێ بکە |
| Statement | كشف الحساب | کەشفا حیسابێ |
| Statement details | تفاصيل كشف الحساب | هویرکاتیێن کەشفا حیسابێ |
| Statement period | فترة كشف الحساب | ماوێ کەشفا حیسابێ |
| Statement status | حالة كشف الحساب | رەوشا کەشفا حیسابێ |
| Statements | كشوف الحساب | کەشفێن حیسابێ |
| Status | الحالة | رەوش |
| Support | الدعم | هاریکاری |
| Temporarily unavailable | ? | بو دەمکی نەبەردەستە |
| Terms | الشروط | مەرج |
| The final appointment is close to the end of working hours. | ? | ژڤانا دووماهیێ نێزیکی دووماهیکا دەمێ کاری یە. |
| The organization list is too large to show safely. Review Organizations before trying again. | ? | لیستا رێکخراوان زۆر مەزنە و ب پاراستی ناهێتە نیشاندان. بەری دیسان هەول بدەی، رێکخراوان بپشکنە. |
| The queue changed before your action was saved. Refresh and try again. | ? | بەری پاراستنا کارێ تە، سرا هاتە گهورین. لاپەری نوو بکە و دیسان هەول بدە. |
| The queue changed. Refresh and try again. | ? | سرا هاتە گهورین. لاپەری نوی بکە و دیسان هەول بدە. |
| The queue could not be updated. No unsafe change was made. | ? | نویکرنا سرایێ سەرنەکەفت. چ گهورینەکا نەپاراستی نەهاتە کرن. |
| The queue has moved closer to your turn. | ? | سرایا تە نێزیکتر بوو. |
| The queue is currently behind its expected pace. | ? | نوکە سرا ژ خێراییا پێشبینی کری پاشکەفتییە. |
| The queue is moving at a comfortable pace. | ? | سرا ب خێراییەکا باش دچیت. |
| The reminder helps keep the session predictable. | ? | بیرئینان هاریکاریێ دکەت دانیشتن ب رێک و پێک بمینیت. |
| The request took too long. Please try again. | ? | داخوازی پتر ژ پێدڤی دەم گرت. هیڤییە دیسان هەول بدە. |
| The schedule includes a 30-minute break. | ? | خشتەی بێهنڤەدانەکا 30 خولەکی ب خوڤە دگریت. |
| The session changed before your action was saved. Refresh before continuing. | ? | بەری پاراستنا کارێ تە دانیشتن هاتە گهورین. بەری بەردەوامبوونێ لاپەری نوو بکە. |
| The session is paused. Resume it before completing a consultation. | ? | دانیشتن بو دەمکی هاتە راگرتن. بەری تەمامکرنا پشکنینێ دیسان دەستپێبکە. |
| The statement changed. Reload it before trying again. | ? | کەشفا حیسابێ هاتە گهورین. بەری دیسان هەولدانێ وێ دیسان بار بکە. |
| This information may affect today’s work. | ? | ئەڤ زانیاری دشێن کاری ئەڤرو کارتێبکەن. |
| This is the finalized statement snapshot. | ? | ئەڤە وێنەیا دووماهی یا کەشفا حیسابێ یە. |
| This patient workspace is not available. | ? | جهێ کارێ ڤی نەخوشی بەردەست نینە. |
| This session is finished. Queue information is read-only. | ? | ئەڤ دانیشتنە ب دووماهی هات. زانیاریێن سرایێ تنێ بو خواندنێ نە. |
| Time | الوقت | دەم |
| Time recorded | وقت التسجيل | دەما تۆمارکرنێ |
| Time unavailable | الوقت غير متاح | دەم نەبەردەستە |
| Today | اليوم | ئەڤرو |
| Today's appointments | مواعيد اليوم | ژڤانێن ئەڤرو |
| Today's date | تاريخ اليوم | رێکەفتا ئەڤرو |
| Today’s schedule has no unresolved issues. | ? | خشتەیا ئەڤرو چ کێشەیا نەچارەسەرکری نینە. |
| Too many attempts. Please request a new code. | ? | هەول زور بوون. هیڤییە کودەکێ نوی بخوازە |
| Try again | ? | دیسان هەول بدە |
| Unauthorized | غير مصرح لك | دەستویری نینە |
| Unavailable | غير متاح | بەردەست نینە |
| Unread | غير مقروء | نەڤەکری |
| Upcoming appointments | المواعيد القادمة | ژڤانێن داهاتی |
| Verification code | رمز التحقق | کودێ پشتراستکرنێ |
| Verification required | التحقق مطلوب | پشتراستکرن پێدڤییە |
| Verify your number again to continue securely. | ? | ژمارا خو دیسان پشتراست بکە دا ب پاراستی بەردەوام بی |
| View Current Patient | عرض المريض الحالي | نەخوشێ نوکە ببینە |
| View queue | عرض قائمة الانتظار | سرایێ ببینە |
| View Workspace | عرض مساحة العمل | جهێ کاری ببینە |
| Waiting | في الانتظار | ل چاڤەرێ |
| We could not load your appointments. | ? | ئەم نەشیاین ژڤانێن تە بار بکەین |
| Working | يعمل | د کار دایە |
| Working hours | ساعات العمل | دەمێن کاری |
| Workspace | مساحة العمل | جهێ کاری |
| Your mobile number | رقم هاتفك | ژمارا موبایلا تە |
| Your session has expired | انتهت صلاحية جلستك | دانیشتنا تە ب دووماهی هات |
| {age} years | {age} سنة | {age} سال |
| {minutes} minutes | {minutes} دقيقة | {minutes} خولەک |
