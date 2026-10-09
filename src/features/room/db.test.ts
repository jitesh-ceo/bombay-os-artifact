import { beforeEach, describe, expect, it } from 'vitest';
import { read } from './db';

describe('room database', () => {
  beforeEach(() => localStorage.clear());

  it('keeps each preset in its own namespace', () => {
    read('tasks', () => ['seed']);
    expect(Object.keys(localStorage)).toEqual(['bombay-os.room/creator/tasks']);
  });

  it('ignores data saved by another preset', () => {
    localStorage.setItem('bombay-os.room/studio/tasks', JSON.stringify({ v: 3, data: ['studio task'] }));
    localStorage.setItem('bombay-os.room/tasks', JSON.stringify({ v: 3, data: ['legacy task'] }));
    expect(read('tasks', () => ['creator seed'])).toEqual(['creator seed']);
  });
});
