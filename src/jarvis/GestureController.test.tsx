import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../state/AppProvider';
import { GestureController } from './GestureController';
import { JarvisProvider, useJarvis, type JarvisApi } from './JarvisProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('GestureController', () => {
  it('stops the camera if gestures are switched off while it is still starting', async () => {
    const track = { stop: vi.fn() };
    let resolve!: (s: MediaStream) => void;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => new Promise<MediaStream>((r) => (resolve = r))) },
    });
    let j!: JarvisApi;
    function Grab() {
      j = useJarvis();
      return null;
    }
    const root = createRoot(document.createElement('div'));
    await act(async () => {
      root.render(
        <AppProvider>
          <JarvisProvider>
            <Grab />
            <GestureController />
          </JarvisProvider>
        </AppProvider>,
      );
    });
    await act(async () => j.setGestures(true));
    await act(async () => j.setGestures(false));
    await act(async () => resolve({ getTracks: () => [track] } as unknown as MediaStream));
    expect(track.stop).toHaveBeenCalled();
    await act(async () => root.unmount());
  });
});
