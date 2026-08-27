import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** Token HMAC por correo: sin él nadie puede dar de baja a otros a granel. */
export function tokenBaja(email: string): string {
  const secret = env.unsubscribeSecret();
  if (!secret) throw new Error("Falta UNSUBSCRIBE_SECRET");
  return createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
}

export function tokenBajaValido(email: string, token: string): boolean {
  if (!email || !token) return false;
  const esperado = Buffer.from(tokenBaja(email));
  const recibido = Buffer.from(token);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

export function urlBaja(email: string): string {
  return `${env.appUrl()}/baja?e=${encodeURIComponent(email)}&t=${tokenBaja(email)}`;
}

/** Cabeceras que Gmail/Yahoo exigen a remitentes masivos (one-click unsubscribe, RFC 8058). */
export function cabecerasBaja(email: string, mailtoBaja: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${urlBaja(email)}>, <mailto:${mailtoBaja}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
