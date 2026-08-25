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

const ar: DoctorPatientsMessages = {eyebrow:"الطبيب",title:"مرضى اليوم",subtitle:"المعلومات",sessionSummary:"ملخص الجلسة",doctor:"الطبيب",clinic:"العيادة",room:"الغرفة",sessionState:"حالة الجلسة",active:"نشط",paused:"متوقف مؤقتًا",finished:"منتهية",visiblePatients:"المرضى الظاهرون",currentPatient:"المريض الحالي",noCurrent:"لا يوجد مريض حالي",noCurrentBody:"تعذر عرض المعلومات حالياً.",patientId:"رقم المريض",age:"العمر",years:"{age} سنة",appointmentTime:"وقت الموعد",appointmentType:"نوع الموعد",queueNumber:"رقم الدور",arrivalState:"حالة الوصول",importantNote:"ملاحظة مهمة",openPatient:"فتح مساحة عمل المريض",openAppointment:"فتح الموعد",nextPatients:"المرضى التاليون",noNext:"لا يوجد مرضى جاهزون تالياً",noNextBody:"تعذر عرض المعلومات حالياً.",estimatedWait:"وقت الانتظار المتوقع",minutes:"{minutes} دقيقة",unavailable:"غير متاح",unavailableBody:"تعذر عرض المعلومات حالياً."};

const ku: DoctorPatientsMessages = {eyebrow:"نوژدار",title:"زانیاری",subtitle:"زانیاری",sessionSummary:"زانیاری",doctor:"نوژدار",clinic:"کلینیک",room:"ژوور",sessionState:"زانیاری",active:"چالاک",paused:"بو دەمکی هاتە راگرتن",finished:"دووماهی هات",visiblePatients:"زانیاری",currentPatient:"نەخوشێ نوکە",noCurrent:"هیچ نەخوشەک نینە",noCurrentBody:"نوکە چ پشکنینەک چالاک نینە. نەخوشێن ل چاڤەرێ وەکی خو دمینن.",patientId:"ژمارا نەخوشی",age:"تەمەن",years:"{age} سال",appointmentTime:"دەمێ ژڤانێ",appointmentType:"جورێ ژڤانێ",queueNumber:"ژمارا سرایێ",arrivalState:"زانیاری",importantNote:"تێبینییا گرنگ",openPatient:"جهێ کارێ نەخوشی ڤەکە",openAppointment:"ژڤانی ڤەکە",nextPatients:"نەخوشێن ل دویفرا",noNext:"چ نینە",noNextBody:"نوکە ناهێتە نیشاندان.",estimatedWait:"دەمێ چاڤەرێکرنا پێشبینی کری",minutes:"{minutes} خولەک",unavailable:"بەردەست نینە",unavailableBody:"نوکە ناهێتە نیشاندان."};

export const doctorPatientsMessages = (
  locale: Locale,
): DoctorPatientsMessages => ({ en, ar, ku })[locale];
