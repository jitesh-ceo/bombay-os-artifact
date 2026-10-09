import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../state/AppProvider';
import { JarvisProvider, useJarvis, type JarvisApi } from './JarvisProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('JarvisProvider', () => {
  it('keeps register stable when JARVIS speaks, so features are not torn down', async () => {
    const seen: JarvisApi[] = [];
    function Probe() {
      seen.push(useJarvis());
      return null;
    }
    const el = document.createElement('div');
    const root = createRoot(el);
    await act(async () => {
      root.render(
        <AppProvider>
          <JarvisProvider>
            <Probe />
          </JarvisProvider>
        </AppProvider>,
      );
    });
    const first = seen[seen.length - 1];
    await act(async () => first.say('Good morning.'));
    const later = seen[seen.length - 1];
    expect(later.spoken).toBe('Good morning.');
    expect(later.register).toBe(first.register);
    await act(async () => root.unmount());
  });
});
