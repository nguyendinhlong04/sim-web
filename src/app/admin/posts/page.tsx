"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["", "DRAFT", "PUBLISHED"] as const;
const STATUS_LABELS: Record<string, string> = {
  "": "All Status",
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

type PostTranslation = {
  locale: string;
  title: string;
  excerpt?: string | null;
  featuredImg?: string | null;
};

type Post = {
  id: string;
  slug: string;
  status: string;
  category: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string };
  translations: PostTranslation[];
};

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    try {
      const res = await fetch(`/api/admin/posts?${params}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setPosts(data.items ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const getTitle = (p: Post) => {
    const t =
      p.translations.find((t) => t.locale === "vi") ?? p.translations[0];
    return t?.title ?? p.slug;
  };

  const getFeaturedImg = (p: Post) => {
    const t =
      p.translations.find((t) => t.locale === "vi") ?? p.translations[0];
    return t?.featuredImg;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    fetchPosts();
  };

  const toggleStatus = async (p: Post) => {
    const newStatus = p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/admin/posts/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        publishedAt:
          newStatus === "PUBLISHED" && !p.publishedAt
            ? new Date().toISOString()
            : p.publishedAt,
      }),
    });
    fetchPosts();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Posts Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No posts found. Click &quot;New Post&quot; to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getFeaturedImg(p) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getFeaturedImg(p)!}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          IMG
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {getTitle(p)}
                        </div>
                        <div className="text-xs text-gray-400">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {p.category}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.author?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(p.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(p)}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === "PUBLISHED"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/posts/${p.id}`}
                        className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
