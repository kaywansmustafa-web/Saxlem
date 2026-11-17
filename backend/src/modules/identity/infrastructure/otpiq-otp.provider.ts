import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { OtpDeliveryProvider } from '../domain/providers';

export interface OtpiqSettings {
  apiKey: string;
  channel: 'auto' | 'sms' | 'whatsapp' | 'telegram';
  baseUrl: string;
}

/**
 * Sends sign-in codes through OTPIQ, an Iraqi gateway that reaches Asiacell,
 * Korek and Zain subscribers by WhatsApp, Telegram or SMS. Saxlem generates
 * and hashes the code itself; OTPIQ only carries it.
 */
export class OtpiqOtpProvider implements OtpDeliveryProvider {
  private readonly logger = new Logger(OtpiqOtpProvider.name);

  constructor(
    private readonly settings: OtpiqSettings,
    private readonly send: typeof fetch = fetch,
    private readonly timeoutMs = 10_000,
  ) {}

  async deliver(phone: string, otp: string): Promise<void> {
    let response: Response;
    try {
      response = await this.send(`${this.settings.baseUrl}/sms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone.replace(/^\+/, ''),
          smsType: 'verification',
          verificationCode: otp,
          provider: this.settings.channel,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      this.logger.warn('OTPIQ could not be reached.');
      throw this.unavailable();
    }
    if (!response.ok) {
      this.logger.warn(`OTPIQ refused the code with HTTP ${response.status}.`);
      throw this.unavailable();
    }
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      'We could not send the code right now. Please try again.',
    );
  }
}
