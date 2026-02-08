import Link from "next/link";

interface StatsCardProps {
  icon: string;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}

export function StatsCard({
  icon,
  label,
  value,
  href,
  highlight = false,
}: StatsCardProps) {
  return (
    <Link href={href}>
      <div
        className={`
          bg-white rounded-2xl p-4 border transition-all hover:shadow-md cursor-pointer
          ${highlight && value > 0 ? "border-indigo-200 ring-2 ring-indigo-100" : "border-gray-200"}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
