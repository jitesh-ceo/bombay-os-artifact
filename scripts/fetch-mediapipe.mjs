// Copies MediaPipe's WASM runtime and downloads the hand model into public/, so hand gestures run
// fully offline from the app's own files. Run once after install: npm run mediapipe
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const WASM_SRC = 'node_modules/@mediapipe/tasks-vision/wasm';
const WASM_DST = 'public/mediapipe/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MODEL_DST = 'public/models/hand_landmarker.task';

await mkdir(WASM_DST, { recursive: true });
for (const f of await readdir(WASM_SRC)) await copyFile(join(WASM_SRC, f), join(WASM_DST, f));
console.log(`copied WASM runtime → ${WASM_DST}`);

await mkdir('public/models', { recursive: true });
const have = await stat(MODEL_DST).then((s) => s.size > 1_000_000).catch(() => false);
if (have) {
  console.log(`model already present → ${MODEL_DST}`);
} else {
  const r = await fetch(MODEL_URL);
  if (!r.ok) throw new Error(`model download failed: ${r.status}`);
  await writeFile(MODEL_DST, Buffer.from(await r.arrayBuffer()));
  console.log(`downloaded hand model → ${MODEL_DST}`);
}
