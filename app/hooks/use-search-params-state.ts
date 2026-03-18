"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options<T> = {
  serialize?: (value: T) => string | null;
  deserialize?: (value: string | null) => T;
};

function useSearchParamsState<T = string>(
  key: string,
  defaultValue: T,
  options?: Options<T>,
): [T, (value: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serialize = useMemo(
    () => options?.serialize ?? ((v: T) => (v ? String(v) : null)),
    [options?.serialize],
  );

  const deserialize = useMemo(
    () =>
      options?.deserialize ??
      ((v: string | null) => (v === null ? defaultValue : (v as T))),
    [options?.deserialize, defaultValue],
  );

  const value = deserialize(searchParams.get(key));

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams);
      const serialized = serialize(newValue);

      if (serialized === null || serialized === "") {
        params.delete(key);
      } else {
        params.set(key, serialized);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [key, router, searchParams, serialize],
  );

  return [value, setValue];
}

export { useSearchParamsState };
