import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/** Diagnóstico rápido: qué está configurado (sin revelar valores). */
export function GET() {
  return NextResponse.json({
    ok: true,
    mailEnabled: env.mailEnabled(),
    dailyCap: env.mailDailyCap(),
    configurado: {
      resend: Boolean(env.resendApiKey()),
      from: Boolean(env.mailFrom()),
      webhook: Boolean(env.resendWebhookSecret()),
      axis: Boolean(env.axisDatabaseUrlRo()),
      db: Boolean(env.databaseUrl()),
      unsubscribe: Boolean(env.unsubscribeSecret()),
    },
  });
}
