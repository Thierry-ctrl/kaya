import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDirs = [
  path.join(root, "migrations"),
  path.resolve(root, "..", "..", "artifacts", "api-server", "src", "lib", "migrations"),
];
const ssl = process.env.DB_SSL === "true"
  ? {
      rejectUnauthorized: true,
      ...(process.env.DB_CA_CERT_PATH
        ? { ca: await readFile(process.env.DB_CA_CERT_PATH, "utf8") }
        : {}),
    }
  : undefined;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl });

await client.connect();
await client.query("SELECT pg_advisory_lock(hashtext('kaya_db_migrations'))");
try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const files = (await Promise.all(migrationDirs.map(async (dir, index) => {
    try {
      return (await readdir(dir))
        .filter((name) => name.endsWith(".sql"))
        .map((name) => ({
          legacyName: name,
          name: `${index === 0 ? "lib-db" : "api-server"}/${name}`,
          path: path.join(dir, name),
        }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }))).flat().sort((a, b) => a.name.localeCompare(b.name));
  for (const file of files) {
    const name = file.name;
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (exists.rowCount) continue;
    const legacy = await client.query(
      "SELECT applied_at FROM schema_migrations WHERE name = $1",
      [file.legacyName],
    );
    if (legacy.rowCount) {
      await client.query("BEGIN");
      try {
        await client.query(
          "INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
          [name, legacy.rows[0].applied_at],
        );
        await client.query("DELETE FROM schema_migrations WHERE name = $1", [file.legacyName]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      continue;
    }
    const sql = await readFile(file.path, "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      process.stdout.write(`Applied ${name}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext('kaya_db_migrations'))").catch(() => undefined);
  await client.end();
}