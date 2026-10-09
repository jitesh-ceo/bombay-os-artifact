import { describe, expect, it } from 'vitest';
import { chatRequest, health, parseGeminiText, ttsRequest } from './apiProxy';

const env = {
  ELEVENLABS_API_KEY: 'el-key',
  ELEVENLABS_VOICE_ID: 'voice123',
  GEMINI_API_KEY: 'gm-key',
};

const body = (init: RequestInit) => JSON.parse(String(init.body));
const header = (init: RequestInit, name: string) => new Headers(init.headers).get(name);

describe('ttsRequest', () => {
  it('returns null without a key or voice', () => {
    expect(ttsRequest({}, 'hi')).toBeNull();
    expect(ttsRequest({ ELEVENLABS_API_KEY: 'k' }, 'hi')).toBeNull();
  });

  it('builds the ElevenLabs streaming request', () => {
    const r = ttsRequest(env, 'Good morning, sir.')!;
    expect(r.url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voice123/stream?output_format=mp3_44100_128');
    expect(r.init.method).toBe('POST');
    expect(header(r.init, 'xi-api-key')).toBe('el-key');
    expect(body(r.init)).toMatchObject({ text: 'Good morning, sir.', model_id: 'eleven_flash_v2_5' });
  });

  it('honours ELEVENLABS_MODEL and caps text at 600 characters', () => {
    const r = ttsRequest({ ...env, ELEVENLABS_MODEL: 'eleven_v3' }, 'x'.repeat(900))!;
    expect(body(r.init).model_id).toBe('eleven_v3');
    expect(body(r.init).text).toHaveLength(600);
  });
});

describe('chatRequest', () => {
  const chat = { system: 'You are JARVIS.', messages: [{ role: 'user' as const, text: 'Hello' }] };

  it('returns null without a key', () => {
    expect(chatRequest({}, chat)).toBeNull();
  });

  it('builds the Gemini generateContent request', () => {
    const r = chatRequest(env, chat)!;
    expect(r.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
    expect(header(r.init, 'x-goog-api-key')).toBe('gm-key');
    const b = body(r.init);
    expect(b.systemInstruction.parts[0].text).toBe('You are JARVIS.');
    expect(b.contents).toEqual([{ role: 'user', parts: [{ text: 'Hello' }] }]);
    expect(b.generationConfig?.responseMimeType).toBeUndefined();
  });

  it('asks for JSON only when json is true, and honours GEMINI_MODEL', () => {
    const r = chatRequest({ ...env, GEMINI_MODEL: 'gemini-x' }, { ...chat, json: true })!;
    expect(r.url).toContain('/models/gemini-x:generateContent');
    expect(body(r.init).generationConfig.responseMimeType).toBe('application/json');
  });
});

describe('parseGeminiText', () => {
  it('joins the text parts of the first candidate', () => {
    expect(parseGeminiText({ candidates: [{ content: { parts: [{ text: 'Hello ' }, { text: 'sir.' }] } }] })).toBe('Hello sir.');
  });

  it('returns an empty string for malformed input', () => {
    expect(parseGeminiText(null)).toBe('');
    expect(parseGeminiText({})).toBe('');
    expect(parseGeminiText({ candidates: [{}] })).toBe('');
  });
});

describe('health', () => {
  it('reports which services are configured', () => {
    expect(health({})).toEqual({ tts: false, chat: false });
    expect(health(env)).toEqual({ tts: true, chat: true });
  });
});
