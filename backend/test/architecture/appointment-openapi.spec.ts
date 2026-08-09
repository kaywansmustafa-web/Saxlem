/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('appointment OpenAPI contract', () => {
  const document = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi/saxlem-api.json'), 'utf8'),
  );
  const schemas = document.components.schemas;
  const parameters = document.paths['/api/v1/appointments'].get.parameters;

  it('documents bounded scalar pagination parameters', () => {
    const pageSize = parameters.find(
      (item: { name: string }) => item.name === 'pageSize',
    ).schema;
    const cursor = parameters.find(
      (item: { name: string }) => item.name === 'cursor',
    ).schema;
    const patientProfileId = parameters.find(
      (item: { name: string }) => item.name === 'patientProfileId',
    ).schema;
    expect(pageSize).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: 25,
    });
    expect(cursor).toMatchObject({
      type: 'string',
      minLength: 1,
      maxLength: 1024,
    });
    expect(cursor.format).toBeUndefined();
    expect(patientProfileId).toMatchObject({ type: 'string', format: 'uuid' });
  });

  it('documents exact response and mutation scalar types', () => {
    const appointment = schemas.AppointmentResponseDto.properties;
    const page = schemas.AppointmentPageResponseDto.properties;
    const cancellation = schemas.CancelAppointmentDto.properties;
    const reschedule = schemas.RescheduleAppointmentDto.properties;
    expect(page.nextCursor).toMatchObject({ type: 'string', nullable: true });
    expect(appointment.cancellationReason).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(schemas.AppointmentResponseDto.required).toContain(
      'cancellationReason',
    );
    for (const property of ['durationMinutes', 'feeIqd', 'version'])
      expect(appointment[property].type).toBe('integer');
    expect(cancellation.version.type).toBe('integer');
    expect(reschedule.durationMinutes.type).toBe('integer');
    expect(reschedule.version.type).toBe('integer');
    expect(JSON.stringify({ appointment, page })).not.toContain(
      '#/components/schemas/Object',
    );
  });
});
