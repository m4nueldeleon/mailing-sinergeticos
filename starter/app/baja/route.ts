import { NextResponse, type NextRequest } from "next/server";
import { tokenBajaValido } from "@/lib/baja";
import { agregarSupresion } from "@/lib/supresion";

export const runtime = "nodejs";

function pagina(titulo: string, texto: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <body style="font-family:Arial,sans-serif;background:#f2f1fa;margin:0;padding:48px 16px;text-align:center;color:#17162b">
     <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:40px 28px;border:1px solid #e6e3f3">
     <h1 style="font-size:26px;margin:0 0 12px">${titulo}</h1><p style="font-size:18px;line-height:1.5;margin:0">${texto}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function procesar(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("e") ?? "").toLowerCase().trim();
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!tokenBajaValido(email, token)) return pagina("Liga inválida", "Esta liga de baja no es válida o ya caducó.", 400);
  await agregarSupresion(email, "baja");
  return pagina("Listo ✅", `${email} ya no recibirá más correos de Sinergéticos.`);
}

/** Liga del pie del correo (clic humano). */
export async function GET(req: NextRequest) {
  return procesar(req);
}

/** One-click unsubscribe (RFC 8058): Gmail/Yahoo mandan POST con List-Unsubscribe=One-Click. */
export async function POST(req: NextRequest) {
  return procesar(req);
}
