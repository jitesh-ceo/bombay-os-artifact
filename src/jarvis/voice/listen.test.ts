import { describe, expect, it, vi } from 'vitest';
import { createListener, parseWake, type RecognitionCtor } from './listen';

class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  constructor() {
    FakeRecognition.last = this;
  }
  emit(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal });
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
}

const make = () => createListener({ Recognition: FakeRecognition as unknown as RecognitionCtor, media: null });

describe('parseWake', () => {
  it('finds the wake word at the start and returns the rest', () => {
    expect(parseWake('Jarvis, show me the ROI')).toBe('show me the ROI');
    expect(parseWake('hey jarvis run the brand deal')).toBe('run the brand deal');
    expect(parseWake('JARVIS')).toBe('');
  });

  it('treats "wake up, Jarvis" as a wake request', () => {
    expect(parseWake('Wake up, JARVIS')).toBe('wake up');
    expect(parseWake('wake up jarvis')).toBe('wake up');
  });

  it('understands the Arabic wake word', () => {
    expect(parseWake('جارفس اعرض العائد')).toBe('اعرض العائد');
    expect(parseWake('يا جارفس')).toBe('');
  });

  it('ignores speech without the wake word', () => {
    expect(parseWake('show me the ROI')).toBeNull();
    expect(parseWake('the jarvis demo was good')).toBeNull();
  });
});

describe('createListener', () => {
  it('reports unsupported browsers and does nothing on start', () => {
    const l = createListener({ Recognition: null, media: null });
    expect(l.supported).toBe(false);
    expect(() => l.start()).not.toThrow();
  });

  it('emits interim and final transcripts in push-to-talk mode', () => {
    const l = make();
    const got: { text: string; final: boolean }[] = [];
    l.onTranscript((t) => got.push(t));
    l.start();
    FakeRecognition.last!.emit('show me', false);
    FakeRecognition.last!.emit('show me the ROI', true);
    expect(got).toEqual([
      { text: 'show me', final: false },
      { text: 'show me the ROI', final: true },
    ]);
  });

  it('only fires wake on a final result in wake mode', () => {
    const l = make();
    const woke = vi.fn();
    const heard = vi.fn();
    l.onWake(woke);
    l.onTranscript(heard);
    l.setWakeMode(true);
    l.start();
    FakeRecognition.last!.emit('Jarvis, show', false);
    expect(woke).not.toHaveBeenCalled();
    FakeRecognition.last!.emit('Jarvis, show ROI', true);
    expect(woke).toHaveBeenCalledWith('show ROI');
    FakeRecognition.last!.emit('nice weather today', true);
    expect(woke).toHaveBeenCalledTimes(1);
    expect(heard).not.toHaveBeenCalled();
  });

  it('reports a blocked microphone and stops', () => {
    const l = make();
    const err = vi.fn();
    l.onError(err);
    l.start();
    FakeRecognition.last!.onerror?.({ error: 'not-allowed' });
    expect(err).toHaveBeenCalledWith('not-allowed');
    FakeRecognition.last!.start.mockClear();
    FakeRecognition.last!.onend?.();
    expect(FakeRecognition.last!.start).not.toHaveBeenCalled();
  });

  it('restarts after the browser ends a session while still listening', () => {
    const l = make();
    l.start();
    const rec = FakeRecognition.last!;
    rec.start.mockClear();
    rec.onend?.();
    expect(rec.start).toHaveBeenCalledTimes(1);
    l.stop();
    rec.start.mockClear();
    rec.onend?.();
    expect(rec.start).not.toHaveBeenCalled();
  });
});
