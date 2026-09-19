import { describe, expect, it } from "vitest";
import { validateProductRules } from "../lib/product-validation";

describe("product validation rules", () => {
  it("requires a size for available products", () => {
    expect(validateProductRules({ availability: "available", sizes: [] }))
      .toBe("Available products require at least one size");
  });

  it("rejects duplicate stable size IDs", () => {
    expect(validateProductRules({
      availability: "coming_soon",
      sizes: [{ id: "250g" }, { id: "250g" }],
    })).toBe("Duplicate size IDs are not allowed");
  });

  it("accepts distinct sizes", () => {
    expect(validateProductRules({
      availability: "available",
      sizes: [{ id: "250g" }, { id: "500g" }],
    })).toBeUndefined();
  });
});