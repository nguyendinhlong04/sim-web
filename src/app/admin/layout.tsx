import Link from "next/link";
import AdminChatBadge from "@/components/admin/chat/AdminChatBadge";
import SessionWrapper from "@/components/admin/SessionWrapper";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionWrapper>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link className="text-lg font-semibold text-blue-600" href="/admin">
              Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/admin/landing">Landing</Link>
              <Link href="/admin/sim-products">SIM Products</Link>
              <Link href="/admin/posts">Posts</Link>
              <AdminChatBadge />
              <Link href="/admin/analytics">Analytics</Link>
              <Link href="/admin/media">Media</Link>
              <Link href="/admin/settings">Settings</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </SessionWrapper>
  );
}
