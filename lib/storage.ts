import { Redis } from '@upstash/redis';

const WORD_KEY = 'wordle:word';
const VERSION_KEY = 'wordle:version';

// Vercel's Upstash marketplace integration injects either the new UPSTASH_*
// variables or, for projects that migrated from Vercel KV, the KV_REST_API_*
// variables. Accept both.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const mem: { word: string | null; version: number } = { word: null, version: 0 };

export async function getWord(): Promise<string | null> {
  if (!redis) return mem.word;
  return (await redis.get<string>(WORD_KEY)) ?? null;
}

export async function getVersion(): Promise<number> {
  if (!redis) return mem.version;
  return (await redis.get<number>(VERSION_KEY)) ?? 0;
}

export async function setWord(word: string): Promise<number> {
  const normalized = word.toLowerCase();
  if (!redis) {
    mem.word = normalized;
    mem.version += 1;
    return mem.version;
  }
  await redis.set(WORD_KEY, normalized);
  return await redis.incr(VERSION_KEY);
}

export function storageAvailable(): boolean {
  return redis !== null;
}
