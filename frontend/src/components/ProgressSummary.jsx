import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function ProgressSummary({ passed, total, label }) {
  const percent = total === 0 ? 100 : Math.round((passed / total) * 100);
  const isAllPass = passed === total;
  const barColor = "bg-emerald-500";
  const iconColor = isAllPass ? "text-emerald-600" : "text-rose-500";
  const textColor = isAllPass ? "text-emerald-800" : "text-rose-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 size={16} className={iconColor} />
        <span className={textColor}>
          {passed} out of {total} {label}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`${barColor} h-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}
