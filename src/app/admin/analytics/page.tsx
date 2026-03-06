import AnalyticsChart from "@/components/admin/AnalyticsChart";

export default function AdminAnalyticsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
      <AnalyticsChart />
    </section>
  );
}
