import React from "react";
import { CheckCircle2, MinusCircle } from "lucide-react";

export default function ProgressSummary({ passed, total, label }) {
  const hasCases = total > 0;
  const percent = hasCases ? Math.round((passed / total) * 100) : 0;
  const isAllPass = hasCases && passed === total;
  const barColor = isAllPass ? "bg-emerald-500" : "bg-rose-500";
  const iconColor = !hasCases
    ? "text-slate-400"
    : isAllPass
      ? "text-emerald-600"
      : "text-rose-500";
  const textColor = !hasCases
    ? "text-slate-500 dark:text-slate-400"
    : isAllPass
      ? "text-emerald-800 dark:text-emerald-300"
      : "text-rose-600 dark:text-rose-300";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {hasCases ? (
          <CheckCircle2 size={16} className={iconColor} />
        ) : (
          <MinusCircle size={16} className={iconColor} />
        )}
        <span className={textColor}>
          {hasCases ? `${passed} out of ${total} ${label}` : `No ${label.replace(/passed.*/, "").trim()} available`}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-700">
        <div
          className={`${barColor} h-full transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
