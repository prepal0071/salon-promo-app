import { Pool } from 'pg';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

let initialized: Promise<void> | null = null;

export function initializeDb(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const client = await getPool().connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS salons (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            tone TEXT NOT NULL DEFAULT '',
            brand_notes TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          INSERT INTO salons (id, name)
          VALUES (1, 'サロン名を設定してください')
          ON CONFLICT (id) DO NOTHING;

          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            salon_id INTEGER NOT NULL REFERENCES salons(id) DEFAULT 1,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS campaigns (
            id SERIAL PRIMARY KEY,
            salon_id INTEGER NOT NULL REFERENCES salons(id) DEFAULT 1,
            theme TEXT NOT NULL,
            month DATE,
            status TEXT NOT NULL DEFAULT 'draft',
            pop_text TEXT NOT NULL DEFAULT '',
            instagram_text TEXT NOT NULL DEFAULT '',
            line_text TEXT NOT NULL DEFAULT '',
            theme_suggestions JSONB,
            generation_meta JSONB,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_campaigns_salon_created
            ON campaigns (salon_id, created_at DESC);
        `);
      } finally {
        client.release();
      }
    })();
  }
  return initialized;
}
