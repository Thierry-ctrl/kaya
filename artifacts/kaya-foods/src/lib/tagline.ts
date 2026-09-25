export function splitTagline(value: string): string[] {
  const separator = value.indexOf(". ");
  if (separator === -1) return [value];

  return [value.slice(0, separator + 1), value.slice(separator + 2)];
}
