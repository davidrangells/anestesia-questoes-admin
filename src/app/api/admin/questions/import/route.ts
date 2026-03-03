export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminRoute";

const execFileAsync = promisify(execFile);

function parseMetric(output: string, label: string) {
  const match = output.match(new RegExp(`${label}:\\s*(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  let tempPath = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Selecione um arquivo .xlsx." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { ok: false, error: "O importador aceita apenas arquivos .xlsx." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    tempPath = path.join("/tmp", `questions-import-${Date.now()}.xlsx`);
    await fs.writeFile(tempPath, buffer);

    const scriptPath = path.join(process.cwd(), "scripts", "sync-questions-from-xlsx.mjs");
    const { stdout, stderr } = await execFileAsync("node", [
      scriptPath,
      `--file=${tempPath}`,
      "--apply",
      "--skip-invalid",
    ]);

    const combinedOutput = [stdout, stderr].filter(Boolean).join("\n").trim();

    return NextResponse.json(
      {
        ok: true,
        summary: {
          rowsRead: parseMetric(combinedOutput, "Linhas lidas"),
          invalidRows: parseMetric(combinedOutput, "Inválidas"),
          created: parseMetric(combinedOutput, "Criadas"),
          updated: parseMetric(combinedOutput, "Atualizadas"),
          deleted: parseMetric(combinedOutput, "Excluídas"),
          warnings: parseMetric(combinedOutput, "Avisos"),
        },
        output: combinedOutput,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar planilha.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => undefined);
    }
  }
}
