import { afterEach, describe, expect, it, vi } from "vitest";
import { validateAdminOrigin } from "./csrf-origin";

const originalOrigin = process.env.APP_ORIGIN;
const originalDevDomain = process.env.REPLIT_DEV_DOMAIN;
afterEach(() => {
  if (originalOrigin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = originalOrigin;
  if (originalDevDomain === undefined) delete process.env.REPLIT_DEV_DOMAIN;
  else process.env.REPLIT_DEV_DOMAIN = originalDevDomain;
});

function invoke(method: string, headers: Record<string, string>) {
  const req = {
    method,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  };
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const next = vi.fn();
  validateAdminOrigin(req as never, { status } as never, next);
  return { json, next, status };
}

describe("validateAdminOrigin", () => {
  it("allows an exact configured origin", () => {
    process.env.APP_ORIGIN = "https://kaya.example";
    const result = invoke("PUT", { origin: "https://kaya.example" });
    expect(result.next).toHaveBeenCalledOnce();
  });

  it("rejects missing and cross-site origins on writes", () => {
    process.env.APP_ORIGIN = "https://kaya.example";
    expect(invoke("POST", {}).status).toHaveBeenCalledWith(403);
    expect(invoke("DELETE", { origin: "https://evil.example" }).status).toHaveBeenCalledWith(403);
  });

  it("does not require Origin on reads", () => {
    expect(invoke("GET", {}).next).toHaveBeenCalledOnce();
  });

  it("uses the trusted development domain instead of forwarded host", () => {
    delete process.env.APP_ORIGIN;
    process.env.REPLIT_DEV_DOMAIN = "trusted.replit.dev";
    expect(invoke("POST", {
      origin: "https://trusted.replit.dev",
      host: "localhost",
      "x-forwarded-host": "evil.example",
    }).next).toHaveBeenCalledOnce();
    expect(invoke("POST", {
      origin: "https://evil.example",
      host: "localhost",
      "x-forwarded-host": "evil.example",
    }).status).toHaveBeenCalledWith(403);
  });
});