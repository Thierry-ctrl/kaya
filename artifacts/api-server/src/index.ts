import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);
const host = process.env.HOST ?? (process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, host, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ host, port }, "Server listening");
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");

  const forceTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    server.closeAllConnections();
  }, 10_000);
  forceTimer.unref();

  server.close(async (error) => {
    clearTimeout(forceTimer);
    try {
      await pool.end();
    } catch (poolError) {
      logger.error({ err: poolError }, "Failed to close database pool");
      process.exitCode = 1;
    }
    if (error) {
      logger.error({ err: error }, "Failed to close HTTP server");
      process.exitCode = 1;
    }
    logger.info("Graceful shutdown complete");
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
