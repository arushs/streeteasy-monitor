"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/swipe", icon: "🔥", label: "Swipe", badge: "5" },
  { href: "/dashboard", icon: "📊", label: "Feed", badge: null },
  { href: "/dashboard/queue", icon: "✉️", label: "Contact Queue", badge: "2" },
  { href: "/dashboard/sent", icon: "📨", label: "Sent", badge: null },
  { href: "/dashboard/saved", icon: "💾", label: "Saved", badge: null },
  { href: "/dashboard/templates", icon: "📝", label: "Templates", badge: null },
  { href: "/dashboard/settings", icon: "⚙️", label: "Settings", badge: null },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-gray-200">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Help / Feedback at bottom */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Need help?</p>
          <p className="text-xs text-gray-600 mb-3">
            Check our setup guide or send feedback.
          </p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Guide →
          </button>
        </div>
      </div>
    </aside>
  );
}
