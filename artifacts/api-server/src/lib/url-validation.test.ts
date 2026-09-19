import { describe, expect, it } from "vitest";
import { isSafeImageUrl, isSafeSocialUrl } from "./url-validation";

describe("stored URL policy", () => {
  it("accepts safe local, media, and canonical HTTPS image URLs", () => {
    expect(isSafeImageUrl("/images/products/jam.webp")).toBe(true);
    expect(isSafeImageUrl("/api/media/123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isSafeImageUrl("https://cdn.example.com/photos/jam.webp")).toBe(true);
  });

  it("rejects traversal, executable, protocol-relative, credential, and ambiguous URLs", () => {
    for (const value of [
      "/images/../secret",
      "/images/a.webp?x=1",
      "/images/a\\b.webp",
      "javascript:alert(1)",
      "data:image/png;base64,x",
      "//cdn.example.com/a.webp",
      "https://user:pass@cdn.example.com/a.webp",
      "https://cdn.example.com/a b.webp",
    ]) {
      expect(isSafeImageUrl(value), value).toBe(false);
    }
  });

  it("restricts social links to canonical provider HTTPS URLs", () => {
    expect(isSafeSocialUrl("", "instagram")).toBe(true);
    expect(isSafeSocialUrl("https://www.instagram.com/kaya", "instagram")).toBe(true);
    expect(isSafeSocialUrl("https://facebook.com/kaya", "facebook")).toBe(true);
    expect(isSafeSocialUrl("https://evil.example/kaya", "instagram")).toBe(false);
    expect(isSafeSocialUrl("https://user@instagram.com/kaya", "instagram")).toBe(false);
  });
});