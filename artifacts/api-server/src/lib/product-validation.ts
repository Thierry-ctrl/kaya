export function validateProductRules(data: {
  availability: string;
  sizes: { id: string }[];
}): string | undefined {
  if (data.availability === "available" && data.sizes.length === 0) {
    return "Available products require at least one size";
  }
  if (new Set(data.sizes.map((size) => size.id)).size !== data.sizes.length) {
    return "Duplicate size IDs are not allowed";
  }
  return undefined;
}