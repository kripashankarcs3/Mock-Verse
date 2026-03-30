import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { runCode } from "./services/api";
import { auth, signOut } from "./services/firebase";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ProblemsPage from "./pages/ProblemsPage";
import cppLogo from "./assets/cpp-logo.svg";
import javaLogo from "./assets/java-logo.svg";
import mockTantraKnot from "./assets/mockverse-logo.png";
import AppShell from "./components/AppShell";
import DashboardPremium, {
  AnalyticsPlaceholder,
  SettingsPlaceholder,
} from "./components/DashboardPremium";

const QUESTION_STORAGE_KEY = "mini-leetcode-saved-questions";
const MOCK_STORAGE_KEY = "mini-leetcode-saved-mocks";
const VISIT_ACTIVITY_STORAGE_KEY = "mocktantra-visit-activity";
const DARK_PREF_KEY = "mockverse-dark";

const languageOptions = {
  cpp: {
    label: "C++",
    shortLabel: "C++",
    logo: cppLogo,
    editorLanguage: "cpp",
  },
  java: {
    label: "Java",
    shortLabel: "Java",
    logo: javaLogo,
    editorLanguage: "java",
  },
};

const defaultProblem = `Franky has an array Arr of size N. He needs to find the Kth maximum element from the given array.

Example:
If the original array is [11, 12, 11, 500, 450] and the value of K = 2, then the 2nd maximum element in the given array is 450, where the 1st maximum is 500.

Input Format:
- The first line of input contains an integer N representing the size of the array.
- The second line contains N space-separated integers representing the elements of the array Arr.
- The third line contains an integer K, which indicates the Kth largest element in the array N when sorted (including duplicates).

Output Format:
- Output the Kth maximum element in the array.

Constraints:
- 1 <= N <= 10000
- -100000 <= Arr[i] <= 100000
- 1 <= K <= N`;

const defaultTestCases = [
  { input: "5\n11 12 11 500 450\n2", expectedOutput: "450" },
  { input: "4\n11 11 11 11\n2", expectedOutput: "11" },
];

function createDefaultQuestion() {
  return {
    id: 1,
    label: "Question 1",
    title: "1.3.3. Kth Max Element in an Array",
    statement: defaultProblem,
    language: "cpp",
    code: "",
    testCases: defaultTestCases,
  };
}

function sanitizeLoadedQuestions(questions) {
  return questions.map((question, index) => ({
    ...question,
    id: question.id ?? index + 1,
    label: question.label || `Question ${index + 1}`,
    title: question.title || `Question ${index + 1}`,
    statement: question.statement || "",
    language: languageOptions[question.language] ? question.language : "cpp",
    code: typeof question.code === "string" ? question.code : "",
    testCases:
      Array.isArray(question.testCases) && question.testCases.length > 0
        ? question.testCases
        : [{ input: "", expectedOutput: "" }],
  }));
}

function sanitizeLoadedMocks(mocks) {
  return mocks.map((mock, index) => ({
    ...mock,
    id: mock.id ?? index + 1,
    title: mock.title || `Mock Test ${index + 1}`,
    durationMinutes: Number(mock.durationMinutes) > 0 ? Number(mock.durationMinutes) : 30,
    questionIds: Array.isArray(mock.questionIds) ? mock.questionIds : [],
  }));
}

