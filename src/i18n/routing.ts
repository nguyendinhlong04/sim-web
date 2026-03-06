export const locales = ["vi", "en", "ja", "th", "fil", "hi", "my", "id"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";
