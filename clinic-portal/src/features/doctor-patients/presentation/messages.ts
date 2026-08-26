import type { Locale } from "@/i18n";

const en = {
  eyebrow: "Doctor",
  title: "Patients Today",
  subtitle: "Your current patient and the next patients prepared for this session.",
  sessionSummary: "Session Summary",
  doctor: "Doctor",
  clinic: "Clinic",
  room: "Room",
  sessionState: "Session state",
  active: "Active",
  paused: "Paused",
  finished: "Finished",
  visiblePatients: "Visible patients",
  currentPatient: "Current Patient",
  noCurrent: "No active patient",
  noCurrentBody:
    "No consultation is active. The waiting patients remain unchanged.",
  patientId: "Patient ID",
  age: "Age",
  years: "{age} years",
  appointmentTime: "Appointment time",
  appointmentType: "Appointment type",
  queueNumber: "Queue number",
  arrivalState: "Arrival state",
  importantNote: "Important note",
  openPatient: "Open Patient Workspace",
  openAppointment: "Open Appointment",
  nextPatients: "Next Patients",
  noNext: "No patients are ready next",
  noNextBody:
    "Reception has not prepared another patient for this doctor session.",
  estimatedWait: "Estimated wait",
  minutes: "{minutes} minutes",
  unavailable: "Doctor patients unavailable",
  unavailableBody:
    "This doctor session is not enabled. No patient information has been exposed.",
};

export type DoctorPatientsMessages = typeof en;

const ar: DoctorPatientsMessages = {eyebrow:"الطبيب",title:"مرضى اليوم",subtitle:"المريض الحالي والمرضى التاليون الذين تم تجهيزهم لهذه الجلسة.",sessionSummary:"ملخص الجلسة",doctor:"الطبيب",clinic:"العيادة",room:"الغرفة",sessionState:"حالة الجلسة",active:"نشط",paused:"متوقف مؤقتًا",finished:"منتهية",visiblePatients:"المرضى الظاهرون",currentPatient:"المريض الحالي",noCurrent:"لا يوجد مريض حالي",noCurrentBody:"لا توجد استشارة نشطة حاليًا. سيبقى المرضى المنتظرون دون تغيير.",patientId:"رقم المريض",age:"العمر",years:"{age} سنة",appointmentTime:"وقت الموعد",appointmentType:"نوع الموعد",queueNumber:"رقم الدور",arrivalState:"حالة الوصول",importantNote:"ملاحظة مهمة",openPatient:"فتح مساحة عمل المريض",openAppointment:"فتح الموعد",nextPatients:"المرضى التاليون",noNext:"لا يوجد مرضى جاهزون تالياً",noNextBody:"لم يجهز الاستقبال مريضًا آخر لجلسة الطبيب هذه.",estimatedWait:"وقت الانتظار المتوقع",minutes:"{minutes} دقيقة",unavailable:"مرضى الطبيب غير متاحين.",unavailableBody:"جلسة الطبيب هذه غير مفعّلة. لم يتم عرض أي معلومات عن المرضى."};

const ku: DoctorPatientsMessages = {eyebrow:"نوژدار",title:"نەخوشێن ئەڤرو",subtitle:"نەخوشێ نوکە یێ تە و نەخوشێن ل دویفرا یێن بو ڤێ دانیشتنێ ئامادەکری.",sessionSummary:"پوختەیا دانیشتنێ",doctor:"نوژدار",clinic:"کلینیک",room:"ژوور",sessionState:"رەوشا دانیشتنێ",active:"چالاک",paused:"بو دەمکی هاتە راگرتن",finished:"دووماهی هات",visiblePatients:"نەخوشێن دیار",currentPatient:"نەخوشێ نوکە",noCurrent:"هیچ نەخوشەک نینە",noCurrentBody:"نوکە چ پشکنینەک چالاک نینە. نەخوشێن ل چاڤەرێ وەکی خو دمینن.",patientId:"ژمارا نەخوشی",age:"تەمەن",years:"{age} سال",appointmentTime:"دەمێ ژڤانێ",appointmentType:"جورێ ژڤانێ",queueNumber:"ژمارا سرایێ",arrivalState:"رەوشا هاتنێ",importantNote:"تێبینییا گرنگ",openPatient:"جهێ کارێ نەخوشی ڤەکە",openAppointment:"ژڤانی ڤەکە",nextPatients:"نەخوشێن ل دویفرا",noNext:"چ نەخوش بو ل دویفرا ئامادە نینن",noNextBody:"پێشوازی هێشتا نەخوشەکێ دی بو ڤێ دانیشتنا نوژداری ئامادە نەکرییە.",estimatedWait:"دەمێ چاڤەرێکرنا پێشبینی کری",minutes:"{minutes} خولەک",unavailable:"نەخوشێن نوژداری بەردەست نینن",unavailableBody:"ئەڤ دانیشتنا نوژداری نەچالاککرییە. چ زانیاریێن نەخوشی نەهاتینە نیشاندان."};

export const doctorPatientsMessages = (
  locale: Locale,
): DoctorPatientsMessages => ({ en, ar, ku })[locale];
