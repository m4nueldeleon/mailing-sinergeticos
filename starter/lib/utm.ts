/**
 * Etiqueta con UTM cada link http(s) del HTML de una campaña — así el sitio
 * de destino (o Analytics/GHL) puede saber que esa visita vino de ESTE
 * correo específico, no de cualquier otra fuente. Se aplica sobre la
 * plantilla cruda, antes de resolver variables — por eso nunca toca
 * `{{unsubscribe_url}}` (todavía no es una URL real en ese momento).
 */
export function agregarUTM(html: string, campaignId: string, campaignName: string): string {
  const campana = encodeURIComponent(campaignName.toLowerCase().replace(/\s+/g, "-").slice(0, 60));
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url: string) => {
    if (url.includes("utm_source=")) return `href="${url}"`;
    const separador = url.includes("?") ? "&" : "?";
    const params = `utm_source=email&utm_medium=email&utm_campaign=${campana}&utm_content=${campaignId}`;
    return `href="${url}${separador}${params}"`;
  });
}