function formatSeconds(value) {
  const total = Math.max(0, value);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatVisitKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildUserProfile(email) {
  const safeEmail = email?.trim() || "coder@mocktantra.dev";
  const username = safeEmail.split("@")[0] || "coder";
  const titleCasedName = username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    fullName: titleCasedName || "MockTantra User",
    role: "Full Stack Learner",
    email: safeEmail,
    avatar: "",
    initials: (titleCasedName || "MU")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

function configureEditorTheme(monaco) {
  monaco.editor.defineTheme("mocktantra-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f3f5f8",
      "editor.lineHighlightBackground": "#eef1f5",
      "editorGutter.background": "#f3f5f8",
    },
  });

  monaco.editor.defineTheme("mocktantra-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#2d3d45",
      "editor.lineHighlightBackground": "#3b4f58",
      "editorGutter.background": "#2d3d45",
    },
  });
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function ActivityCalendar({ activityMap }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  const getIntensityClass = (day) => {
    const key = formatVisitKey(new Date(currentYear, currentMonth, day));
    const seconds = activityMap[key] || 0;

    if (seconds >= 1800) return "bg-emerald-700 text-white";
    if (seconds >= 900) return "bg-emerald-600 text-white";
    if (seconds >= 300) return "bg-emerald-500 text-white";
    if (seconds > 0) return "bg-emerald-200 text-emerald-900";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="rounded-[30px] border border-white/70 bg-white/88 p-2.5 pb-2 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Monthly Code Activity
          </p>
          <h3 className="mt-1 text-[1.45rem] font-bold text-slate-800">{monthLabel}</h3>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Visits
        </div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={`day-${day}`}
            className={`flex h-7 items-center justify-center rounded-lg text-xs font-semibold ${getIntensityClass(day)}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-100" />
          No Visit
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-200" />
          Short Visit
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Regular
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-700" />
          Deep Focus
        </span>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  open,
  onToggle,
  onClose,
  onLogout,
  onProfileChange,
  onAvatarUpload,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (open && containerRef.current && !containerRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-3">
      <div className="hidden text-right md:block">
        <p className="text-sm font-semibold text-white">{profile.fullName}</p>
        <p className="text-xs text-slate-400">{profile.role}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-[#103f7d] to-[#18c8ea] text-sm font-bold text-white shadow-sm transition hover:opacity-95"
      >
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.fullName} className="h-full w-full object-cover" />
        ) : (
          profile.initials
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-16 z-20 w-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(15,23,42,0.88)] shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Signed in as</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#312e81] via-[#4f46e5] to-[#14b8a6] text-base font-black text-white">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  profile.initials
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{profile.fullName}</p>
                <p className="text-sm text-slate-400">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                // Future: open actual profile view
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              My Profile
            </button>
            <button
              type="button"
              onClick={() => setEditOpen((current) => !current)}
              className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                // Future: open settings
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                // Future: support
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Support
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                // Future: resources
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Saved Resources
            </button>
          </div>

          {editOpen ? (
            <div className="border-t border-white/10 bg-white/[0.03] px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#312e81] via-[#4f46e5] to-[#14b8a6] text-xl font-black text-white">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.fullName} className="h-full w-full object-cover" />
                  ) : (
                    profile.initials
                  )}
                </div>
                <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(event) => onProfileChange("fullName", event.target.value)}
                  placeholder="Full Name"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-100 outline-none placeholder:text-slate-500"
                />
                <input
                  type="text"
                  value={profile.role}
                  onChange={(event) => onProfileChange("role", event.target.value)}
                  placeholder="Role"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-100 outline-none placeholder:text-slate-500"
                />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  disabled
                  placeholder="Email"
                  className="h-11 w-full cursor-not-allowed rounded-2xl border border-white/5 bg-white/5 px-4 text-slate-500 outline-none"
                />
              </div>
            </div>
          ) : null}

          <div className="border-t border-white/10 px-6 py-5">
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModeIcon({ type }) {
  const common = "h-7 w-7";

  if (type === "practice") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "quiz") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 20c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 2.034.99 3.865 2.57 5.146.38.308.63.76.63 1.25V20l2.43-1.042c.438-.188.929-.204 1.377-.045.629.224 1.303.337 1.993.337Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9.5 10.5a2.5 2.5 0 1 1 4.018 1.985c-.535.405-1.018.86-1.018 1.515V14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path d="M13 3l7 7-4.5 1.5L14 16l-3.5 1.5L9 22l-2-6.5L2 13l4.5-1.5L8 7l5-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13 3l-2.5 8.5L2 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ title, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function SampleCases({ testCases, open, onToggle, locked = false }) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-colors">
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        className="flex w-full items-center justify-between px-6 py-5 text-left disabled:cursor-default"
      >
        <span className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Sample Test Cases</span>
        <span className="text-3xl text-slate-500 dark:text-slate-400">{open ? "-" : "+"}</span>
      </button>

      {open ? (
        <div className="space-y-8 border-t border-slate-100 dark:border-slate-800 px-6 py-6">
          {testCases.map((testCase, index) => (
            <div key={`sample-${index}`} className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Test Case {index + 1}</h3>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-sky-100 dark:border-slate-800 bg-sky-50 dark:bg-[#0b1121] px-4 py-3 shadow-inner">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Input
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-[1.02rem] text-slate-700 dark:text-slate-300">
                    {testCase.input}
                  </pre>
                </div>
                <div className="rounded-2xl border border-emerald-100 dark:border-slate-800 bg-emerald-50 dark:bg-[#0b1121] px-4 py-3 shadow-inner">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Expected Output
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-[1.02rem] text-slate-700 dark:text-slate-300">
                    {testCase.expectedOutput}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EditableCaseRow({ index, testCase, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Test Case {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="rounded-lg border border-rose-200 dark:border-rose-900/50 px-3 py-1 text-sm font-medium text-rose-500 dark:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={testCase.input}
          onChange={(event) => onChange("input", event.target.value)}
          className="min-h-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1121] px-4 py-3 text-slate-700 dark:text-slate-200 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 shadow-inner"
          placeholder="Input"
        />
        <textarea
          value={testCase.expectedOutput}
          onChange={(event) => onChange("expectedOutput", event.target.value)}
          className="min-h-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1121] px-4 py-3 text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-400 dark:focus:border-emerald-500 shadow-inner"
          placeholder="Expected output"
        />
      </div>
    </div>
  );
}

function ResultCase({ result, expanded, onToggle, fixed = false }) {
  const passed = result.status === "Passed";
  const durationMs = typeof result.durationMs === "number" ? result.durationMs : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        disabled={fixed}
        className="flex w-full items-center justify-between px-5 py-4 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}
          >
            {passed ? "✓" : "!"}
          </span>
          <span className="text-[1.05rem] font-medium text-slate-700">Test case {result.testcase}</span>
          {durationMs !== null ? (
            <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-sm font-semibold text-white">
              {durationMs} ms
            </span>
          ) : null}
          {passed ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Passed
            </span>
          ) : null}
        </div>
        {!fixed ? <span className="text-2xl leading-none text-slate-500">{expanded ? "⌃" : "⌄"}</span> : null}
      </button>

      {expanded ? (
        <div className="grid gap-4 border-t border-slate-100 px-5 py-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[1.05rem] font-semibold text-slate-500">Expected output</p>
            <pre className="min-h-24 whitespace-pre-wrap rounded-2xl border-t border-slate-100 bg-white p-0 pt-3 font-mono text-base leading-8 text-slate-700">
              {result.expected || "(empty output)"}
            </pre>
          </div>
          <div>
            <p className="mb-3 text-[1.05rem] font-semibold text-slate-500">Actual output</p>
            <pre className="min-h-24 whitespace-pre-wrap rounded-2xl border-t border-slate-100 bg-white p-0 pt-3 font-mono text-base leading-8 text-slate-700">
              {result.actual || "(empty output)"}
            </pre>
          </div>
          {result.error ? (
            <div className="lg:col-span-2">
              <p className="mb-3 text-[1.05rem] font-semibold text-rose-500">Error</p>
              <pre className="whitespace-pre-wrap rounded-2xl bg-rose-50 p-4 font-mono text-base text-rose-700">
                {result.error}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExplorerPanel({ open, savedQuestions, selectedQuestionId, onSelect, onAddQuestion, onClose }) {
  return (
    <aside
      className={`absolute left-0 top-0 z-30 h-full w-[320px] border-r border-slate-300 dark:border-slate-800 bg-[#dbe4f1] dark:bg-slate-900 shadow-xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 bg-[#f5f7fb] dark:bg-slate-950 px-4 py-4 transition-colors">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Explorer
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Question Library</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-4 transition-colors">
        <button
          type="button"
          onClick={onAddQuestion}
          className="w-full rounded-2xl bg-[#18c69d] dark:bg-[#0f766e] px-4 py-3 text-lg font-bold text-[#08352c] dark:text-white transition-colors hover:brightness-110"
        >
          + New Question
        </button>
      </div>
      <div className="h-[calc(100%-146px)] overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {savedQuestions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(question.id)}
              className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                selectedQuestionId === question.id
                  ? "bg-[#0b1f44] dark:bg-slate-700 text-white"
                  : "bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.15em] opacity-80">
                {question.label}
              </p>
              <p className="mt-1 text-lg font-semibold">{question.title || "Untitled Question"}</p>
              <p className="mt-2 text-sm opacity-80">{question.testCases.length} test case(s)</p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function QuizSection({ savedQuestions, onOpenPractice, onBack, embedded = false }) {
  return (
    <div
      className={
        embedded
          ? "w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8"
          : "page-shell min-h-screen bg-[#edf3fb] px-6 py-8 md:px-10"
      }
    >
      <SectionHeader
        title="Quiz Mode"
        subtitle="Choose a question and jump into a focused single-question challenge."
        action={
          embedded ? null : (
            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
            >
              Back to Dashboard
            </button>
          )
        }
      />
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {savedQuestions.map((question) => (
          <div key={question.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{question.label}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">{question.title}</h2>
            <p className="mt-3 line-clamp-4 text-base leading-7 text-slate-500">
              {question.statement || "No problem statement provided."}
            </p>
            <button
              type="button"
              onClick={() => onOpenPractice(question.id)}
              className="mt-6 rounded-2xl bg-[#0b1f44] px-5 py-3 font-semibold text-white"
            >
              Start Quiz Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockBuilder({
  savedQuestions,
  savedMocks,
  mockTitle,
  setMockTitle,
  mockDuration,
  setMockDuration,
  selectedMockQuestionIds,
  toggleMockQuestion,
  createMock,
  startMock,
  editMock,
  deleteMock,
  onBack,
  embedded = false,
}) {
  return (
    <div
      className={
        embedded
          ? "w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8"
          : "page-shell min-h-screen bg-[#edf3fb] px-6 py-8 md:px-10"
      }
    >
      <SectionHeader
        title="Mock Test Studio"
        subtitle="Build a timed test, save it, and attempt it whenever you want."
        action={
          embedded ? null : (
            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
            >
              Back to Dashboard
            </button>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Create a Mock Test</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={mockTitle}
              onChange={(event) => setMockTitle(event.target.value)}
              placeholder="Mock test title"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
            />
            <input
              type="number"
              min="1"
              value={mockDuration}
              onChange={(event) => setMockDuration(event.target.value)}
              placeholder="Duration in minutes"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
            />
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-700">Select Questions</h3>
            <div className="mt-4 space-y-3">
              {savedQuestions.map((question) => {
                const checked = selectedMockQuestionIds.includes(question.id);
                return (
                  <label
                    key={question.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
                      checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMockQuestion(question.id)}
                      className="mt-1 h-5 w-5"
                    />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                        {question.label}
                      </p>
                      <p className="text-lg font-semibold text-slate-800">{question.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{question.testCases.length} test case(s)</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={createMock}
            className="mt-6 rounded-2xl bg-[#18c69d] px-6 py-3 text-lg font-bold text-[#08352c]"
          >
            Create Mock Test
          </button>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Saved Mock Tests</h2>
          <div className="mt-5 space-y-4">
            {savedMocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-slate-500">
                No mock tests created yet.
              </div>
            ) : null}
            {savedMocks.map((mock) => (
              <div key={mock.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Mock Test</p>
                <h3 className="mt-2 text-xl font-bold text-slate-800">{mock.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {mock.questionIds.length} question(s) • {mock.durationMinutes} minute(s)
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startMock(mock.id)}
                    className="rounded-2xl bg-[#0b1f44] px-5 py-3 font-semibold text-white"
                  >
                    Start Mock Test
                  </button>
                  <button
                    type="button"
                    onClick={() => editMock(mock.id)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMock(mock.id)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockAttempt({
  mock,
  question,
  currentIndex,
  totalQuestions,
  remainingSeconds,
  response,
  onCodeChange,
  onLanguageChange,
  onRun,
  onPrev,
  onNext,
  onFinish,
  loading,
  darkMode,
}) {
  return (
    <div className="page-shell min-h-screen bg-[#edf3fb] px-6 py-8 md:px-10">
      <SectionHeader
        title={mock.title}
        subtitle={`Question ${currentIndex + 1} of ${totalQuestions}`}
        action={
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 px-5 py-3 text-lg font-bold text-rose-600">
              Time Left: {formatSeconds(remainingSeconds)}
            </div>
            <button
              type="button"
              onClick={onFinish}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
            >
              Finish Test
            </button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">{question.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-600">
              {question.statement || "No problem statement provided."}
            </p>
          </div>
          <SampleCases testCases={question.testCases} open locked onToggle={() => {}} />
          {response?.results?.length ? (
            <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  title="Passed"
                  value={response.results.filter((item) => item.status === "Passed").length}
                  accent="text-emerald-600"
                />
                <StatCard
                  title="Failed"
                  value={response.results.filter((item) => item.status !== "Passed").length}
                  accent="text-rose-600"
                />
                <StatCard title="Question Score" value={response.fullPass ? "1" : "0"} accent="text-slate-800" />
              </div>
              {response.results.map((result) => (
                <ResultCase
                  key={`mock-result-${question.id}-${result.testcase}`}
                  result={result}
                  expanded
                  fixed
                  onToggle={() => {}}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Editor</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {languageOptions[response?.language || question.language || "cpp"].label} Solution
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={response?.language || question.language || "cpp"}
                onChange={(event) => onLanguageChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 outline-none"
              >
                {Object.entries(languageOptions).map(([value, option]) => (
                  <option key={value} value={value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onRun}
                disabled={loading}
                className="rounded-2xl bg-[#18c69d] px-6 py-3 text-lg font-bold text-[#08352c] disabled:opacity-60"
              >
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <Editor
              beforeMount={configureEditorTheme}
              height="560px"
              language={languageOptions[response?.language || question.language || "cpp"].editorLanguage}
              value={response?.code || question.code}
              onChange={(value) => onCodeChange(value || "")}
              theme={darkMode ? "mocktantra-dark" : "mocktantra-light"}
              options={{
                minimap: { enabled: false },
                fontSize: 18,
                scrollBeyondLastLine: false,
                padding: { top: 18 },
              }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex === totalQuestions - 1}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSummary({ result, onBack }) {
  return (
    <div className="page-shell min-h-screen bg-[#edf3fb] px-6 py-8 md:px-10">
      <SectionHeader
        title="Mock Test Summary"
        subtitle="Final results for your completed timed assessment."
        action={
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
          >
            Back to Mock Tests
          </button>
        }
      />
      <div className="grid gap-5 md:grid-cols-4">
        <StatCard title="Mock Test" value={result.title} accent="text-slate-800" />
        <StatCard title="Total Questions" value={result.totalQuestions} accent="text-slate-800" />
        <StatCard title="Score" value={`${result.score}/${result.totalQuestions}`} accent="text-emerald-600" />
        <StatCard title="Time Used" value={formatSeconds(result.timeUsed)} accent="text-rose-600" />
      </div>
      <div className="mt-8 space-y-4">
        {result.questionBreakdown.map((item, index) => (
          <div key={`summary-${item.questionId}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Question {index + 1}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">{item.title}</h3>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  item.correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {item.correct ? "Passed" : "Not Fully Passed"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MainApp() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) setLeftPanelWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const problemStatementRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.displayName || "Mock-Verse User",
    role: "Full Stack Learner",
    email: currentUser?.email || "coder@mocktantra.dev",
    avatar: currentUser?.photoURL || "",
  });

  const [visitActivity, setVisitActivity] = useState(() => {
    const stored = window.localStorage.getItem(VISIT_ACTIVITY_STORAGE_KEY);
    if (!stored) return {};

    try {
      return JSON.parse(stored);
    } catch (_error) {
      return {};
    }
  });
  const [savedQuestions, setSavedQuestions] = useState(() => {
    const stored = window.localStorage.getItem(QUESTION_STORAGE_KEY);
    if (!stored) return [createDefaultQuestion()];

    try {
      const parsed = JSON.parse(stored);
      return parsed.length > 0 ? sanitizeLoadedQuestions(parsed) : [createDefaultQuestion()];
    } catch (_error) {
      return [createDefaultQuestion()];
    }
  });
  const [savedMocks, setSavedMocks] = useState(() => {
    const stored = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (!stored) return [];

    try {
      return sanitizeLoadedMocks(JSON.parse(stored));
    } catch (_error) {
      return [];
    }
  });
  
  const activeView = location.pathname === "/" ? "dashboard" : 
                     location.pathname.startsWith("/mock-builder") ? "mock-builder" :
                     location.pathname.substring(1) || "dashboard";
  const [selectedQuestionId, setSelectedQuestionId] = useState(savedQuestions[0]?.id ?? 1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem(DARK_PREF_KEY) === "1");
  const [navSidebarCollapsed, setNavSidebarCollapsed] = useState(false);
  const [navMobileOpen, setNavMobileOpen] = useState(false);
  const [shellSearchQuery, setShellSearchQuery] = useState("");
  const [sampleOpen, setSampleOpen] = useState(false);
  const [manageCasesOpen, setManageCasesOpen] = useState(true);
  const [results, setResults] = useState([]);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mockTitle, setMockTitle] = useState("");
  const [mockDuration, setMockDuration] = useState("30");
  const [selectedMockQuestionIds, setSelectedMockQuestionIds] = useState([]);
  const [activeMockAttempt, setActiveMockAttempt] = useState(null);
  const [mockRemainingSeconds, setMockRemainingSeconds] = useState(0);
  const [mockQuestionIndex, setMockQuestionIndex] = useState(0);
  const [mockResponses, setMockResponses] = useState({});
  const [mockLoading, setMockLoading] = useState(false);
  const [mockSummary, setMockSummary] = useState(null);
  const [editingMockId, setEditingMockId] = useState(null);
  const selectedQuestion =
    savedQuestions.find((question) => question.id === selectedQuestionId) ||
    savedQuestions[0];
  const [problemTitle, setProblemTitle] = useState(selectedQuestion.title);
  const [problemStatement, setProblemStatement] = useState(selectedQuestion.statement);
  const [language, setLanguage] = useState(selectedQuestion.language);
  const [code, setCode] = useState(selectedQuestion.code);
  const [testCases, setTestCases] = useState(selectedQuestion.testCases);

  const passedCount = useMemo(
    () => results.filter((result) => result.status === "Passed").length,
    [results]
  );
  const shownProgress = useMemo(
    () => (results.length ? (passedCount / results.length) * 100 : 0),
    [passedCount, results.length]
  );
  const allShownPassed = results.length > 0 && passedCount === results.length;
  const profile = useMemo(() => {
    const derived = buildUserProfile(currentUser?.email || "coder");
    const fullName = profileData.fullName ?? derived.fullName;
    return {
      ...derived,
      ...profileData,
      fullName,
      email: profileData.email ?? derived.email,
      role: profileData.role ?? "Full Stack Learner",
      initials: (fullName || "MU")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
  }, [currentUser, profileData]);

  useEffect(() => {
    window.localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(savedQuestions));
  }, [savedQuestions]);

  useEffect(() => {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(savedMocks));
  }, [savedMocks]);

  useEffect(() => {
    window.localStorage.setItem(DARK_PREF_KEY, darkMode ? "1" : "0");
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem(VISIT_ACTIVITY_STORAGE_KEY, JSON.stringify(visitActivity));
  }, [visitActivity]);



  useEffect(() => {
    setProblemTitle(selectedQuestion.title);
    setProblemStatement(selectedQuestion.statement);
    setLanguage(selectedQuestion.language || "cpp");
    setCode(typeof selectedQuestion.code === "string" ? selectedQuestion.code : "");
    setTestCases(selectedQuestion.testCases);
    setResults([]);
    setResultsVisible(false);
    setExpandedResults({});
    setError("");
    setSampleOpen(false);
  }, [selectedQuestion]);

  const resizeProblemStatement = () => {
    if (!problemStatementRef.current) return;
    problemStatementRef.current.style.height = "auto";
    problemStatementRef.current.style.height = `${problemStatementRef.current.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resizeProblemStatement();
  }, [problemStatement, activeView, selectedQuestionId]);

  useEffect(() => {
    if (!attemptStarted || activeView !== "practice") return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [attemptStarted, activeView]);

  useEffect(() => {
    if (!activeMockAttempt || activeView !== "mock-attempt") return undefined;

    const intervalId = window.setInterval(() => {
      setMockRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeMockAttempt, activeView]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const intervalId = window.setInterval(() => {
      const todayKey = formatVisitKey(new Date());
      setVisitActivity((current) => ({
        ...current,
        [todayKey]: (current[todayKey] || 0) + 60,
      }));
    }, 60000);

    const todayKey = formatVisitKey(new Date());
    setVisitActivity((current) => ({
      ...current,
      [todayKey]: (current[todayKey] || 0) + 60,
    }));

    return () => window.clearInterval(intervalId);
  }, [currentUser]);

  const syncSelectedQuestion = (updates) => {
    setSavedQuestions((current) =>
      current.map((question) =>
        question.id === selectedQuestionId ? { ...question, ...updates } : question
      )
    );
  };

  const openPractice = (questionId = selectedQuestionId) => {
    setSelectedQuestionId(questionId);
    navigate("/practice");
  };

  const handleTestCaseChange = (index, field, value) => {
    setTestCases((current) => {
      const updated = current.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase
      );
      syncSelectedQuestion({ testCases: updated });
      return updated;
    });
  };

  const addTestCase = () => {
    setTestCases((current) => {
      const updated = [...current, { input: "", expectedOutput: "" }];
      syncSelectedQuestion({ testCases: updated });
      return updated;
    });
  };

  const removeTestCase = (index) => {
    setTestCases((current) => {
      const updated = current.filter((_, currentIndex) => currentIndex !== index);
      syncSelectedQuestion({ testCases: updated });
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    setResultsVisible(false);

    try {
      const data = await runCode({ code, language, testCases });
      setResults(data);
      setResultsVisible(true);
      setExpandedResults(
        Object.fromEntries(data.map((item, index) => [item.testcase, index === 0]))
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Submission failed. Check backend and compiler setup."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleResult = (testcase) => {
    setExpandedResults((current) => ({
      ...current,
      [testcase]: !current[testcase],
    }));
  };

  const handleStartAttempt = () => {
    setAttemptStarted(true);
    setElapsedSeconds(0);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileMenuOpen(false);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileData((current) => ({
        ...current,
        avatar: typeof reader.result === "string" ? reader.result : current.avatar,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetCode = () => {
    setCode("");
    setResults([]);
    setResultsVisible(false);
    setExpandedResults({});
    setError("");
    syncSelectedQuestion({ code: "" });
  };

  const goToPreviousQuestion = () => {
    const currentIndex = savedQuestions.findIndex((question) => question.id === selectedQuestionId);
    if (currentIndex <= 0) return;
    setSelectedQuestionId(savedQuestions[currentIndex - 1].id);
  };

  const goToNextQuestion = () => {
    const currentIndex = savedQuestions.findIndex((question) => question.id === selectedQuestionId);
    if (currentIndex === -1 || currentIndex >= savedQuestions.length - 1) return;
    setSelectedQuestionId(savedQuestions[currentIndex + 1].id);
  };

  const handleAddQuestion = () => {
    const nextId =
      savedQuestions.length > 0
        ? Math.max(...savedQuestions.map((question) => question.id)) + 1
        : 1;
    const nextNumber = savedQuestions.length + 1;
    const newQuestion = {
      id: nextId,
      label: `Question ${nextNumber}`,
      title: `Question ${nextNumber}`,
      statement: "",
      language: "cpp",
      code: "",
      testCases: [{ input: "", expectedOutput: "" }],
    };

    setSavedQuestions((current) => [...current, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setSidebarOpen(true);
  };

  const toggleMockQuestion = (questionId) => {
    setSelectedMockQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const createMock = () => {
    if (!mockTitle.trim() || selectedMockQuestionIds.length === 0) return;

    const mockPayload = {
      title: mockTitle.trim(),
      durationMinutes: Number(mockDuration) || 30,
      questionIds: selectedMockQuestionIds,
    };

    if (editingMockId) {
      setSavedMocks((current) =>
        current.map((mock) => (mock.id === editingMockId ? { ...mock, ...mockPayload } : mock))
      );
    } else {
      const nextId =
        savedMocks.length > 0 ? Math.max(...savedMocks.map((mock) => mock.id)) + 1 : 1;

      setSavedMocks((current) => [...current, { id: nextId, ...mockPayload }]);
    }

    setMockTitle("");
    setMockDuration("30");
    setSelectedMockQuestionIds([]);
    setEditingMockId(null);
  };

  const startMock = (mockId) => {
    const mock = savedMocks.find((item) => item.id === mockId);
    if (!mock) return;

    const responses = Object.fromEntries(
      mock.questionIds.map((questionId) => {
        const question = savedQuestions.find((item) => item.id === questionId);
        return [
          questionId,
          {
            language: question?.language || "cpp",
            code: typeof question?.code === "string" ? question.code : "",
            results: [],
            fullPass: false,
          },
        ];
      })
    );

    setActiveMockAttempt(mock);
    setMockRemainingSeconds(mock.durationMinutes * 60);
    setMockQuestionIndex(0);
    setMockResponses(responses);
    setMockSummary(null);
    navigate("/mock-attempt");
  };

  const editMock = (mockId) => {
    const mock = savedMocks.find((item) => item.id === mockId);
    if (!mock) return;

    setEditingMockId(mock.id);
    setMockTitle(mock.title);
    setMockDuration(String(mock.durationMinutes));
    setSelectedMockQuestionIds(mock.questionIds);
    navigate("/mock-builder");
  };

  const deleteMock = (mockId) => {
    setSavedMocks((current) => current.filter((mock) => mock.id !== mockId));

    if (editingMockId === mockId) {
      setEditingMockId(null);
      setMockTitle("");
      setMockDuration("30");
      setSelectedMockQuestionIds([]);
    }
  };

  const currentMockQuestion = activeMockAttempt
    ? savedQuestions.find(
        (question) => question.id === activeMockAttempt.questionIds[mockQuestionIndex]
      )
    : null;

  const updateMockCode = (nextCode) => {
    if (!currentMockQuestion) return;

    setMockResponses((current) => ({
      ...current,
      [currentMockQuestion.id]: {
        ...current[currentMockQuestion.id],
        code: nextCode,
      },
    }));
  };

  const updateMockLanguage = (nextLanguage) => {
    if (!currentMockQuestion || !languageOptions[nextLanguage]) return;

    setMockResponses((current) => ({
      ...current,
      [currentMockQuestion.id]: {
        ...current[currentMockQuestion.id],
        language: nextLanguage,
        code: current[currentMockQuestion.id]?.code || "",
      },
    }));
  };

  const runMockQuestion = async () => {
    if (!currentMockQuestion) return;

    const response = mockResponses[currentMockQuestion.id];
    setMockLoading(true);

    try {
      const data = await runCode({
        code: response.code,
        language: response.language || currentMockQuestion.language || "cpp",
        testCases: currentMockQuestion.testCases,
      });

      const fullPass = data.every((item) => item.status === "Passed");
      setMockResponses((current) => ({
        ...current,
        [currentMockQuestion.id]: {
          ...current[currentMockQuestion.id],
          results: data,
          fullPass,
        },
      }));
    } catch (_error) {
      setMockResponses((current) => ({
        ...current,
        [currentMockQuestion.id]: {
          ...current[currentMockQuestion.id],
          results: [
            {
              testcase: 1,
              status: "Error",
              expected: "",
              actual: "",
              error: "Unable to evaluate this submission.",
            },
          ],
          fullPass: false,
        },
      }));
    } finally {
      setMockLoading(false);
    }
  };

  const finishMockTest = () => {
    if (!activeMockAttempt) return;

    const totalQuestions = activeMockAttempt.questionIds.length;
    const score = activeMockAttempt.questionIds.reduce(
      (sum, questionId) => sum + (mockResponses[questionId]?.fullPass ? 1 : 0),
      0
    );

    setMockSummary({
      title: activeMockAttempt.title,
      totalQuestions,
      score,
      timeUsed: activeMockAttempt.durationMinutes * 60 - mockRemainingSeconds,
      questionBreakdown: activeMockAttempt.questionIds.map((questionId) => {
        const question = savedQuestions.find((item) => item.id === questionId);
        return {
          questionId,
          title: question?.title || "Untitled Question",
          correct: Boolean(mockResponses[questionId]?.fullPass),
        };
      }),
    });

    setActiveMockAttempt(null);
    navigate("/mock-summary");
  };

  useEffect(() => {
    if (activeView === "mock-attempt" && activeMockAttempt && mockRemainingSeconds === 0) {
      finishMockTest();
    }
  }, [mockRemainingSeconds, activeView, activeMockAttempt]);

  const totalVisitMinutes = Math.round(
    Object.values(visitActivity).reduce((sum, seconds) => sum + Number(seconds || 0), 0) / 60
  );
  const activeDays = Object.values(visitActivity).filter((seconds) => Number(seconds) > 0).length;
  const solvedCount = savedQuestions.filter((question) => question.code?.trim()).length;
  const practiceProgress = savedQuestions.length
    ? Math.round((solvedCount / savedQuestions.length) * 100)
    : 0;
  const quizProgress = savedQuestions.length
    ? Math.min(100, Math.round(((savedQuestions.length > 1 ? savedQuestions.length - 1 : 1) / savedQuestions.length) * 100))
    : 0;
  const mockProgress = savedMocks.length ? Math.min(100, 22 + savedMocks.length * 14) : 0;
  const currentStreak = Math.min(14, Math.max(1, activeDays));
  const recentActivity = Object.entries(visitActivity)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .slice(0, 4)
    .map(([date, seconds], index) => ({
      id: `${date}-${index}`,
      label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      text:
        Number(seconds) >= 1800
          ? "Deep focus session completed"
          : Number(seconds) >= 600
            ? "Consistent practice streak maintained"
            : "Quick workspace check-in",
      time: `${Math.max(1, Math.round(Number(seconds) / 60))} min`,
    }));
  const savedProblemHighlights = savedQuestions.slice(0, 4).map((question, index) => ({
    id: question.id,
    title: question.title || `Problem ${index + 1}`,
    language: languageOptions[question.language]?.label || "C++",
    cases: question.testCases.length,
  }));

  const navHighlightId = location.pathname === "/mock-summary" ? "mock-builder" : activeView;

  const handleShellNavigate = (id) => {
    if (id === "practice") {
      openPractice(selectedQuestionId);
    } else {
      navigate(id === "dashboard" ? "/" : `/${id}`);
    }
  };

  const profileSection = (
    <ProfileCard
      profile={profile}
      open={profileMenuOpen}
      onToggle={() => setProfileMenuOpen((current) => !current)}
      onClose={() => setProfileMenuOpen(false)}
      onLogout={handleLogout}
      onProfileChange={handleProfileChange}
      onAvatarUpload={handleAvatarUpload}
    />
  );

  const mainContent = (
    <Routes>
      <Route path="/" element={<DashboardPremium
        solvedCount={solvedCount}
        savedMocks={savedMocks}
        totalVisitMinutes={totalVisitMinutes}
        currentStreak={currentStreak}
        activeDays={activeDays}
        practiceProgress={practiceProgress}
        quizProgress={quizProgress}
        mockProgress={mockProgress}
        savedQuestions={savedQuestions}
        recentActivity={recentActivity}
        savedProblemHighlights={savedProblemHighlights}
        visitActivity={visitActivity}
        onOpenPractice={() => openPractice(selectedQuestionId)}
        onQuiz={() => navigate("/quiz")}
        onMock={() => navigate("/mock-builder")}
      />} />
      <Route path="/analytics" element={<AnalyticsPlaceholder
        solvedCount={solvedCount}
        savedQuestions={savedQuestions}
        savedMocks={savedMocks}
        totalVisitMinutes={totalVisitMinutes}
        visitActivity={visitActivity}
      />} />
      <Route path="/problems" element={<ProblemsPage />} />
      <Route path="/settings" element={<SettingsPlaceholder
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        onLogout={handleLogout}
      />} />
      <Route path="/quiz" element={<QuizSection
        embedded
        savedQuestions={savedQuestions}
        onOpenPractice={openPractice}
        onBack={() => navigate("/")}
      />} />
      <Route path="/mock-builder" element={<MockBuilder
        embedded
        savedQuestions={savedQuestions}
        savedMocks={savedMocks}
        mockTitle={mockTitle}
        setMockTitle={setMockTitle}
        mockDuration={mockDuration}
        setMockDuration={setMockDuration}
        selectedMockQuestionIds={selectedMockQuestionIds}
        toggleMockQuestion={toggleMockQuestion}
        createMock={createMock}
        startMock={startMock}
        editMock={editMock}
        deleteMock={deleteMock}
        onBack={() => navigate("/")}
      />} />
      <Route path="/mock-summary" element={<MockSummary result={mockSummary} onBack={() => navigate("/mock-builder")} />} />
      <Route path="/mock-attempt" element={
        activeMockAttempt && currentMockQuestion ? (
          <MockAttempt
            mock={activeMockAttempt}
            question={currentMockQuestion}
            currentIndex={mockQuestionIndex}
            totalQuestions={activeMockAttempt.questionIds.length}
            remainingSeconds={mockRemainingSeconds}
            response={mockResponses[currentMockQuestion.id]}
            onCodeChange={updateMockCode}
            onLanguageChange={updateMockLanguage}
            onRun={runMockQuestion}
            onPrev={() => setMockQuestionIndex((current) => Math.max(0, current - 1))}
            onNext={() => setMockQuestionIndex((current) => Math.min(activeMockAttempt.questionIds.length - 1, current + 1))}
            onFinish={finishMockTest}
            loading={mockLoading}
            darkMode={darkMode}
          />
        ) : <div className="flex items-center justify-center h-screen text-slate-500">No active mock test.</div>
      } />
      <Route path="/practice" element={
        <div className="relative h-[calc(100dvh-4rem)] min-h-[320px] w-full overflow-hidden bg-[#dbe4f1] text-slate-800 dark:bg-[#2d3d45] dark:text-slate-100">
          <div className="relative flex h-full min-h-0 w-full flex-col">
            <div className="flex flex-1 flex-col xl:flex-row min-h-0 w-full">
              <ExplorerPanel
          open={sidebarOpen}
          savedQuestions={savedQuestions}
          selectedQuestionId={selectedQuestionId}
          onSelect={(questionId) => {
            setSelectedQuestionId(questionId);
            setSidebarOpen(false);
          }}
          onAddQuestion={handleAddQuestion}
          onClose={() => setSidebarOpen(false)}
        />

        <button
          type="button"
          onClick={() => setSidebarOpen((current) => !current)}
          className="absolute left-0 top-32 z-20 flex h-14 w-10 items-center justify-center rounded-r-2xl bg-slate-400/80 text-2xl font-bold text-white backdrop-blur"
        >
          =
        </button>

        <section
          className="relative flex flex-col overflow-hidden border-r border-slate-500 dark:border-slate-800 bg-[#5c6573] dark:bg-[#2d3d45] transition-colors"
          style={{ width: `${Math.max(20, Math.min(leftPanelWidth, 80))}%` }}
        >
          <div className="flex h-[68px] items-center justify-between bg-[#0b1f44] dark:bg-[#182329] px-5 pl-6 text-white transition-colors">
            <div className="flex items-center gap-2">
              <input
                value={problemTitle}
                onChange={(event) => {
                  const value = event.target.value;
                  setProblemTitle(value);
                  syncSelectedQuestion({ title: value });
                }}
                placeholder="Enter question title"
                className="w-[460px] max-w-[460px] border-none bg-transparent text-[1.85rem] font-bold leading-tight text-white outline-none placeholder:text-white/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartAttempt}
                className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {attemptStarted ? "Restart Attempt" : "Start Attempt"}
              </button>
              <span className="inline-flex h-9 items-center rounded-full bg-emerald-400 dark:bg-[#0f766e] px-4 text-lg font-semibold text-[#0b1f44] dark:text-white">
                {formatSeconds(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="h-[calc(100dvh-4rem-68px)] min-h-0 overflow-y-auto px-6 py-6 transition-colors">
            <div className="space-y-6">
              <div>
                <label className="mb-0 block bg-[#5c6573] dark:bg-[#1a262b] px-5 pt-4 text-lg font-bold uppercase tracking-[0.2em] text-slate-100 transition-colors">
                  Problem Statement
                </label>
                  <textarea
                    key={selectedQuestionId}
                    ref={problemStatementRef}
                    value={problemStatement}
                    onChange={(event) => {
                      const value = event.target.value;
                      setProblemStatement(value);
                      syncSelectedQuestion({ statement: value });
                    }}
                    onInput={resizeProblemStatement}
                    placeholder="Enter the problem statement"
                    className="w-full resize-none overflow-hidden rounded-b-2xl border border-slate-400 dark:border-slate-700 border-t-0 bg-[#5c6573] dark:bg-[#2d3d45] px-5 py-5 text-[1.24rem] font-medium leading-10 text-slate-100 outline-none focus:border-sky-400 focus:bg-[#677181] dark:focus:bg-[#3b4f58] transition-colors"
                  />
              </div>

              <SampleCases
                testCases={testCases}
                open={sampleOpen}
                onToggle={() => setSampleOpen((current) => !current)}
              />

              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-[#dfe6f2] dark:bg-slate-800 p-4 shadow-sm transition-colors">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Manage Test Cases</h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setManageCasesOpen((current) => !current)}
                      className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      {manageCasesOpen ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="rounded-xl bg-[#18c69d] dark:bg-[#0f766e] px-4 py-2 font-semibold text-[#0b1f44] dark:text-white transition-colors"
                    >
                      Add Test Case
                    </button>
                  </div>
                </div>
                {manageCasesOpen ? (
                  <div className="space-y-4">
                    {testCases.map((testCase, index) => (
                      <EditableCaseRow
                        key={`edit-case-${index}`}
                        index={index}
                        testCase={testCase}
                        onChange={(field, value) => handleTestCaseChange(index, field, value)}
                        onRemove={() => removeTestCase(index)}
                        canRemove={testCases.length > 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </section>

        <div
          onMouseDown={handleMouseDown}
          className="hidden xl:block w-1.5 cursor-col-resize bg-slate-300 dark:bg-slate-800 hover:bg-sky-400 dark:hover:bg-sky-500 transition-colors z-10"
        />

        <section className="flex-1 grid min-w-0 h-full min-h-0 grid-rows-[auto_1fr] bg-[#edf2f8] dark:bg-[#2d3d45] transition-colors">
          <div className="flex h-[68px] items-center justify-between border-b border-slate-300 dark:border-slate-700 bg-[#edf2f8] dark:bg-[#25363d] px-6 transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-1.5 shadow-sm transition-colors">
                <img
                  src={languageOptions[language].logo}
                  alt={languageOptions[language].label}
                  className="h-full w-full object-contain"
                />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(event) => {
                  const nextLanguage = event.target.value;
                  setLanguage(nextLanguage);
                  const nextCode = code;
                  setCode(nextCode);
                  syncSelectedQuestion({
                    language: nextLanguage,
                    code: nextCode,
                  });
                }}
                className="h-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-lg font-semibold text-slate-700 dark:text-slate-200 outline-none transition-colors"
              >
                {Object.entries(languageOptions).map(([value, option]) => (
                  <option key={value} value={value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleResetCode}
                className="h-9 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 text-lg font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="h-9 rounded-2xl bg-[#18c69d] dark:bg-[#0f766e] px-6 text-lg font-bold text-[#052a23] dark:text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <Editor
              beforeMount={configureEditorTheme}
              height="100%"
              language={languageOptions[language].editorLanguage}
              value={code}
              onChange={(value) => {
                const nextCode = value || "";
                setCode(nextCode);
                syncSelectedQuestion({ code: nextCode });
              }}
              theme={darkMode ? "mocktantra-dark" : "mocktantra-light"}
              options={{
                minimap: { enabled: false },
                fontSize: 20,
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                padding: { top: 18 },
              }}
            />
          </div>

          <div className="border-t border-slate-300 dark:border-slate-700 bg-[#eff3f8] dark:bg-slate-900 px-6 py-4 transition-colors">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-rose-700 dark:text-rose-400 transition-colors">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 text-lg text-slate-600 dark:text-slate-300 transition-colors">
                Running submission...
              </div>
            ) : null}

            {!loading && results.length > 0 && resultsVisible ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm transition-colors">
                      <div className="flex items-center gap-3 text-[1.05rem] font-semibold text-slate-700 dark:text-slate-200">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm text-white ${
                            allShownPassed ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        >
                          {allShownPassed ? "P" : "F"}
                        </span>
                        <span>{passedCount} out of {results.length} shown test case(s) passed</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${shownProgress}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-[1.05rem] font-semibold text-slate-700 dark:text-slate-200">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-sm text-white">
                          F
                        </span>
                        <span>0 out of 0 hidden test case(s) passed</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: "0%" }} />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResultsVisible(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 dark:bg-slate-500 text-xl font-bold text-white transition hover:bg-slate-700 dark:hover:bg-slate-400"
                    aria-label="Hide test cases"
                  >
                    ×
                  </button>
                </div>
                <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1">
                  {results.map((result) => (
                    <ResultCase
                      key={`result-${result.testcase}`}
                      result={result}
                      expanded={Boolean(expandedResults[result.testcase])}
                      onToggle={() => toggleResult(result.testcase)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            </div>
        </section>
        </div> {/* Closes Split Container Scroll Area (2024) */}

        {/* Unified Bottom Bar - Spans Full Width */}
        <div className="z-20 border-t border-slate-300 dark:border-slate-800 bg-[#0b1f44] dark:bg-slate-950 px-6 py-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-400">
                Problem {savedQuestions.findIndex((q) => q.id === selectedQuestionId) + 1} of {savedQuestions.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPreviousQuestion}
                disabled={savedQuestions.findIndex((question) => question.id === selectedQuestionId) <= 0}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                ‹ Previous
              </button>
              <button
                type="button"
                onClick={handleResetCode}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl bg-[#18c69d] dark:bg-[#0f766e] px-6 py-2 text-sm font-bold text-[#052a23] dark:text-white transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Code"}
              </button>
              <button
                type="button"
                onClick={goToNextQuestion}
                disabled={
                  savedQuestions.findIndex((question) => question.id === selectedQuestionId) >=
                  savedQuestions.length - 1
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    } />
  </Routes>
  );

  return (
    <AppShell
      navActiveId={navHighlightId}
      onNavigate={handleShellNavigate}
      darkMode={darkMode}
      onDarkModeChange={setDarkMode}
      sidebarCollapsed={navSidebarCollapsed}
      onSidebarCollapsedChange={setNavSidebarCollapsed}
      mobileOpen={navMobileOpen}
      onMobileOpenChange={setNavMobileOpen}
      profileSection={profileSection}
      searchQuery={shellSearchQuery}
      onSearchChange={setShellSearchQuery}
      contentClassName={activeView === "practice" ? "p-0 overflow-hidden" : "p-0"}
    >
      {mainContent}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
