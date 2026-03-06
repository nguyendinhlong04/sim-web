import Link from "next/link";

type ProductCardProps = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export default function ProductCard({
  title,
  description,
  href,
  ctaLabel,
}: ProductCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <Link
        className="mt-4 inline-flex items-center text-sm font-medium text-blue-600"
        href={href}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
