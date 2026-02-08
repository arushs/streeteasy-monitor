"use client";

interface DailyLimitProgressProps {
  sent: number;
  limit: number;
}

export function DailyLimitProgress({ sent, limit }: DailyLimitProgressProps) {
  const percentage = Math.min((sent / limit) * 100, 100);
  const remaining = limit - sent;
  const isNearLimit = remaining <= 2;
  const isAtLimit = remaining <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-medium text-gray-900">Daily Contacts</span>
        </div>
        <span className="text-sm text-gray-600">
          {sent}/{limit} sent
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
                ? "bg-amber-500"
                : "bg-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {isAtLimit ? (
          <span className="text-red-600">
            You&apos;ve reached today&apos;s limit. Resets at midnight.
          </span>
        ) : isNearLimit ? (
          <span className="text-amber-600">
            {remaining} contact{remaining !== 1 ? "s" : ""} remaining today
          </span>
        ) : (
          <span>Daily limit helps prevent spam filter issues</span>
        )}
      </p>
    </div>
  );
}
