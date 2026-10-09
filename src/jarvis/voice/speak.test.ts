import { describe, expect, it, vi } from 'vitest';
import { createSpeaker, pickVoice } from './speak';

class FakeUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  lang = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function fakeSynth({ autoEnd = true } = {}) {
  const spoken: FakeUtterance[] = [];
  const synth = {
    spoken,
    speak: vi.fn((u: FakeUtterance) => {
      spoken.push(u);
      if (autoEnd) setTimeout(() => u.onend?.(), 0);
    }),
    cancel: vi.fn(),
    getVoices: () => [] as SpeechSynthesisVoice[],
  };
  return synth;
}

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

function setup(fetchImpl: typeof fetch, synthOpts?: { autoEnd?: boolean }) {
  const synth = fakeSynth(synthOpts);
  const speaker = createSpeaker({
    fetchImpl,
    synth: synth as unknown as SpeechSynthesis,
    Utterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance,
    playAudio: null,
  });
  return { synth, speaker };
}

describe('createSpeaker', () => {
  it('falls back to the browser voice when the voice service is unreachable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const { synth, speaker } = setup(fetchImpl);
    await speaker.say('Good morning, sir.');
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.spoken[0].text).toBe('Good morning, sir.');
  });

  it('skips the voice service when health says it is not configured', async () => {
    const fetchImpl = vi.fn(async (url: string) => (url === '/api/health' ? json({ tts: false, chat: false }) : json({}))) as unknown as typeof fetch;
    const synth = fakeSynth();
    const playAudio = vi.fn(async () => true);
    const speaker = createSpeaker({ fetchImpl, synth: synth as unknown as SpeechSynthesis, Utterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance, playAudio });
    await speaker.say('Hello.');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith('/api/health');
    expect(playAudio).not.toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('cancels the line in progress before speaking a new one', async () => {
    const fetchImpl = vi.fn(async () => json({ tts: false, chat: false })) as unknown as typeof fetch;
    const { synth, speaker } = setup(fetchImpl, { autoEnd: false });
    void speaker.say('First line.');
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1));
    void speaker.say('Second line.');
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(2));
    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.spoken[1].text).toBe('Second line.');
  });

  it('says nothing while muted', async () => {
    const fetchImpl = vi.fn(async () => json({ tts: false, chat: false })) as unknown as typeof fetch;
    const { synth, speaker } = setup(fetchImpl);
    speaker.setMuted(true);
    await speaker.say('Silent.');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('marks Arabic lines as Arabic for the browser voice', async () => {
    const fetchImpl = vi.fn(async () => json({ tts: false, chat: false })) as unknown as typeof fetch;
    const { synth, speaker } = setup(fetchImpl);
    await speaker.say('أهلاً، كيف أقدر أساعدك؟');
    expect((synth.spoken[0] as unknown as { lang: string }).lang).toBe('ar-AE');
  });

  it('reports speaking and idle states', async () => {
    const fetchImpl = vi.fn(async () => json({ tts: false, chat: false })) as unknown as typeof fetch;
    const { speaker } = setup(fetchImpl);
    const states: string[] = [];
    speaker.onState((s) => states.push(s));
    await speaker.say('Hello.');
    expect(states).toEqual(['speaking', 'idle']);
  });
});

describe('pickVoice', () => {
  const v = (name: string, lang: string) => ({ name, lang }) as SpeechSynthesisVoice;

  it('prefers a British male voice', () => {
    expect(pickVoice([v('Samantha', 'en-US'), v('Google UK English Female', 'en-GB'), v('Daniel', 'en-GB')])?.name).toBe('Daniel');
  });

  it('falls back to any British English voice, then any English voice', () => {
    expect(pickVoice([v('Samantha', 'en-US'), v('Kate', 'en-GB')])?.name).toBe('Kate');
    expect(pickVoice([v('Hans', 'de-DE'), v('Samantha', 'en-US')])?.name).toBe('Samantha');
  });

  it('picks an Arabic voice for Arabic text', () => {
    expect(pickVoice([v('Daniel', 'en-GB'), v('Maged', 'ar-SA')], 'ar')?.name).toBe('Maged');
    expect(pickVoice([v('Daniel', 'en-GB')], 'ar')).toBeUndefined();
  });

  it('returns undefined when there are no voices', () => {
    expect(pickVoice([])).toBeUndefined();
  });
});

describe('ElevenLabs path', () => {
  const route = (tts: Response) =>
    vi.fn(async (url: string) => (url === '/api/health' ? json({ tts: true, chat: false }) : tts)) as unknown as typeof fetch;

  it('plays the ElevenLabs audio and does not use the browser voice', async () => {
    const synth = fakeSynth();
    const playAudio = vi.fn(async () => true);
    const fetchImpl = route(new Response(new Blob(['mp3'], { type: 'audio/mpeg' })));
    const speaker = createSpeaker({ fetchImpl, synth: synth as unknown as SpeechSynthesis, Utterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance, playAudio });
    await speaker.say('At your service.');
    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(synth.speak).not.toHaveBeenCalled();
    const [, body] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(JSON.parse(body.body)).toEqual({ text: 'At your service.' });
  });

  it('falls back to the browser voice when the audio cannot play', async () => {
    const synth = fakeSynth();
    const playAudio = vi.fn(async () => false);
    const fetchImpl = route(new Response(new Blob(['mp3'], { type: 'audio/mpeg' })));
    const speaker = createSpeaker({ fetchImpl, synth: synth as unknown as SpeechSynthesis, Utterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance, playAudio });
    await speaker.say('Can you hear me?');
    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(synth.spoken[0].text).toBe('Can you hear me?');
  });

  it('falls back to the browser voice when the voice service errors', async () => {
    const synth = fakeSynth();
    const playAudio = vi.fn(async () => true);
    const fetchImpl = route(new Response('{"error":"upstream"}', { status: 502 }));
    const speaker = createSpeaker({ fetchImpl, synth: synth as unknown as SpeechSynthesis, Utterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance, playAudio });
    await speaker.say('Fallback, sir.');
    expect(playAudio).not.toHaveBeenCalled();
    expect(synth.spoken[0].text).toBe('Fallback, sir.');
  });
});
