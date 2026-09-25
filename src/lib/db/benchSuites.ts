import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type { RunParams } from "@/lib/gateways/types";
import type { AttemptOutcome, TestCase } from "@/components/benchmarks/types";

export interface BenchRunConfig {
  selectedGatewayIds: string[];
  runModelIds: string[];
  runParams: RunParams;
  systemPromptVariantsText: string;
  repeatCount: number;
}

export interface BenchSuiteInput {
  name: string;
  testCases: TestCase[];
  runConfig?: BenchRunConfig;
}

export interface BenchSuite extends BenchSuiteInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface BenchSuiteRow {
  id: string;
  name: string;
  test_cases: string;
  run_config: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSuite(row: BenchSuiteRow): BenchSuite {
  return {
    id: row.id,
    name: row.name,
    testCases: JSON.parse(row.test_cases),
    runConfig: row.run_config ? JSON.parse(row.run_config) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listBenchSuites(): BenchSuite[] {
  const rows = getDb().prepare(`SELECT * FROM bench_suites ORDER BY updated_at DESC`).all() as BenchSuiteRow[];
  return rows.map(rowToSuite);
}

export function getBenchSuite(id: string): BenchSuite | null {
  const row = getDb().prepare(`SELECT * FROM bench_suites WHERE id = ?`).get(id) as BenchSuiteRow | undefined;
  return row ? rowToSuite(row) : null;
}

export function createBenchSuite(input: BenchSuiteInput): BenchSuite {
  const id = randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO bench_suites (id, name, test_cases, run_config, created_at, updated_at)
       VALUES (@id, @name, @testCases, @runConfig, @createdAt, @updatedAt)`,
    )
    .run({
      id,
      name: input.name,
      testCases: JSON.stringify(input.testCases),
      runConfig: input.runConfig ? JSON.stringify(input.runConfig) : null,
      createdAt: now,
      updatedAt: now,
    });
  return getBenchSuite(id)!;
}

export function updateBenchSuite(id: string, input: BenchSuiteInput): BenchSuite | null {
  if (!getBenchSuite(id)) return null;
  getDb()
    .prepare(
      `UPDATE bench_suites SET name = @name, test_cases = @testCases, run_config = @runConfig, updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      name: input.name,
      testCases: JSON.stringify(input.testCases),
      runConfig: input.runConfig ? JSON.stringify(input.runConfig) : null,
      updatedAt: new Date().toISOString(),
    });
  return getBenchSuite(id);
}

export function deleteBenchSuite(id: string): boolean {
  const db = getDb();
  db.prepare(`DELETE FROM bench_runs WHERE suite_id = ?`).run(id);
  const info = db.prepare(`DELETE FROM bench_suites WHERE id = ?`).run(id);
  return info.changes > 0;
}

/** A (test case, target) cell's result, stripped of live GatewayConfig (no API keys) so it's safe to persist. */
export interface StoredCell {
  testCaseId: string;
  gatewayId: string;
  gatewayName: string;
  modelId: string;
  variantLabel: string;
  pass: boolean;
  attempts: AttemptOutcome[];
}

export interface BenchRun {
  id: string;
  suiteId: string;
  cells: StoredCell[];
  passCount: number;
  failCount: number;
  createdAt: string;
}

interface BenchRunRow {
  id: string;
  suite_id: string;
  cells: string;
  pass_count: number;
  fail_count: number;
  created_at: string;
}

function rowToRun(row: BenchRunRow): BenchRun {
  return {
    id: row.id,
    suiteId: row.suite_id,
    cells: JSON.parse(row.cells),
    passCount: row.pass_count,
    failCount: row.fail_count,
    createdAt: row.created_at,
  };
}

export function recordBenchRun(suiteId: string, cells: StoredCell[]): BenchRun {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const passCount = cells.filter((c) => c.pass).length;
  const failCount = cells.length - passCount;
  getDb()
    .prepare(
      `INSERT INTO bench_runs (id, suite_id, cells, pass_count, fail_count, created_at)
       VALUES (@id, @suiteId, @cells, @passCount, @failCount, @createdAt)`,
    )
    .run({ id, suiteId, cells: JSON.stringify(cells), passCount, failCount, createdAt });
  return { id, suiteId, cells, passCount, failCount, createdAt };
}

export function listBenchRuns(suiteId: string, limit = 20): BenchRun[] {
  const rows = getDb()
    .prepare(`SELECT * FROM bench_runs WHERE suite_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(suiteId, limit) as BenchRunRow[];
  return rows.map(rowToRun);
}

function cellStableKey(c: StoredCell): string {
  return `${c.testCaseId}::${c.gatewayId}::${c.modelId}::${c.variantLabel}`;
}

/** Test cases that passed in the previous run for this suite but fail (or are missing) in the latest one. */
export function findRegressions(suiteId: string): StoredCell[] {
  const [latest, previous] = listBenchRuns(suiteId, 2);
  if (!latest || !previous) return [];
  const prevPassed = new Map(previous.cells.filter((c) => c.pass).map((c) => [cellStableKey(c), c]));
  return latest.cells.filter((c) => !c.pass && prevPassed.has(cellStableKey(c)));
}
