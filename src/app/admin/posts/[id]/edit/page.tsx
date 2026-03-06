"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AdminPostEditPageProps = {
  params: { id: string };
};

export default function AdminPostEditPage({ params }: AdminPostEditPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified edit page
    router.replace(`/admin/posts/${params.id}`);
  }, [params.id, router]);

  return (
    <section className="space-y-4">
      <p className="text-sm text-gray-500">Redirecting...</p>
    </section>
  );
}
