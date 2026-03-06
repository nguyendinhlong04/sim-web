import MediaUploader from "@/components/admin/MediaUploader";

export default function AdminMediaPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
      <MediaUploader />
    </section>
  );
}
