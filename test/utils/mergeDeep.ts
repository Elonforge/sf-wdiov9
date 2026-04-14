/**
 * Deep-merge two plain objects.
 * Arrays in `override` replace (not extend) arrays in `base`.
 */
export function mergeDeep<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(override) as Array<keyof T>) {
    const baseVal = base[key];
    const overrideVal = override[key];

    if (
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key as string] = mergeDeep(
        baseVal as Record<string, unknown>,
        overrideVal as Partial<Record<string, unknown>>,
      );
    } else if (overrideVal !== undefined) {
      result[key as string] = overrideVal;
    }
  }

  return result as T;
}
