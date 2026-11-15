import React from "react";

/**
 * MockVerse brand mark — traced from the official logo.
 * White ribbon adapts to theme (slate in light mode), blue ribbons are fixed brand colours.
 */
export function LogoMark({ className = "h-8 w-auto" }) {
  return (
    <svg
      viewBox="30 28 804 416"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        className="fill-slate-900 dark:fill-[#F4F4F4]"
        d="M35 408 L258 96 Q298 36 375 34 Q440 33 490 78 L566 145 L445 147 Q410 150 392 178 L245 380 Q228 408 200 408 Z"
      />
      <path
        fill="#3F86F6"
        d="M405 178 L568 300 L568 412 Q570 434 592 440 L430 342 Q405 328 405 305 Z"
      />
      <path
        fill="#0351E0"
        d="M568 300 L705 118 Q720 100 740 92 L829 33 L829 210 L652 418 Q627 442 594 441 Q568 436 568 412 Z"
      />
    </svg>
  );
}

const SIZES = {
  sm: {
    mark: "h-7 w-auto",
    divider: "h-7 mx-3",
    word: "text-[1.4rem]",
    tag: "mt-1 text-[8px] tracking-[0.28em]",
  },
  lg: {
    mark: "h-11 w-auto",
    divider: "h-12 mx-3.5",
    word: "text-[2.1rem]",
    tag: "mt-1.5 text-[8.5px] tracking-[0.28em]",
  },
};

/**
 * MockVerse brand lockup: mark | MockVerse + "CODE • PRACTICE • INTERVIEW".
 * `size` — "sm" (header) or "lg" (login / hero).
 * `tagline` — show the tagline under the wordmark.
 */
export default function Logo({ onClick, tagline = false, size = "sm", className = "" }) {
  const s = SIZES[size] || SIZES.sm;

  const content = (
    <span className={`flex items-center ${className}`}>
      <LogoMark className={`${s.mark} flex-shrink-0`} />
      <span
        className={`${s.divider} w-px flex-shrink-0 bg-slate-300 dark:bg-slate-500/70`}
        aria-hidden="true"
      />
      <span className="flex flex-col leading-none" style={{ fontFamily: "Montserrat, Inter, system-ui, sans-serif" }}>
        <span className={`${s.word} font-bold tracking-tight`}>
          <span className="text-slate-900 dark:text-[#F7F7F7]">Mock</span>
          <span className="text-[#1463F0] dark:text-[#1B6AF3]">Verse</span>
        </span>
        {tagline && (
          <span
            className={`${s.tag} ${size === "sm" ? "hidden lg:flex" : "flex"} items-center gap-[0.7em] font-medium uppercase text-slate-500 dark:text-slate-200`}
          >
            Code<span className="text-[#1B6AF3]">•</span>Practice<span className="text-[#1B6AF3]">•</span>Interview
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
