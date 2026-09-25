import { NextResponse } from "next/server";
import { getBenchSuite, recordBenchRun, type StoredCell } from "@/lib/db/benchSuites";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getBenchSuite(id)) return NextResponse.json({ error: "Suite not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { cells?: StoredCell[] } | null;
  if (!body || !Array.isArray(body.cells)) {
    return NextResponse.json({ error: "cells is required" }, { status: 400 });
  }
  return NextResponse.json(recordBenchRun(id, body.cells), { status: 201 });
}
