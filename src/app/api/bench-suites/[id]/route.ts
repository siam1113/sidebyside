import { NextResponse } from "next/server";
import {
  deleteBenchSuite,
  findRegressions,
  getBenchSuite,
  listBenchRuns,
  updateBenchSuite,
  type BenchSuiteInput,
} from "@/lib/db/benchSuites";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const suite = getBenchSuite(id);
  if (!suite) return NextResponse.json({ error: "Suite not found" }, { status: 404 });
  return NextResponse.json({ suite, runs: listBenchRuns(id), regressions: findRegressions(id) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as BenchSuiteInput | null;
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const updated = updateBenchSuite(id, body);
  if (!updated) return NextResponse.json({ error: "Suite not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteBenchSuite(id);
  if (!ok) return NextResponse.json({ error: "Suite not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
