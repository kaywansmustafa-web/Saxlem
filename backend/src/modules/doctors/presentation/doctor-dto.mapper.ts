import { Injectable } from '@nestjs/common';
import type {
  DoctorDiscoveryOptionsProjection,
  DoctorPageProjection,
  DoctorProjection,
} from '../domain/doctor';
import type {
  DoctorAvailabilityResponseDto,
  DoctorDetailResponseDto,
  DoctorDiscoveryOptionsResponseDto,
  DoctorListItemResponseDto,
  DoctorPageResponseDto,
  DoctorProfessionalProfileResponseDto,
  SpecialtyResponseDto,
} from './doctor.dto';

@Injectable()
export class DoctorDtoMapper {
  discoveryOptions(
    source: DoctorDiscoveryOptionsProjection,
  ): DoctorDiscoveryOptionsResponseDto {
    return {
      specialties: source.specialties.map(({ code, displayName }) => ({
        code,
        displayName,
      })),
      clinics: source.clinics.map(({ id, name }) => ({ id, name })),
      languages: [...source.languages],
      genders: [...source.genders],
      experience: { ...source.experience },
    };
  }
  page(source: DoctorPageProjection): DoctorPageResponseDto {
    return {
      items: source.items.map((doctor) => this.listItem(doctor)),
      page: source.page,
      pageSize: source.pageSize,
      total: source.total,
      totalPages: source.totalPages,
    };
  }
  detail(source: DoctorProjection): DoctorDetailResponseDto {
    return {
      ...this.listItem(source),
      firstName: source.firstName,
      lastName: source.lastName,
      licenseNumber: source.licenseNumber,
      biography: source.biography,
      specialties: this.specialties(source),
    };
  }
  profile(source: DoctorProjection): DoctorProfessionalProfileResponseDto {
    return {
      id: source.id,
      displayName: source.displayName,
      fullName: source.fullName,
      specialty: source.specialty,
      gender: source.gender,
      licenseNumber: source.licenseNumber,
      yearsOfExperience: source.yearsOfExperience,
      biography: source.biography,
      languages: [...source.languages],
      profileImageUrl: null,
      specialties: this.specialties(source),
    };
  }
  specialties(source: DoctorProjection): SpecialtyResponseDto[] {
    return source.specialties.map(({ id, code, displayName, isPrimary }) => ({
      id,
      code,
      displayName,
      isPrimary,
    }));
  }
  availability(source: DoctorProjection): DoctorAvailabilityResponseDto {
    return { ...source.availability };
  }
  private listItem(source: DoctorProjection): DoctorListItemResponseDto {
    return {
      id: source.id,
      displayName: source.displayName,
      fullName: source.fullName,
      specialty: source.specialty,
      gender: source.gender,
      status: source.status,
      yearsOfExperience: source.yearsOfExperience,
      languages: [...source.languages],
      profileImageUrl: null,
      clinics: source.clinics.map(({ id, name }) => ({ id, name })),
      availability: this.availability(source),
    };
  }
}
