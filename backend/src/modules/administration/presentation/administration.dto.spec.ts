import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClinicDto, CreateOrganizationDto } from './administration.dto';

describe('administration DTO validation', () => {
  it.each([
    {},
    { name: '' },
    { name: '   ' },
    { name: 'x'.repeat(121) },
    { name: 'Valid', extra: true },
  ])('rejects invalid organization input %p', async (input) => {
    expect(
      await validate(plainToInstance(CreateOrganizationDto, input), {
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ).not.toHaveLength(0);
  });

  it('accepts and normalizes the minimal clinic input', async () => {
    const value = plainToInstance(CreateClinicDto, {
      organizationId: '018f0000-0000-7000-8000-000000000001',
      name: ' Duhok ',
      code: ' dhk_1 ',
      timezone: ' Asia/Baghdad ',
    });
    expect(
      await validate(value, { whitelist: true, forbidNonWhitelisted: true }),
    ).toHaveLength(0);
    expect(value).toMatchObject({
      name: 'Duhok',
      code: 'DHK_1',
      timezone: 'Asia/Baghdad',
    });
  });

  it.each([
    {
      organizationId: 'bad',
      name: 'Duhok',
      code: 'DHK',
      timezone: 'Asia/Baghdad',
    },
    {
      organizationId: '018f0000-0000-7000-8000-000000000001',
      name: ' ',
      code: 'DHK',
      timezone: 'Asia/Baghdad',
    },
    {
      organizationId: '018f0000-0000-7000-8000-000000000001',
      name: 'Duhok',
      code: 'bad code',
      timezone: 'Asia/Baghdad',
    },
    {
      organizationId: '018f0000-0000-7000-8000-000000000001',
      name: 'Duhok',
      code: 'DHK',
      timezone: 'invalid',
    },
    {
      organizationId: '018f0000-0000-7000-8000-000000000001',
      name: 'Duhok',
      code: 'DHK',
      timezone: 'Asia/Baghdad',
      extra: true,
    },
  ])('rejects invalid clinic input %p', async (input) => {
    expect(
      await validate(plainToInstance(CreateClinicDto, input), {
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ).not.toHaveLength(0);
  });
});
