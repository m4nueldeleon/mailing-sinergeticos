import type { MetadataRoute } from "next";

// App interna: fuera de buscadores.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
