import { ServiceUnavailableException } from '@nestjs/common';
import { OtpiqOtpProvider } from './otpiq-otp.provider';

const settings = {
  apiKey: 'otpiq-key-0123456789',
  channel: 'auto' as const,
  baseUrl: 'https://api.otpiq.com/api',
};

describe('OtpiqOtpProvider', () => {
  it('sends the code Saxlem generated, digits-only phone, bearer key', async () => {
    const send = jest
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await new OtpiqOtpProvider(settings, send).deliver(
      '+9647501234567',
      '042913',
    );
    const [url, init] = send.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.otpiq.com/api/sms');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer otpiq-key-0123456789',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      phoneNumber: '9647501234567',
      smsType: 'verification',
      verificationCode: '042913',
      provider: 'auto',
    });
  });

  it('fails closed when OTPIQ refuses or cannot be reached', async () => {
    const refused = jest
      .fn()
      .mockResolvedValue(new Response('{}', { status: 402 }));
    await expect(
      new OtpiqOtpProvider(settings, refused).deliver('+9647501234567', '1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    const down = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(
      new OtpiqOtpProvider(settings, down).deliver('+9647501234567', '1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
