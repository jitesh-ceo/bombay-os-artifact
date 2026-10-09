import { describe, expect, it } from 'vitest';
import { translate } from './i18n';

// Tests run with no ?preset, so the creator preset is active.
describe('creator labels', () => {
  it('renames panels for a creator', () => {
    expect(translate('en', 'pWall')).toBe('Live channel stats');
    expect(translate('en', 'pBuffer')).toBe('Upload queue · 30 days');
    expect(translate('en', 'pPipeline')).toBe('Brand-deal pipeline');
    expect(translate('en', 'pRivals')).toBe('Creators in your niche');
    expect(translate('en', 'pNews')).toBe('Trend radar');
  });

  it('has Arabic creator labels too', () => {
    expect(translate('ar', 'pRivals')).toBe('صناع محتوى في مجالك');
  });

  it('falls back to the shared label when there is no override', () => {
    expect(translate('en', 'save')).toBe('Save');
  });

  it('fills variables in overridden labels', () => {
    expect(translate('en', 'gapAhead', { name: 'Noura', n: '12K' })).toBe('Noura is ahead of you by 12K followers');
  });
});
