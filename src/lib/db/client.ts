import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app.db");

let instance: Database.Database | null = null;

/** Adds a column to an existing table if it's not already there -- SQLite's ADD COLUMN has no IF NOT EXISTS form. */
function addColumnIfMissing(db: Database.Database, table: string, column: string, ddl: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS run_history (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      gateway_id TEXT NOT NULL,
      gateway_name TEXT NOT NULL,
      model TEXT,
      latency_ms INTEGER,
      success INTEGER NOT NULL,
      error_message TEXT,
      prompt_preview TEXT,
      usage TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_run_history_created_at ON run_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_run_history_gateway_id ON run_history(gateway_id);

    CREATE TABLE IF NOT EXISTS model_pricing (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      gateway_id TEXT,
      model_id TEXT NOT NULL,
      prompt_per_1m REAL,
      completion_per_1m REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      fetched_at TEXT NOT NULL,
      capabilities TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_model_pricing_catalog
      ON model_pricing(model_id) WHERE source = 'openrouter';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_model_pricing_manual
      ON model_pricing(gateway_id, model_id) WHERE source = 'manual';

    CREATE TABLE IF NOT EXISTS latency_samples (
      id TEXT PRIMARY KEY,
      gateway_id TEXT NOT NULL,
      gateway_name TEXT NOT NULL,
      latency_ms INTEGER,
      success INTEGER NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_latency_samples_created_at ON latency_samples(created_at);
    CREATE INDEX IF NOT EXISTS idx_latency_samples_gateway_id ON latency_samples(gateway_id);

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      chosen_gateway_id TEXT,
      chosen_gateway_name TEXT,
      chosen_model_id TEXT,
      rationale TEXT,
      alternatives TEXT,
      linked_run_ids TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);

    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      transport TEXT NOT NULL,
      command TEXT,
      args TEXT,
      url TEXT,
      headers TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mcp_test_runs (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      success INTEGER NOT NULL,
      error_message TEXT,
      latency_ms INTEGER,
      tools TEXT,
      resources TEXT,
      prompts TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_test_runs_server_id ON mcp_test_runs(server_id);
    CREATE INDEX IF NOT EXISTS idx_mcp_test_runs_created_at ON mcp_test_runs(created_at);

    CREATE TABLE IF NOT EXISTS mcp_agent_runs (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      gateway_id TEXT NOT NULL,
      gateway_name TEXT NOT NULL,
      model TEXT,
      params TEXT,
      prompt TEXT NOT NULL,
      tool_names TEXT,
      success INTEGER NOT NULL,
      error_message TEXT,
      latency_ms INTEGER,
      usage TEXT,
      steps TEXT,
      final_text TEXT,
      turns INTEGER,
      hit_max_turns INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mcp_agent_runs_server_id ON mcp_agent_runs(server_id);
    CREATE INDEX IF NOT EXISTS idx_mcp_agent_runs_created_at ON mcp_agent_runs(created_at);

    CREATE TABLE IF NOT EXISTS bench_suites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      test_cases TEXT NOT NULL,
      run_config TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bench_runs (
      id TEXT PRIMARY KEY,
      suite_id TEXT NOT NULL,
      cells TEXT NOT NULL,
      pass_count INTEGER NOT NULL,
      fail_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bench_runs_suite_id ON bench_runs(suite_id);
    CREATE INDEX IF NOT EXISTS idx_bench_runs_created_at ON bench_runs(created_at);
  `);

  addColumnIfMissing(db, "run_history", "response_text", "response_text TEXT");
  addColumnIfMissing(db, "model_pricing", "capabilities", "capabilities TEXT");
}

/** Lazily opens (and migrates) the shared app database, reused across calls in this process. */
export function getDb(): Database.Database {
  if (instance) return instance;
  mkdirSync(DATA_DIR, { recursive: true });
  instance = new Database(DB_FILE);
  instance.pragma("journal_mode = WAL");
  migrate(instance);
  return instance;
}
