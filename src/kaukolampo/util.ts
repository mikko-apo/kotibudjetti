export function iterator<T>(items: T[]) {
  let index = 0;

  return function next(): T {
    if (index >= items.length) {
      throw new Error("No more items available.");
    }

    return items[index++];
  };
}

export function buildArray<T>(count: number, builderFn: (index: number) => T): T[] {
  if (count < 0) {
    throw new Error("Count must be non-negative.");
  }

  return Array.from({ length: count }, (_, i) => builderFn(i));
}

export function arrayToRecord<T, K extends keyof T & PropertyKey>(items: T[], key: K): Record<T[K] & PropertyKey, T> {
  return items.reduce(
    (acc, item) => {
      const recordKey = item[key] as T[K] & PropertyKey;
      acc[recordKey] = item;
      return acc;
    },
    {} as Record<T[K] & PropertyKey, T>,
  );
}
