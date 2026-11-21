export const WAVEFORM_BARS = 40;

const MIN_BAR = 8;

/** Turns raw audio samples into WAVEFORM_BARS heights from MIN_BAR to 100. */
export function peaksFromSamples(samples: Float32Array, bars = WAVEFORM_BARS): number[] {
  if (!samples.length) return [];
  const size = Math.max(1, Math.floor(samples.length / bars));
  const levels: number[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const start = bar * size;
    const end = Math.min(start + size, samples.length);
    let sum = 0;
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    levels.push(end > start ? Math.sqrt(sum / (end - start)) : 0);
  }
  const loudest = Math.max(...levels);
  if (loudest === 0) return levels.map(() => MIN_BAR);
  return levels.map((level) => Math.round(MIN_BAR + (level / loudest) * (100 - MIN_BAR)));
}

async function decode(data: ArrayBuffer): Promise<number[]> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(data);
    return peaksFromSamples(audio.getChannelData(0));
  } finally {
    context.close().catch(() => {});
  }
}

/** Wave shape of a fresh recording. Returns undefined if the browser can't decode it. */
export async function waveformFromBlob(blob: Blob): Promise<number[] | undefined> {
  try {
    return await decode(await blob.arrayBuffer());
  } catch {
    return undefined;
  }
}

const urlCache = new Map<string, Promise<number[] | undefined>>();

/** Wave shape of an already-sent voice message (for messages saved without one). */
export function waveformFromUrl(url: string): Promise<number[] | undefined> {
  let cached = urlCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((res) => res.arrayBuffer())
      .then(decode)
      .catch(() => undefined);
    urlCache.set(url, cached);
  }
  return cached;
}

/** Stable placeholder shape, shown until (or instead of) the real one. */
export function placeholderWaveform(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    hash = (hash * 1103515245 + 12345 + i) | 0;
    return 20 + (Math.abs(hash) % 50);
  });
}
