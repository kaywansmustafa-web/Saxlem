import { optionalName, specialtyCode } from './catalog-rules';

describe('catalog rules', () => {
  it('makes a stable code from the English name', () => {
    expect(specialtyCode('Ear, Nose & Throat')).toBe('ear-nose-throat');
    expect(specialtyCode('  Paediatrics ')).toBe('paediatrics');
    expect(specialtyCode('3D Imaging')).toBe('d-imaging');
    expect(specialtyCode('Ophthalmología')).toBe('ophthalmologia');
  });

  it('refuses names that give no usable code', () => {
    expect(specialtyCode('ددان')).toBe('');
    expect(specialtyCode('A')).toBe('');
  });

  it('treats blank translations as "use English"', () => {
    expect(optionalName('  ')).toBeNull();
    expect(optionalName(undefined)).toBeNull();
    expect(optionalName(' ددان ')).toBe('ددان');
  });
});
