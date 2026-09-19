import type { RequestHandler } from "express";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const validateAdminOrigin: RequestHandler = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (!origin) {
    res.status(403).json({ error: "Origin header required" });
    return;
  }

  const configured = process.env.APP_ORIGIN;
  const expectedHost = process.env.REPLIT_DEV_DOMAIN ?? req.get("host");
  let allowed = false;
  try {
    const parsed = new URL(origin);
    allowed = configured
      ? parsed.origin === new URL(configured).origin
      : parsed.host === expectedHost && (parsed.protocol === "http:" || parsed.protocol === "https:");
  } catch {
    allowed = false;
  }

  if (!allowed) {
    res.status(403).json({ error: "Invalid request origin" });
    return;
  }
  next();
};