"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PostTranslation = {
  title: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  content: string;
  excerpt?: string | null;
  featuredImg?: string | null;
};

type Post = {
  id: string;
  slug: string;
  category: string | null;
  publishedAt: string | null;
  author: { name: string };
  translations: PostTranslation[];
};

type NewsDetailPageProps = {
  params: { slug: string };
};

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const items: Post[] = data.items ?? [];
        const found = items.find((p) => p.slug === params.slug);
        setPost(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, params.slug]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading...</p>;
  }

  if (!post) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{t("newsDetail")} — not found.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const translation = post.translations[0];
  const title = translation?.title ?? post.slug;
  const content = translation?.content ?? "";
  const featuredImg = translation?.featuredImg;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href={`/${locale}/tin-tuc`}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        &larr; {t("news")}
      </Link>

      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {post.category && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {post.category}
            </span>
          )}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.author?.name && <span>· {post.author.name}</span>}
        </div>
      </header>

      {/* Featured Image */}
      {featuredImg && (
        <div className="overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImg}
            alt={title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      {content ? (
        <div
          className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:underline prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-base text-gray-600">{t("newsDetailDesc")}</p>
      )}
    </article>
  );
}
