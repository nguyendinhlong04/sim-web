import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VisitorTracker from "@/components/visitor/VisitorTracker";
import ChatWidget from "@/components/chat/ChatWidget";
import { getSiteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const [t, config] = await Promise.all([
    getTranslations({ locale: params.locale, namespace: "Home" }),
    getSiteConfig(),
  ]);

  const siteName = config.companyName || "Company Website";

  return {
    title: siteName,
    description: t("heroSubtitle"),
    openGraph: {
      title: siteName,
      description: t("heroSubtitle"),
      locale: params.locale,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  if (!locales.includes(params.locale as (typeof locales)[number])) {
    notFound();
  }

  const [messages, config] = await Promise.all([
    getMessages(),
    getSiteConfig(),
  ]);

  const siteConfig = {
    companyName: config.companyName,
    companyDesc: config.companyDesc,
    companyAddress: config.companyAddress,
    companyPhone: config.companyPhone,
    companyEmail: config.companyEmail,
    logoUrl: config.logoUrl,
  };

  const chatTranslations = (messages as Record<string, Record<string, string>>).Chat || {};

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <Header locale={params.locale} siteConfig={siteConfig} />
      <VisitorTracker />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      <Footer siteConfig={siteConfig} />
      <ChatWidget
        locale={params.locale}
        translations={{
          title: chatTranslations.title || "Chat with us",
          placeholder: chatTranslations.placeholder || "Type a message...",
          offline: chatTranslations.offline || "No agents online",
          preChatTitle: chatTranslations.preChatTitle || "Start a conversation",
          preChatName: chatTranslations.preChatName || "Your name (optional)",
          preChatEmail: chatTranslations.preChatEmail || "Your email (optional)",
          startChat: chatTranslations.startChat || "Start chat",
          skip: chatTranslations.skip || "Skip",
          ratingTitle: chatTranslations.ratingTitle || "Rate this conversation",
          ratingThanks: chatTranslations.ratingThanks || "Thank you for your feedback!",
          connecting: chatTranslations.connecting || "Connecting...",
        }}
      />
    </NextIntlClientProvider>
  );
}
