"use client";

import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Options<T> = {
  serialize?: (value: T) => string | null;
  deserialize?: (value: string | null) => T;
  debounceMs?: number;
};

function useSearchParamsState<T = string>(
  key: string,
  defaultValue: T,
  options?: Options<T>,
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const debounceMs = options?.debounceMs ?? 500;

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

  const urlValue = deserialize(searchParams.get(key));
  const [value, setValue] = useState(urlValue);

  const updateUrl = (newValue: T) => {
    const params = new URLSearchParams(window.location.search);
    const serialized = serialize(newValue);

    if (serialized === null || serialized === "") {
      params.delete(key);
    } else {
      params.set(key, serialized);
    }

    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, {
    wait: debounceMs,
  });

  const setValueDebounced = (newValue: T) => {
    setValue(newValue);
    debouncedUpdateUrl(newValue);
  };

  return [value, setValueDebounced];
}

export { useSearchParamsState };
