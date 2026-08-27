import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCIA_SEG = 5 * 60;

/**
 * Verifica la firma Svix de un webhook de Resend (misma técnica que usa Axis).
 * Firmar SIEMPRE sobre el body crudo; si se parsea y re-serializa, la firma deja de coincidir.
 */
export function firmaSvixValida(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  rawBody: string,
): boolean {
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCIA_SEG) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", key).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest();
  return svixSignature.split(" ").some((parte) => {
    const [version, firma] = parte.split(",");
    if (version !== "v1" || !firma) return false;
    const recibida = Buffer.from(firma, "base64");
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  });
}
