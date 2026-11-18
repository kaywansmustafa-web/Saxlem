import { BadRequestException } from '@nestjs/common';

/** Where a clinic is and how patients reach it. Every field is optional. */
export interface ClinicLocation {
  readonly address: string | null;
  readonly area: string | null;
  readonly city: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly phoneNumber: string | null;
}

export interface ClinicLocationInput {
  readonly address?: string | null;
  readonly area?: string | null;
  readonly city?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly phoneNumber?: string | null;
}

function text(value: string | null | undefined, max: number) {
  const trimmed = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (trimmed.length > max)
    throw new BadRequestException(`Keep it under ${max} characters.`);
  return trimmed || null;
}

/** Cleans what the owner typed; rejects half coordinates and odd numbers. */
export function normalizeClinicLocation(
  input: ClinicLocationInput,
): ClinicLocation {
  const latitude = input.latitude ?? null,
    longitude = input.longitude ?? null;
  if ((latitude === null) !== (longitude === null))
    throw new BadRequestException(
      'Give both latitude and longitude, or neither.',
    );
  if (
    latitude !== null &&
    (!Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude! < -180 ||
      longitude! > 180)
  )
    throw new BadRequestException('The map location is not valid.');
  const phone = input.phoneNumber?.replace(/[\s()-]/g, '') ?? '';
  if (phone && !/^\+?[0-9]{7,15}$/.test(phone))
    throw new BadRequestException('The phone number is not valid.');
  return Object.freeze({
    address: text(input.address, 300),
    area: text(input.area, 120),
    city: text(input.city, 80),
    latitude,
    longitude,
    phoneNumber: phone || null,
  });
}
