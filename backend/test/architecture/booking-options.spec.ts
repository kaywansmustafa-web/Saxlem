import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('patient booking options architecture', () => {
  const root = join(__dirname, '../..');
  const source = (path: string) => readFileSync(join(root, path), 'utf8');

  it('requires authentication, patient capability, and an explicit patient-only check', () => {
    const controller = source(
      'src/modules/appointments/presentation/booking-options.controller.ts',
    );
    expect(controller).toContain('@UseGuards(JwtAuthGuard)');
    expect(controller).toContain("@RequireCapabilities('appointment:create')");
    expect(controller).toContain('if (!access.patient)');
    expect(controller).not.toContain('@Public');
  });

  it('keeps private schedule, patient, queue, and unsupported product data out of the response DTO', () => {
    const dto = source(
      'src/modules/appointments/presentation/appointment.dto.ts',
    );
    const response = dto.slice(
      dto.indexOf('export class BookingOptionsResponseDto'),
    );
    expect(response).not.toMatch(
      /breaks|leave|holidayName|absence|patientName|patientProfileId|reason|queue|rating|review|cancellationPolicy/,
    );
  });

  it('does not add arrival, queue, notification, or persistence changes', () => {
    const implementation = [
      source(
        'src/modules/appointments/presentation/booking-options.controller.ts',
      ),
      source(
        'src/modules/appointments/presentation/booking-options-dto.mapper.ts',
      ),
    ].join('\n');
    expect(implementation).not.toMatch(/Queue|Arrival|Notification|Prisma/);
  });
});
