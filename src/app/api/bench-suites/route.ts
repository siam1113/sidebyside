import { NextResponse } from "next/server";
import { createBenchSuite, listBenchSuites, type BenchSuiteInput } from "@/lib/db/benchSuites";

export async function GET() {
  return NextResponse.json(listBenchSuites());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as BenchSuiteInput | null;
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!Array.isArray(body.testCases) || body.testCases.length === 0) {
    return NextResponse.json({ error: "at least one test case is required" }, { status: 400 });
  }
  return NextResponse.json(createBenchSuite(body), { status: 201 });
}
