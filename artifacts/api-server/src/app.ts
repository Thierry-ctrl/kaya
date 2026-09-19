import express, { type Express } from "express";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { validateAdminOrigin } from "./middlewares/csrf-origin";

const app: Express = express();
if (process.env.NODE_ENV === "production") {
  if (!process.env.APP_ORIGIN) throw new Error("APP_ORIGIN is required in production");
  const appOrigin = new URL(process.env.APP_ORIGIN);
  if (appOrigin.protocol !== "https:" || appOrigin.origin !== process.env.APP_ORIGIN) {
    throw new Error("APP_ORIGIN must be a canonical HTTPS origin in production");
  }
}
// The workspace reverse proxy connects locally. Never trust arbitrary forwarding
// headers from non-local clients; AWS explicitly opts into its single nginx hop.
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : "loopback");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
    ...(process.env.APP_ORIGIN ? { authorizedParties: [process.env.APP_ORIGIN] } : {}),
  })),
);
app.use("/api/admin", (_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});
app.use("/api/admin", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));
app.use("/api/admin", validateAdminOrigin);

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  req.log.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
