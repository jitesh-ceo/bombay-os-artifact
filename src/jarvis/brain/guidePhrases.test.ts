import { describe, expect, it } from 'vitest';
import { parseWake } from '../voice/listen';
import { matchIntent } from './intents';

// Every phrase printed in the JARVIS Demo Guide must do what the guide says.
describe('demo guide phrases', () => {
  it.each([
    ['Jarvis, run the brand deal', { kind: 'run', signalIndex: 0 }],
    ['Jarvis, ride the viral reel', { kind: 'run', signalIndex: 1 }],
    ['Jarvis, run the weekly upload pack', { kind: 'run', signalIndex: 2 }],
    ['Jarvis, next', { kind: 'advance' }],
    ['Jarvis, how much is the brand deal worth?', null],
    ['Jarvis, make me a video about a weekend in Hatta', { kind: 'forge', topic: 'a weekend in Hatta' }],
    ['Jarvis, make me a video about the new iPhone in Dubai', { kind: 'forge', topic: 'the new iPhone in Dubai' }],
    ['Jarvis, open the control room', { kind: 'view', view: 'room' }],
    ['Jarvis, show me the results', { kind: 'overlay', overlay: 'roi' }],
    ['Jarvis, show the map', { kind: 'view', view: 'map' }],
    ['Jarvis, turn on gestures', { kind: 'gestures', on: true }],
    ['Jarvis, switch to Arabic', { kind: 'lang', lang: 'ar' }],
    ['Jarvis, mute', { kind: 'mute', on: true }],
    ['Jarvis, start over', { kind: 'reset' }],
  ])('%s', (said, expected) => {
    expect(matchIntent(parseWake(said)!)).toEqual(expected);
  });

  it('wakes on "Wake up, JARVIS"', () => {
    expect(matchIntent(parseWake('Wake up, JARVIS')!)).toEqual({ kind: 'wake' });
  });
});
