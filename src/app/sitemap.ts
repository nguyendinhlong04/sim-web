import { locales } from "@/i18n/routing";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap() {
  const routes = ["", "/gioi-thieu", "/tin-tuc", "/lien-he", "/dien", "/home-wifi", "/sim-the"];

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
    }))
  );
}
