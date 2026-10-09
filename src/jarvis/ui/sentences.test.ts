import { describe, expect, it } from 'vitest';
import { sentences } from './sentences';

describe('sentences', () => {
  it('splits spoken text into subtitle lines', () => {
    expect(sentences('Lumière Skin offered $18,000. A counter-offer is ready. Shall we begin?')).toEqual([
      'Lumière Skin offered $18,000.',
      'A counter-offer is ready.',
      'Shall we begin?',
    ]);
  });

  it('does not split decimals or times', () => {
    expect(sentences('Running at 4.1× pace, due at 09:00. Done.')).toEqual(['Running at 4.1× pace, due at 09:00. Done.']);
  });

  it('joins very short sentences (like "Done.") to the next one so lines do not flicker', () => {
    expect(sentences('Done. Everything is delivered and filed for you.')).toEqual(['Done. Everything is delivered and filed for you.']);
  });

  it('handles Arabic question marks and a single line', () => {
    expect(sentences('شو أنشر اليوم؟ عندك ثلاث أفكار جاهزة للنشر الحين.')).toHaveLength(2);
    expect(sentences('Yes?')).toEqual(['Yes?']);
    expect(sentences('')).toEqual([]);
  });
});
