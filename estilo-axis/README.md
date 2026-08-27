# estilo-axis/

Archivos **originales de Axis** (CRM de Sinergéticos), copiados sin lógica de negocio, para que la
app de mailing se vea igual. Cómo usarlos: `docs/05-estilo-visual-axis.md`.

| Archivo | Qué es | Dónde va en tu app |
|---------|--------|--------------------|
| `globals.css` | Tokens, tema claro/oscuro, aurora de fondo, clases `.glass`, `.btn-accent`, `.chip`, `.table-glass`, `.input-glass`, `.nav-item`, animaciones | `app/globals.css` |
| `layout.tsx` | Layout raíz con Sora + Instrument Sans + Geist Mono y el script anti-parpadeo del tema | `app/layout.tsx` |
| `sidebar.tsx` | Sidebar de vidrio colapsable (desktop) | `app/(dashboard)/sidebar.tsx` |
| `nav-links.tsx` | Links de navegación con ícono y estado activo | `app/(dashboard)/nav-links.tsx` |
| `theme-toggle.tsx` | Botón claro/oscuro | `components/theme-toggle.tsx` |
| `icons.tsx` | Íconos SVG en línea | `components/icons.tsx` |
| `skeleton.tsx` | Placeholders de carga | `components/skeleton.tsx` |
| `orb.png` | Logo/orbe de la marca (`/public/brand/orb.png`) | `public/brand/orb.png` |

Requiere Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/postcss`). Se quitó la
`Campanita` (notificaciones internas de Axis) del sidebar; el resto está intacto.
