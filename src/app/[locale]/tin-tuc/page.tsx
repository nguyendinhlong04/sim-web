"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

type PostTranslation = {
  title: string;
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

export default function NewsPage() {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  const getTitle = (p: Post) => p.translations[0]?.title ?? p.slug;
  const getExcerpt = (p: Post) => p.translations[0]?.excerpt ?? "";
  const getFeaturedImg = (p: Post) => p.translations[0]?.featuredImg;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{t("news")}</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
          No posts available at the moment.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/tin-tuc/${post.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Featured Image */}
              <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                {getFeaturedImg(post) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getFeaturedImg(post)!}
                    alt={getTitle(post)}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Category + Date */}
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  {post.category && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      {post.category}
                    </span>
                  )}
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  {getTitle(post)}
                </h3>

                {/* Excerpt */}
                {getExcerpt(post) && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {getExcerpt(post)}
                  </p>
                )}

                {/* Author */}
                {post.author?.name && (
                  <p className="mt-3 text-xs text-gray-400">
                    {post.author.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
