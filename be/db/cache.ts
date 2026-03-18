"use server";
import { TIMES_IN_SECONDS } from "@/lib/constants";
import { Redis } from "ioredis";
import { parse, stringify } from "superjson";

const redisClient = new Redis(process.env.REDIS_URL!);

const getKey = (key: string) => `TREMOLO:${key}`;

export async function cached<V>(
  fn: () => Promise<V>,
  originalKey: string,
  seconds: number = TIMES_IN_SECONDS.HOUR,
) {
  const key = getKey(originalKey);
  const value = await redisClient.get(key);

  if (value) {
    return parse<V>(value);
  }

  const newValue = await fn();

  await redisClient.setex(key, seconds, stringify(newValue));
  return newValue;
}

export const deleteCacheKey = async (originalKey: string | string[]) => {
  const key = Array.isArray(originalKey)
    ? originalKey.map((k) => getKey(k))
    : getKey(originalKey);
  if (typeof key === "string") {
    await redisClient.del(key);
  } else {
    await redisClient.del(...key);
  }
};
