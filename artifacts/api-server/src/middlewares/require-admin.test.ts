import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuth, limit } = vi.hoisted(() => ({
  getAuth: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@clerk/express", () => ({ getAuth }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(() => ({})) }));
vi.mock("@workspace/db", () => ({
  adminGrantsTable: { clerkUserId: {} },
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit })),
      })),
    })),
  },
}));

import { requireAdmin } from "./require-admin";

function invoke() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const next = vi.fn();
  const res = { locals: {}, status };
  return {
    next,
    res,
    run: () => requireAdmin({} as never, res as never, next),
    status,
  };
}

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without a Clerk session", async () => {
    getAuth.mockReturnValue({ userId: null });
    const subject = invoke();
    await subject.run();
    expect(subject.status).toHaveBeenCalledWith(401);
    expect(subject.next).not.toHaveBeenCalled();
  });

  it("returns 403 without a database grant", async () => {
    getAuth.mockReturnValue({ userId: "user_valid" });
    limit.mockResolvedValue([]);
    const subject = invoke();
    await subject.run();
    expect(subject.status).toHaveBeenCalledWith(403);
  });

  it("exposes the verified admin ID for downstream routes", async () => {
    getAuth.mockReturnValue({ userId: "user_valid" });
    limit.mockResolvedValue([{ clerkUserId: "user_valid" }]);
    const subject = invoke();
    await subject.run();
    expect(subject.res.locals).toMatchObject({ adminUserId: "user_valid", userId: "user_valid" });
    expect(subject.next).toHaveBeenCalledOnce();
  });
});