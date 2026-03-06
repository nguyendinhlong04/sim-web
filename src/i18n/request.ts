import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const resolvedLocale = locales.includes(requested as (typeof locales)[number])
    ? requested!
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
