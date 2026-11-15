import React from "react";

/**
 * MockVerse brand lockup.
 * `mark` — the MV monogram (white left peak + blue right peak).
 * `tagline` — optional "CODE · PRACTICE · INTERVIEW" line.
 */
export default function Logo({ onClick, tagline = false, className = "" }) {
  const content = (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mv-blue" x1="24" y1="10" x2="44" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#60a5fa" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          {/* Left half of M — adapts to theme */}
          <path
            d="M7 38 V15 L19 29"
            className="text-slate-900 dark:text-white"
            stroke="currentColor"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right half of M (blue) */}
          <path
            d="M19 29 L31 15 V38"
            stroke="url(#mv-blue)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="flex flex-col leading-none">
        <span className="text-[1.35rem] font-black tracking-tight">
          <span className="text-slate-900 dark:text-white">Mock</span>
          <span className="text-blue-600 dark:text-blue-500">Verse</span>
        </span>
        {tagline && (
          <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500 lg:block">
            Code&nbsp;&nbsp;·&nbsp;&nbsp;Practice&nbsp;&nbsp;·&nbsp;&nbsp;Interview
          </span>
        )}
      </span>
    </span>
  );

  if (!onClick) {
    return <div className="flex items-center">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center rounded-lg p-1 -m-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      aria-label="MockVerse — go to dashboard"
    >
      {content}
    </button>
  );
}
