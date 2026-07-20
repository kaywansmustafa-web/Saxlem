import { OtpDeliveryProvider } from '../domain/providers';

export class DevelopmentOtpProvider implements OtpDeliveryProvider {
  static create(environment: string): DevelopmentOtpProvider {
    if (environment !== 'development' && environment !== 'test')
      throw new Error('Development OTP provider is forbidden.');
    return new DevelopmentOtpProvider();
  }
  private constructor() {}
  async deliver(_phone: string, _otp: string): Promise<void> {
    void _phone;
    void _otp;
    return Promise.resolve();
  }
}
