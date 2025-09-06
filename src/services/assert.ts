export function assertNonEmpty(value: string | undefined | null, name: string): asserts value is string {
  if (!value) {
    throw new Error(`${name} must be a non-empty string`);
  }
}
