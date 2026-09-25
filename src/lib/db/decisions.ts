import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export interface DecisionInput {
  title: string;
  chosenGatewayId?: string;
  chosenGatewayName?: string;
  chosenModelId?: string;
  rationale?: string;
  alternatives?: string[];
  linkedRunIds?: string[];
}

export interface Decision extends DecisionInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface DecisionRow {
  id: string;
  title: string;
  chosen_gateway_id: string | null;
  chosen_gateway_name: string | null;
  chosen_model_id: string | null;
  rationale: string | null;
  alternatives: string | null;
  linked_run_ids: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    title: row.title,
    chosenGatewayId: row.chosen_gateway_id ?? undefined,
    chosenGatewayName: row.chosen_gateway_name ?? undefined,
    chosenModelId: row.chosen_model_id ?? undefined,
    rationale: row.rationale ?? undefined,
    alternatives: row.alternatives ? JSON.parse(row.alternatives) : [],
    linkedRunIds: row.linked_run_ids ? JSON.parse(row.linked_run_ids) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listDecisions(): Decision[] {
  const rows = getDb().prepare(`SELECT * FROM decisions ORDER BY created_at DESC`).all() as DecisionRow[];
  return rows.map(rowToDecision);
}

export function getDecision(id: string): Decision | null {
  const row = getDb().prepare(`SELECT * FROM decisions WHERE id = ?`).get(id) as DecisionRow | undefined;
  return row ? rowToDecision(row) : null;
}

export function createDecision(input: DecisionInput): Decision {
  const now = new Date().toISOString();
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO decisions
         (id, title, chosen_gateway_id, chosen_gateway_name, chosen_model_id, rationale, alternatives, linked_run_ids, created_at, updated_at)
       VALUES
         (@id, @title, @chosenGatewayId, @chosenGatewayName, @chosenModelId, @rationale, @alternatives, @linkedRunIds, @createdAt, @updatedAt)`,
    )
    .run({
      id,
      title: input.title,
      chosenGatewayId: input.chosenGatewayId ?? null,
      chosenGatewayName: input.chosenGatewayName ?? null,
      chosenModelId: input.chosenModelId ?? null,
      rationale: input.rationale ?? null,
      alternatives: input.alternatives ? JSON.stringify(input.alternatives) : null,
      linkedRunIds: input.linkedRunIds ? JSON.stringify(input.linkedRunIds) : null,
      createdAt: now,
      updatedAt: now,
    });
  return getDecision(id)!;
}

export function updateDecision(id: string, input: DecisionInput): Decision | null {
  if (!getDecision(id)) return null;
  getDb()
    .prepare(
      `UPDATE decisions SET
         title = @title,
         chosen_gateway_id = @chosenGatewayId,
         chosen_gateway_name = @chosenGatewayName,
         chosen_model_id = @chosenModelId,
         rationale = @rationale,
         alternatives = @alternatives,
         linked_run_ids = @linkedRunIds,
         updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      title: input.title,
      chosenGatewayId: input.chosenGatewayId ?? null,
      chosenGatewayName: input.chosenGatewayName ?? null,
      chosenModelId: input.chosenModelId ?? null,
      rationale: input.rationale ?? null,
      alternatives: input.alternatives ? JSON.stringify(input.alternatives) : null,
      linkedRunIds: input.linkedRunIds ? JSON.stringify(input.linkedRunIds) : null,
      updatedAt: new Date().toISOString(),
    });
  return getDecision(id);
}

export function deleteDecision(id: string): boolean {
  const info = getDb().prepare(`DELETE FROM decisions WHERE id = ?`).run(id);
  return info.changes > 0;
}
