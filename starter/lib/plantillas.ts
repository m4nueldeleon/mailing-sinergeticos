/**
 * Motor de plantillas: bloques → HTML/texto plano, ensamblado con la marca, y
 * sustitución de variables. Sin secretos aquí a propósito — se usa tanto en
 * el editor (cliente, para la vista previa) como en el servidor (al mandar).
 */

export type Block =
  | { id: string; type: "titulo"; texto: string }
  | { id: string; type: "texto"; texto: string }
  | { id: string; type: "boton"; texto: string; url: string }
  | { id: string; type: "imagen"; src: string; alt: string }
  | { id: string; type: "separador" };

export function nuevoBloque(type: Block["type"]): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "titulo":
      return { id, type, texto: "{{first_name|Hola}}, " };
    case "texto":
      return { id, type, texto: "" };
    case "boton":
      return { id, type, texto: "Ver más", url: "https://" };
    case "imagen":
      return { id, type, src: "", alt: "" };
    case "separador":
      return { id, type };
  }
}

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bloques → HTML del cuerpo (sin envolver todavía en la plantilla de marca). */
export function renderBloques(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "titulo":
          return `<h1>${escapar(b.texto)}</h1>`;
        case "texto":
          return `<p>${escapar(b.texto).replace(/\n/g, "<br>")}</p>`;
        case "boton":
          return `<p style="margin:24px 0"><a class="btn" href="${escapar(b.url)}">${escapar(b.texto)}</a></p>`;
        case "imagen":
          return `<img src="${escapar(b.src)}" alt="${escapar(b.alt)}" style="max-width:100%;border-radius:12px;display:block" />`;
        case "separador":
          return `<hr style="border:none;border-top:1px solid #e6e3f3;margin:24px 0" />`;
      }
    })
    .join("\n");
}

/** Bloques → texto plano (siempre debe ir junto al HTML — buena entregabilidad). */
export function renderTextoPlano(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "titulo":
          return b.texto;
        case "texto":
          return b.texto;
        case "boton":
          return `${b.texto}: ${b.url}`;
        case "imagen":
          return b.alt ? `[Imagen: ${b.alt}]` : "";
        case "separador":
          return "----------";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Texto plano de emergencia para HTML crudo: solo tags fuera, sin intentar ser fiel al layout. */
export function textoDesdeHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sustituye {{var}} y {{var|default}}. Variables sin valor ni default quedan vacías. */
export function renderVariables(texto: string, vars: Record<string, string | undefined>): string {
  return texto.replace(/\{\{\s*([a-z_]+)(?:\|([^}]*))?\s*\}\}/gi, (_m, clave: string, porDefecto?: string) => {
    const valor = vars[clave];
    return valor && valor.trim() ? valor : (porDefecto ?? "");
  });
}

const ESTILO = `
  body { margin:0; padding:0; background:#f2f1fa; }
  .wrap { width:100%; background:#f2f1fa; padding:32px 12px; }
  .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e6e3f3; }
  .head { background:linear-gradient(135deg,#7c3aed,#d946ef); padding:28px 32px; color:#ffffff; font-family:Arial,Helvetica,sans-serif; }
  .head .brand { font-size:20px; font-weight:800; letter-spacing:-0.3px; }
  .body { padding:32px; font-family:Arial,Helvetica,sans-serif; color:#17162b; font-size:16px; line-height:1.55; }
  .body h1 { font-size:24px; margin:0 0 16px; color:#17162b; }
  .body p { margin:0 0 16px; }
  .btn { display:inline-block; background:#7c3aed; color:#ffffff !important; text-decoration:none; padding:14px 26px; border-radius:999px; font-weight:700; }
  .foot { padding:20px 32px 28px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.5; color:#6b6788; border-top:1px solid #e6e3f3; }
  .foot a { color:#6d28d9; }
  .pre { display:none; font-size:1px; color:#f2f1fa; line-height:1px; max-height:0; overflow:hidden; }
`;

export interface DatosCorreo {
  subject: string;
  preheader: string;
  blocks: Block[];
}

/**
 * Ensambla el HTML final con la marca (mismo look que ejemplos/plantilla-base.html:
 * cabecera, cuerpo por bloques, pie con dirección y baja obligatoria).
 * `{{unsubscribe_url}}` y `{{first_name|Hola}}` quedan como placeholders — se
 * resuelven por destinatario con renderVariables() al momento de mandar.
 */
export function ensamblarCorreo({ subject, preheader, blocks }: DatosCorreo): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(subject)}</title>
<style>${ESTILO}</style>
</head>
<body>
<span class="pre">${escapar(preheader)}</span>
<div class="wrap">
  <div class="card">
    <div class="head"><div class="brand">Sinergéticos</div></div>
    <div class="body">
      ${renderBloques(blocks)}
    </div>
    <div class="foot">
      Recibes este correo porque te registraste, compraste o eres miembro de Sinergéticos.<br>
      Sinergéticos · [Dirección física legal — pendiente] · Zapopan, Jalisco, México<br>
      <a href="{{unsubscribe_url}}">Darme de baja</a> · <a href="https://www.sinergeticos.com/privacidad">Aviso de privacidad</a>
    </div>
  </div>
</div>
</body>
</html>`;
}
