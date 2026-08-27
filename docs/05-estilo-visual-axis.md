# 05 · Estilo visual: copiar Axis

La app debe **verse como una extensión de Axis**. No hay que diseñar de cero: los archivos de
`estilo-axis/` son los originales de Axis, copiados tal cual (sin lógica de negocio).

## Concepto: "Liquid Glass Espacial"
Fondo con nebulosa (aurora animada) + campo de estrellas + grano fino; superficies de vidrio
translúcido con borde iridiscente; modo claro (lavanda) y modo oscuro (espacio profundo).

## Tokens (CSS variables en `:root` y `.dark`)
| Token | Claro | Oscuro | Uso |
|-------|-------|--------|-----|
| `--accent` | `#7c3aed` | `#a78bfa` | acción principal, activo |
| `--accent-cyan` | `#0891b2` | `#22d3ee` | secundario, datos |
| `--accent-magenta` | `#d946ef` | `#e879f9` | acento, gradientes |
| `--success` / `--danger` | `#0a7f57` / `#e5484d` | `#34d399` / `#ff6369` | estados |
| `--bg` | `#f2f1fa` | `#08081a` | fondo |
| `--surface`, `--surface-strong`, `--surface-solid` | blancos translúcidos | azules oscuros translúcidos | tarjetas |
| `--text-1/2/3` | `#17162b` / `#535070` / `#6b6788` | `#f2f1fc` / `#aca8cc` / `#676285` | jerarquía de texto |

Los contrastes ya están ajustados a WCAG AA (comentado en el CSS). No los bajes.

## Tipografía (Google Fonts vía `next/font`)
- **Sora** (500–800) → `--font-display`: títulos, marca. Clase `.font-display`.
- **Instrument Sans** → `--font-body`: todo el texto.
- **Geist Mono** → `--font-geist-mono`: ids, códigos, cifras tabulares.

## Clases utilitarias propias (en `globals.css`)
`.glass` · `.glass-strong` · `.glass-hover` · `.btn-accent` · `.btn-ghost` · `.chip` ·
`.input-glass` · `.table-glass` · `.nav-item` · `.rise` (animación de entrada) ·
`.skeleton` (en `skeleton.tsx`). No hay shadcn ni Radix: Axis prefiere clases propias. Si
necesitas un componente nuevo (modal, drawer, toast), créalo con estas clases para que encaje.

## Shell de la app (layout)
- `estilo-axis/layout.tsx`: layout raíz con las 3 fuentes y el script que aplica el tema antes
  del primer render (evita el parpadeo). Cambia el título a "Sinergéticos Mailing".
- `estilo-axis/sidebar.tsx` + `nav-links.tsx`: sidebar de vidrio colapsable (desktop) y topbar
  (móvil), con el logo `orb.png` y la marca `Synergy <span accent>Axis</span>` → cambia a
  `Sinergéticos <span accent>Mailing</span>` y renombra las claves de `localStorage`
  (`axis-theme`, `axis-sidebar`) a las tuyas.
- Navegación sugerida: Campañas · Listas y segmentos · Plantillas · Reportes · Supresión · Ajustes.
- `icons.tsx`: set de íconos SVG en línea (agrega `IconMail`, `IconList`, `IconChart` en el mismo estilo:
  `stroke="currentColor" strokeWidth="2" strokeLinecap="round"`).

## Reglas de oro
1. Nada de colores nuevos: usa los tokens. Si hace falta uno, agrégalo a `:root` **y** a `.dark`.
2. Todo componente debe verse bien en claro y oscuro (prueba el toggle).
3. Los correos que se mandan **no** usan este estilo (los clientes de correo no soportan vidrio ni
   variables): usan `ejemplos/plantilla-base.html`, con la paleta plana de la marca.
