// Spoken text → subtitle lines, one sentence at a time, never a flicker of two words.
const SHORT = 12;

export function sentences(text: string): string[] {
  const parts = text
    .trim()
    .split(/(?<=[.!?؟])\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last !== undefined && last.length < SHORT) out[out.length - 1] = `${last} ${p}`;
    else out.push(p);
  }
  // A short final sentence rides with the one before it.
  if (out.length > 1 && out[out.length - 1].length < SHORT) out.splice(-2, 2, `${out[out.length - 2]} ${out[out.length - 1]}`);
  return out;
}
