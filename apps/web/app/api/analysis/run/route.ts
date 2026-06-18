import { NextResponse } from "next/server";
import { createAnalysisRunner } from "../../../../src/modules/analysis-runner";
import { prisma } from "../../../../src/persistence/prisma";
import { createPrismaSignalRepository } from "../../../../src/persistence/repositories";

export async function POST(request: Request) {
  const body = await request.json();
  const runner = createAnalysisRunner({
    workerUrl: process.env.ANALYSIS_WORKER_URL ?? "http://localhost:8000",
  });
  const repository = createPrismaSignalRepository(prisma);

  const decision = await runner.runAnalysis(body);
  const saved = await repository.saveSignal(body.workspaceId, decision);

  return NextResponse.json({
    signalId: saved.id,
    decision,
  });
}
