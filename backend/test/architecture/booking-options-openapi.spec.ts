/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('booking options OpenAPI contract', () => {
  const document = JSON.parse(
    readFileSync(join(__dirname, '../../openapi/saxlem-api.json'), 'utf8'),
  );
  const path = document.paths['/api/v1/doctors/{doctorId}/booking-options'];
  const schemas = document.components.schemas;

  it('documents the authenticated query and patient-safe response', () => {
    expect(path.get.security).toEqual([{ bearer: [] }]);
    const parameters = Object.fromEntries(
      path.get.parameters.map((item: { name: string }) => [item.name, item]),
    );
    expect(parameters.doctorId.schema.format).toBe('uuid');
    expect(parameters.clinicId.schema.format).toBe('uuid');
    expect(parameters.patientProfileId.schema.format).toBe('uuid');
    expect(parameters.appointmentType.schema.enum).toEqual([
      'initial',
      'followUp',
    ]);
    expect(parameters.dateFrom.schema.format).toBe('date');
    expect(parameters.dateTo.schema.format).toBe('date');
    expect(
      path.get.responses['200'].content['application/json'].schema.$ref,
    ).toBe('#/components/schemas/BookingOptionsResponseDto');
  });

  it('uses exact scalar metadata and no generic objects', () => {
    const options = schemas.BookingOptionsResponseDto.properties;
    const slot = schemas.BookingSlotResponseDto.properties;
    expect(options.durationMinutes).toMatchObject({
      type: 'integer',
      minimum: 5,
      maximum: 480,
    });
    expect(options.feeIqd).toMatchObject({ type: 'integer', minimum: 1 });
    expect(options.currency.enum).toEqual(['IQD']);
    expect(options.clinicTimezone.type).toBe('string');
    expect(slot.startsAt.format).toBe('date-time');
    expect(slot.endsAt.format).toBe('date-time');
    expect(JSON.stringify({ options, slot })).not.toContain('"type":"object"');
  });

  it('preserves appointment mutation and pagination metadata', () => {
    const appointment = schemas.AppointmentResponseDto.properties;
    expect(appointment.status.enum).toEqual([
      'scheduled',
      'confirmed',
      'cancelled',
      'completed',
      'noShow',
    ]);
    expect(appointment.version.type).toBe('integer');
    expect(
      schemas.AppointmentPageResponseDto.properties.nextCursor,
    ).toMatchObject({
      type: 'string',
      nullable: true,
    });
    for (const operation of [
      document.paths['/api/v1/appointments'].post,
      document.paths['/api/v1/appointments/{id}'].patch,
      document.paths['/api/v1/appointments/{id}/cancel'].post,
      document.paths['/api/v1/appointments/{id}/reschedule'].post,
    ]) {
      expect(operation.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Idempotency-Key', required: true }),
        ]),
      );
      const header = operation.parameters.find(
        (parameter: { name: string }) => parameter.name === 'Idempotency-Key',
      );
      expect(header.schema).toMatchObject({
        type: 'string',
        minLength: 8,
        maxLength: 128,
      });
    }
  });
});
