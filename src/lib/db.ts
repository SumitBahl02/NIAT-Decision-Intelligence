import "server-only";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error(
      "CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing. Database connection cannot be established."
    );
  }
  return url;
}

export const dbPool =
  globalThis.__dbPool ||
  new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dbPool = dbPool;
}

export async function queryServerDb<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await dbPool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
