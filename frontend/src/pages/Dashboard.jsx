import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, Zap, Award, Code, FileText, Users } from "lucide-react";
import CustomCalendar from "../components/CustomCalendar";

const CODING_TIMER_STORAGE_KEY = "mockverse-total-coding-timer";
const INITIAL_CODING_SECONDS = 10 * 60 * 60;

const mainSections = [
  {
    id: "practice",
    title: "Practice",
    desc: "Solve topic-wise problems and improve logic.",
    icon: <Code size={24} />,
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "quiz",
    title: "Quiz",
    desc: "Quick MCQs to test your core concepts.",
    icon: <Zap size={24} />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "mock",
    title: "Mock Test",
    desc: "Simulate real interview environments.",
    icon: <FileText size={24} />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "public",
    title: "Public",
    desc: "Join community challenges and contests.",
    icon: <Users size={24} />,
    color: "from-emerald-500 to-teal-400",
  },
];

export default function Dashboard({ onOpenPractice, darkMode }) {
  const [codingSeconds, setCodingSeconds] = useState(() => {
    if (typeof window === "undefined") return INITIAL_CODING_SECONDS;

    try {
      const stored = window.localStorage.getItem(CODING_TIMER_STORAGE_KEY);
      if (!stored) return INITIAL_CODING_SECONDS;

      const parsed = JSON.parse(stored);
      const baseSeconds =
        typeof parsed.accumulatedSeconds === "number"
          ? parsed.accumulatedSeconds
          : INITIAL_CODING_SECONDS;
      const lastUpdatedAt =
        typeof parsed.lastUpdatedAt === "number" ? parsed.lastUpdatedAt : Date.now();

      return baseSeconds + Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
    } catch (err) {
      console.error("Failed to load coding timer:", err);
      return INITIAL_CODING_SECONDS;
    }
  });

  useEffect(() => {
    const tick = () => {
      try {
        const stored = window.localStorage.getItem(CODING_TIMER_STORAGE_KEY);
        const now = Date.now();

        if (!stored) {
          const initialState = {
            accumulatedSeconds: INITIAL_CODING_SECONDS,
            lastUpdatedAt: now,
          };
          window.localStorage.setItem(CODING_TIMER_STORAGE_KEY, JSON.stringify(initialState));
          setCodingSeconds(INITIAL_CODING_SECONDS);
          return;
        }

        const parsed = JSON.parse(stored);
        const accumulatedSeconds =
          typeof parsed.accumulatedSeconds === "number"
            ? parsed.accumulatedSeconds
            : INITIAL_CODING_SECONDS;
        const lastUpdatedAt =
          typeof parsed.lastUpdatedAt === "number" ? parsed.lastUpdatedAt : now;
        const elapsedSeconds = Math.max(0, Math.floor((now - lastUpdatedAt) / 1000));
        const nextSeconds = accumulatedSeconds + elapsedSeconds;

        window.localStorage.setItem(
          CODING_TIMER_STORAGE_KEY,
          JSON.stringify({
            accumulatedSeconds: nextSeconds,
            lastUpdatedAt: now,
          }),
        );

        setCodingSeconds(nextSeconds);
      } catch (err) {
        console.error("Failed to update coding timer:", err);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const formatCodingTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Coding", val: formatCodingTime(codingSeconds), icon: <Clock size={16} className="text-blue-500" /> },
              { label: "Solved", val: "128", icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
              { label: "Streak", val: "12 Days", icon: <Zap size={16} className="text-orange-500" /> },
              { label: "Rank", val: "#1,204", icon: <Award size={16} className="text-purple-500" /> },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl border transition-all bg-white text-slate-900 border-gray-100 shadow-sm dark:bg-[#24303F] dark:text-slate-200 dark:border-[#313D4A]"
              >
                <div className="p-1.5 w-fit rounded-lg mb-1.5 bg-gray-50 dark:bg-[#1A222C]">
                  {stat.icon}
                </div>
                <p className="text-lg font-bold">{stat.val}</p>
                <p className="text-[9px] opacity-50 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl border transition-colors bg-blue-50 border-blue-200 dark:bg-[#24303F] dark:border-[#313D4A]">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Boost your streak!</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">Solve 2 more problems today to keep your activity alive.</p>
            <div className="w-full h-1.5 bg-blue-200/60 dark:bg-[#1A222C] rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto flex justify-center">
          <CustomCalendar darkMode={darkMode} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainSections.map((section) => (
          <div
            key={section.id}
            className="group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white border-gray-100 shadow-sm dark:bg-[#24303F] dark:border-[#313D4A]"
          >
            <div
              className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${section.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}
            />
            <div className="p-5 space-y-4">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-md`}
              >
                {section.icon}
              </div>
              <h3 className="text-base font-bold">{section.title}</h3>
              <p className="text-[11px] opacity-60 line-clamp-2 leading-snug">{section.desc}</p>
              <button
                onClick={() => section.id === "practice" && onOpenPractice()}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                  section.id === "practice"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                    : darkMode
                    ? "bg-[#313D4A] hover:bg-[#3C4A5A] text-slate-300"
                    : "bg-gray-50 hover:bg-gray-100 text-slate-600"
                }`}
              >
                Open Workspace
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
