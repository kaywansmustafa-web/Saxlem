import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class DepartureRequestDto {
  @ApiProperty({ minimum: -90, maximum: 90, example: 36.8612 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;
  @ApiProperty({ minimum: -180, maximum: 180, example: 42.9721 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class DepartureResponseDto {
  @ApiProperty({ format: 'date-time', description: 'When to set off.' })
  leaveAt!: string;
  @ApiProperty({
    format: 'date-time',
    description: 'When to be at reception (before the visit, to check in).',
  })
  arriveBy!: string;
  @ApiProperty({ type: 'integer', minimum: 0 }) travelSeconds!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) distanceMeters!: number;
  @ApiProperty({
    enum: ['traffic', 'roads', 'estimate', 'learned'],
    description:
      'traffic: live/predicted traffic; roads: road network only; estimate: distance only; learned: roads or estimate corrected by how long real Saxlem trips took at that hour.',
  })
  source!: 'traffic' | 'roads' | 'estimate' | 'learned';
  @ApiProperty({ type: 'integer', minimum: 0 }) parkAndWalkMinutes!: number;
  @ApiProperty({ format: 'date-time' }) computedAt!: string;
}

export class OnTheWayResponseDto {
  @ApiProperty({ format: 'date-time' }) onTheWayAt!: string;
  @ApiProperty({
    format: 'date-time',
    description: 'When the patient should reach reception.',
  })
  arrivalEta!: string;
  @ApiProperty({ type: 'integer', minimum: 0 }) travelSeconds!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) distanceMeters!: number;
  @ApiProperty({ enum: ['traffic', 'roads', 'estimate', 'learned'] })
  source!: 'traffic' | 'roads' | 'estimate' | 'learned';
}
