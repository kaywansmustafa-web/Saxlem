import { AppSettings } from './app-settings.service';
import { SETTINGS, SETTINGS_BY_KEY, checkSetting } from './settings-registry';

const configuration = {
  appointmentFoundationDurationMinutes: 30,
  appointmentFoundationFeeIqd: 25000,
  arrivalEarlyWindowMinutes: 60,
  arrivalLateWindowMinutes: 120,
  queueRecallGraceMinutes: 5,
  queueFallbackConsultationMinutes: 10,
  paymentLinkMinutes: 30,
} as never;

describe('settings registry', () => {
  it('has unique keys in the group.name shape the database accepts', () => {
    expect(SETTINGS_BY_KEY.size).toBe(SETTINGS.length);
    for (const setting of SETTINGS)
      expect(setting.key).toMatch(
        /^[a-z][a-zA-Z]{1,31}\.[a-z][a-zA-Z0-9]{1,47}$/,
      );
  });

  it('every default passes its own limits', () => {
    const settings = AppSettings.defaults(configuration);
    for (const setting of SETTINGS)
      expect(checkSetting(setting, settings.get(setting.key))).toEqual({
        ok: true,
        value: settings.get(setting.key),
      });
  });

  it('keeps the values Saxlem shipped with', () => {
    const settings = AppSettings.defaults(configuration);
    expect(settings.text('contact.emergencyNumber')).toBe('122');
    expect(settings.int('booking.daysAhead')).toBe(14);
    expect(settings.int('booking.defaultVisitMinutes')).toBe(30);
    expect(settings.int('leaveBy.checkInFirstVisit')).toBe(10);
    expect(settings.int('earlierTime.offerEveryHours')).toBe(6);
    expect(settings.int('reviews.commentMax')).toBe(500);
    expect(settings.bool('features.reviews')).toBe(true);
  });

  it('server-only settings never reach the app', () => {
    const values = AppSettings.defaults(configuration).publicValues();
    expect(values['contact.emergencyNumber']).toBe('122');
    expect(values).not.toHaveProperty('booking.defaultFeeIqd');
    expect(values).not.toHaveProperty('leaveBy.parkAndWalk');
  });

  it('refuses values outside the limits', () => {
    const days = SETTINGS_BY_KEY.get('booking.daysAhead')!;
    expect(checkSetting(days, 0)).toMatchObject({ ok: false });
    expect(checkSetting(days, 61)).toMatchObject({ ok: false });
    expect(checkSetting(days, 7.5)).toMatchObject({ ok: false });
    expect(checkSetting(days, '7')).toMatchObject({ ok: false });
    expect(checkSetting(days, 30)).toEqual({ ok: true, value: 30 });
  });

  it('cleans phone numbers and links', () => {
    const whatsapp = SETTINGS_BY_KEY.get('contact.supportWhatsApp')!;
    expect(checkSetting(whatsapp, '+964 750 123-4567')).toEqual({
      ok: true,
      value: '9647501234567',
    });
    expect(checkSetting(whatsapp, '')).toEqual({ ok: true, value: '' });
    expect(checkSetting(whatsapp, '07501234567x')).toMatchObject({ ok: false });
    const emergency = SETTINGS_BY_KEY.get('contact.emergencyNumber')!;
    expect(checkSetting(emergency, '')).toMatchObject({ ok: false });
    const terms = SETTINGS_BY_KEY.get('contact.termsUrl')!;
    expect(checkSetting(terms, 'http://saxlem.krd/terms')).toMatchObject({
      ok: false,
    });
    expect(checkSetting(terms, 'javascript:alert(1)')).toMatchObject({
      ok: false,
    });
    expect(checkSetting(terms, ' https://saxlem.krd/terms ')).toEqual({
      ok: true,
      value: 'https://saxlem.krd/terms',
    });
  });

  it('env-based defaults need the server configuration', () => {
    expect(() =>
      AppSettings.defaults().int('booking.defaultVisitMinutes'),
    ).toThrow(/needs the server configuration/);
    expect(AppSettings.defaults().int('booking.daysAhead')).toBe(14);
  });
});
