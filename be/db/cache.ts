"use server";
import { TIMES_IN_SECONDS } from "@/lib/constants";
import { Redis } from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL!);

const getKey = (key: string) => `TREMOLO:${key}`;

export async function cached<V>(
  fn: () => Promise<V>,
  originalKey: string,
  seconds: number = TIMES_IN_SECONDS.HOUR,
) {
  const key = getKey(originalKey);
  const value = await redisClient.get(key);
  const parsedValue = value ? JSON.parse(value) : undefined;

  if (parsedValue) {
    return parsedValue as V;
  }

  const newValue = await fn();

  await redisClient.setex(key, seconds, JSON.stringify(newValue));
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
