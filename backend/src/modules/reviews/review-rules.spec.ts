import { authorName, averageOf, cleanComment } from './review-rules';

describe('review rules', () => {
  it('shows a first name and initial, and one-decimal averages', () => {
    expect(authorName('Avin', 'Kareem')).toBe('Avin K.');
    expect(authorName('شيلان', 'أحمد')).toBe('شيلان أ.');
    expect(authorName('Avin', ' ')).toBe('Avin');
    expect(averageOf(3, 14)).toBe(4.7);
    expect(averageOf(0, 0)).toBe(0);
  });

  it('keeps comments public-safe', () => {
    expect(cleanComment('  Very   kind doctor ')).toBe('Very kind doctor');
    expect(cleanComment('')).toBeNull();
    expect(cleanComment(null)).toBeNull();
    for (const bad of [
      'Call me on 0750 123 4567',
      'see www.example.com',
      'https://x.io great',
      'mail me a@b.co',
    ])
      expect(() => cleanComment(bad)).toThrow();
    expect(() => cleanComment('x'.repeat(501))).toThrow();
    // Ordinary numbers are fine.
    expect(cleanComment('Waited 15 minutes, seen at 10:30')).toBe(
      'Waited 15 minutes, seen at 10:30',
    );
  });
});
