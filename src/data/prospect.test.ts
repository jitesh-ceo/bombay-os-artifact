import { describe, expect, it } from 'vitest';
import { PRESETS, resolvePreset } from './prospect';

describe('resolvePreset', () => {
  it('maps the old agency preset to studio', () => {
    expect(resolvePreset('agency')).toBe('studio');
  });

  it('keeps known presets', () => {
    expect(resolvePreset('creator')).toBe('creator');
    expect(resolvePreset('studio')).toBe('studio');
    expect(resolvePreset('realestate')).toBe('realestate');
  });

  it('defaults to creator for missing or unknown values', () => {
    expect(resolvePreset(null)).toBe('creator');
    expect(resolvePreset(undefined)).toBe('creator');
    expect(resolvePreset('nonsense')).toBe('creator');
  });
});

describe('PRESETS', () => {
  it('hides real estate from the setup list', () => {
    expect(PRESETS.filter((p) => !p.hidden).map((p) => p.id)).toEqual(['creator', 'studio']);
  });
});
