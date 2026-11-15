import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  CaseUpper,
  Edit3,
  Link2,
  Minus,
  ChevronDown,
  MessageSquare,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  PlusCircle,
  ClipboardPaste,
  Plus,
  Copy,
  Trash2
} from "lucide-react";
import ProgressSummary from "../components/ProgressSummary";
import { runCode } from "../services/api";
import Editor from "@monaco-editor/react";

const sidebarQuestionsDefault = [
  { id: 1, num: "26.1.1", title: "Rod Cutting", difficulty: "Hard" },
  { id: 2, num: "26.1.2", title: "Matrix Chain Multiplication", difficulty: "Hard" },
  { id: 3, num: "26.1.3", title: "Longest Common Subsequence", difficulty: "Medium" },
  { id: 4, num: "26.1.4", title: "0/1 Knapsack", difficulty: "Medium" },
  { id: 5, num: "26.1.5", title: "Coin Change", difficulty: "Easy" },
];

const defaultCodeCpp = `#include<bits/stdc++.h>
using namespace std;

int main(){
    // Write your C++ code here
    return 0;
}`;

const defaultCodeJava = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your Java code here
    }
}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripParsedTestCaseSections = (text = "") =>
  text
    .replace(/SHOWN TEST CASES?:[\s\S]*?(?=HIDDEN TEST CASES?:|$)/gi, "")
    .replace(/HIDDEN TEST CASES?:[\s\S]*$/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractSection = (text, label, nextLabels = []) => {
  const escapedLabel = escapeRegex(label);
  const boundary = nextLabels.length
    ? `(?=\\b(?:${nextLabels.map(escapeRegex).join("|")})\\b\\s*:)`
    : "$";
  const match = text.match(new RegExp(`\\b${escapedLabel}\\b\\s*:\\s*([\\s\\S]*?)${boundary}`, "i"));
  return match?.[1]?.trim() || "";
};

const parseAutoParsedCases = (text, idOffset = 0) => {
  const cleanedText = text
    .replace(/^\s*(?!Input\s*:|Output\s*:)[A-Za-z][A-Za-z0-9 _-]*:\s*$/gim, "")
    .trim();

  return Array.from(
    cleanedText.matchAll(/Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(?:\n\s*Input:)|$)/gi),
  )
    .map((match, index) => {
      const input = match[1]?.trim();
      const output = match[2]?.trim();

      if (!input || output == null) {
        return null;
      }

      return {
        id: Date.now() + idOffset + index,
        input,
        output,
        explanation: "",
      };
    })
    .filter(Boolean);
};

const renderFormattedDescription = (text) =>
  text.split(/(\*\*.*?\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-black dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });

const formatDurationMs = (seconds) => {
  const numericSeconds = Number(seconds);
  if (!Number.isFinite(numericSeconds) || numericSeconds < 0) {
    return "? ms";
  }

  const ms = numericSeconds * 1000;
  if (ms === 0) {
    return "0 ms";
  }
  if (ms < 1) {
    return "<1 ms";
  }
  if (ms < 10) {
    return `${ms.toFixed(2)} ms`;
  }
  if (ms < 100) {
    return `${ms.toFixed(1)} ms`;
  }
  return `${ms.toFixed(0)} ms`;
};

// ── Monaco editor theme (VS Code style, matches dark UI) ────────────────────
const MONACO_DARK_THEME = "mockverse-dark";
const defineMonacoTheme = (monaco) => {
  monaco.editor.defineTheme(MONACO_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#111111",
      "editorGutter.background": "#111111",
      "editor.lineHighlightBackground": "#1b1b1b",
      "editorLineNumber.foreground": "#5c5c5c",
      "editorLineNumber.activeForeground": "#d4d4d4",
      "editorCursor.foreground": "#4ec9b0",
      "editor.selectionBackground": "#264f78",
      "editorIndentGuide.background1": "#2a2a2a",
      "editorIndentGuide.activeBackground1": "#404040",
    },
  });
};

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_QUESTIONS_KEY = "pw_questions";
const LS_ACTIVE_KEY    = "pw_activeQuestion";
const LS_PROBLEMS_KEY  = "pw_problems";   // map: questionId → problemData
const LS_CODES_KEY     = "pw_codes";      // map: questionId → { "C++": code, "Java": code }
const LS_LANGUAGE_KEY  = "pw_language";   // last selected language

const loadLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const saveLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const defaultProblemData = {
  num: "26.1.1",
  title: "Rod Cutting",
  description: "There is a rod of length N with weak points at A1, A2, ..., AM. You must cut the rod at all weak points.\n\nThe cost of a cut is the length of the sub-rod being cut. Minimize the total cost and return the lexicographically smallest sequence of cuts.\n\n**Constraints:**\nInterval DP solution recommended. Time Complexity: O(M³).",
  testCases: [
    { id: 1, input: "6\n3\n1 2 5", output: "12\n1 2 5", explanation: "" },
    { id: 2, input: "10\n2\n3 7", output: "20\n3 7", explanation: "" }
  ],
  hiddenTestCases: []
};

export default function PracticeWorkspace({ onBack, darkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Persisted state ──────────────────────────────────────────────────────
  const [sidebarQuestions, setSidebarQuestionsRaw] = useState(() =>
    loadLS(LS_QUESTIONS_KEY, sidebarQuestionsDefault)
  );
  const [activeQuestion, setActiveQuestionRaw] = useState(() =>
    loadLS(LS_ACTIVE_KEY, sidebarQuestionsDefault[0].id)
  );
  const [allProblems, setAllProblemsRaw] = useState(() =>
    loadLS(LS_PROBLEMS_KEY, {})
  );
  const [allCodes, setAllCodesRaw] = useState(() =>
    loadLS(LS_CODES_KEY, {})
  );

  // Derived: current question's problemData and code
  const [language, setLanguageRaw] = useState(() => loadLS(LS_LANGUAGE_KEY, "C++"));
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Get problemData for active question (null when no question exists)
  const activeQuestionMeta = sidebarQuestions.find((q) => q.id === activeQuestion) || null;
  const problemData = activeQuestionMeta
    ? (allProblems[activeQuestion] || defaultProblemData)
    : null;
  const code =
    allCodes[activeQuestion]?.[language] ??
    (language === "Java" ? defaultCodeJava : defaultCodeCpp);

  // Setters that persist (code/problem writes are debounced for smooth typing)
  const setSidebarQuestions = (val) => {
    const next = typeof val === "function" ? val(sidebarQuestions) : val;
    setSidebarQuestionsRaw(next);
    saveLS(LS_QUESTIONS_KEY, next);
  };
  const setActiveQuestion = (id) => {
    setActiveQuestionRaw(id);
    saveLS(LS_ACTIVE_KEY, id);
  };
  const setProblemData = (val) => {
    setAllProblemsRaw(prev => {
      const current = prev[activeQuestion] || defaultProblemData;
      const next = typeof val === "function" ? val(current) : val;
      return { ...prev, [activeQuestion]: next };
    });
  };
  const setCode = (val) => {
    setAllCodesRaw(prev => {
      const currentQ = prev[activeQuestion] || {};
      return { ...prev, [activeQuestion]: { ...currentQ, [language]: val } };
    });
  };
  const setLanguage = (lang) => {
    setLanguageRaw(lang);
    saveLS(LS_LANGUAGE_KEY, lang);
  };
  // ────────────────────────────────────────────────────────────────────────
  const [testCasesExpanded, setTestCasesExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [testResults, setTestResults] = useState([]);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [splitPercent, setSplitPercent] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const activeQuestionRef = useRef(activeQuestion);
  const runTokenRef = useRef(0);
  const allCodesRef = useRef(allCodes);
  const allProblemsRef = useRef(allProblems);
  const uiFontFamily = '"Aptos", "Segoe UI Variable", "Segoe UI", "Trebuchet MS", sans-serif';

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCloseResults = () => {
    setIsSubmitted(false);
    setSubmitState("idle");
    setTestResults([]);
  };

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (event) => setIsNarrow(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep refs in sync so async judges can detect stale work.
  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);
  useEffect(() => {
    allCodesRef.current = allCodes;
  }, [allCodes]);
  useEffect(() => {
    allProblemsRef.current = allProblems;
  }, [allProblems]);

  // Debounced persistence: avoids a full localStorage write on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => saveLS(LS_CODES_KEY, allCodes), 400);
    return () => clearTimeout(id);
  }, [allCodes]);
  useEffect(() => {
    const id = setTimeout(() => saveLS(LS_PROBLEMS_KEY, allProblems), 400);
    return () => clearTimeout(id);
  }, [allProblems]);
  // Flush pending writes when the workspace unmounts.
  useEffect(
    () => () => {
      saveLS(LS_CODES_KEY, allCodesRef.current);
      saveLS(LS_PROBLEMS_KEY, allProblemsRef.current);
    },
    []
  );

  const handleStartTimerOnType = () => {
    if (!timerRunning) setTimerRunning(true);
  };

  const handleRun = async () => {
    if (isRunning || !problemData) return;

    const token = ++runTokenRef.current;
    const questionAtStart = activeQuestion;
    setIsRunning(true);
    setTerminalOutput("Running...\n");

    try {
      const result = await runCode({
        code,
        language: language === "C++" ? "cpp" : language.toLowerCase(),
        input: problemData.testCases?.[0]?.input || "",
      });

      if (runTokenRef.current !== token || activeQuestionRef.current !== questionAtStart) return;

      const lines = [`Status: ${result.status || "Unknown"}`];
      lines.push(`Output:\n${result.stdout || "(empty)"}`);
      if (result.compile_output) lines.push(`Compiler:\n${result.compile_output}`);
      if (result.stderr) lines.push(`Stderr:\n${result.stderr}`);
      lines.push(`Execution time: ${result.time}s  Memory: ${result.memory} KB`);
      setTerminalOutput(lines.join("\n\n"));
    } catch (err) {
      if (runTokenRef.current !== token || activeQuestionRef.current !== questionAtStart) return;
      setTerminalOutput(`Error: ${err?.response?.data?.error || err.message}`);
    } finally {
      if (runTokenRef.current === token) setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isJudging || !problemData) return;

    const allTestCases = [
      ...(problemData.testCases || []).map(tc => ({ ...tc, hidden: false })),
      ...(problemData.hiddenTestCases || []).map(tc => ({ ...tc, hidden: true })),
    ];

    // A blank case compares "" === "" and would report a false "Accepted".
    const validTestCases = allTestCases.filter(
      (tc) =>
        String(tc.input ?? "").trim() !== "" &&
        String(tc.output ?? tc.expectedOutput ?? "").trim() !== ""
    );
    const skippedCount = allTestCases.length - validTestCases.length;

    if (validTestCases.length === 0) {
      setTerminalOutput(
        "❌ Add at least one test case with both input and expected output before submitting."
      );
      setIsSubmitted(false);
      setSubmitState("idle");
      return;
    }

    const token = ++runTokenRef.current;
    const questionAtStart = activeQuestion;
    setIsJudging(true);
    setSubmitState("loading");
    setTestResults([]);
    setIsSubmitted(true);
    setTerminalOutput(
      skippedCount > 0 ? `Skipped ${skippedCount} incomplete test case(s).` : ""
    );

    try {
      const results = [];
      for (const tc of validTestCases) {
        if (runTokenRef.current !== token || activeQuestionRef.current !== questionAtStart) return;

        const result = await runCode({
          code,
          language: language === "C++" ? "cpp" : language.toLowerCase(),
          input: tc.input,
        });
        const actual = result.stdout ? result.stdout.trim() : "";
        const expected = String(tc.output ?? tc.expectedOutput ?? "").trim();
        const passed = actual === expected && result.status === "Accepted";
        const durationSeconds = Number.parseFloat(result.time || "0");
        results.push({
          id: tc.id,
          input: tc.hidden ? "🔒 Hidden" : tc.input,
          expectedOutput: tc.hidden ? "🔒 Hidden" : expected,
          actualOutput: tc.hidden ? (passed ? "✓ Correct" : "✗ Wrong") : actual,
          passed,
          hidden: tc.hidden,
          durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
          timeLabel: formatDurationMs(durationSeconds),
          error: tc.hidden ? null : (result.stderr || result.compile_output || null),
        });
      }

      if (runTokenRef.current !== token || activeQuestionRef.current !== questionAtStart) return;
      setTestResults(results);
      setSubmitState("results");
      setTimerRunning(false);
    } catch (err) {
      if (runTokenRef.current !== token || activeQuestionRef.current !== questionAtStart) return;
      setTerminalOutput(`Submission error: ${err?.response?.data?.error || err.message}`);
      setSubmitState("idle");
      setIsSubmitted(false);
    } finally {
      if (runTokenRef.current === token) setIsJudging(false);
    }
  };

  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    if (problemCollapsed) return;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const handleBulkImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      console.log("Clipboard text:", text);

      const sanitizedText = stripParsedTestCaseSections(text);
      let newTitle = "";
      const descriptionParts = [];
      let newShownTestCases = [];
      let newHiddenTestCases = [];

      const titleText = extractSection(text, "TITLE", [
        "PROBLEM",
        "INPUT",
        "OUTPUT",
        "CONSTRAINTS",
        "EXAMPLE",
        "SHOWN TEST CASES",
        "HIDDEN TEST CASES",
      ]);
      if (titleText) {
        newTitle = titleText;
      }

      const problemText = extractSection(sanitizedText, "PROBLEM", [
        "INPUT",
        "OUTPUT",
        "CONSTRAINTS",
        "EXAMPLE",
      ]);
      if (problemText) {
        descriptionParts.push(problemText);
      }

      const inputFormatText = extractSection(sanitizedText, "INPUT", [
        "OUTPUT",
        "CONSTRAINTS",
        "EXAMPLE",
      ]);
      if (inputFormatText) {
        descriptionParts.push(`**Input:** ${inputFormatText}`);
      }

      const outputFormatText = extractSection(sanitizedText, "OUTPUT", [
        "CONSTRAINTS",
        "EXAMPLE",
      ]);
      if (outputFormatText) {
        descriptionParts.push(`**Output:** ${outputFormatText}`);
      }

      const constraintsText = extractSection(sanitizedText, "CONSTRAINTS", ["EXAMPLE"]);
      if (constraintsText) {
        descriptionParts.push(`**Constraints:** ${constraintsText}`);
      }

      const exampleText = extractSection(sanitizedText, "EXAMPLE");
      if (exampleText) {
        const exampleInput = exampleText.match(/Input:\s*([\s\S]*?)(?=\bOutput\b\s*:|$)/i)?.[1]?.trim();
        const exampleOutput = exampleText.match(/Output:\s*([\s\S]*?)$/i)?.[1]?.trim();

        if (exampleInput || exampleOutput) {
          const exampleLines = ["**Example:**"];
          if (exampleInput) exampleLines.push(`Input: ${exampleInput}`);
          if (exampleOutput) exampleLines.push(`Output: ${exampleOutput}`);
          descriptionParts.push(exampleLines.join("\n"));
        } else {
          descriptionParts.push(`**Example:**\n${exampleText}`);
        }
      }

      const shownText = extractSection(text, "SHOWN TEST CASES", ["HIDDEN TEST CASES"]);
      if (shownText) {
        newShownTestCases = parseAutoParsedCases(shownText);
      }

      const hiddenText = extractSection(text, "HIDDEN TEST CASES");
      if (hiddenText) {
        newHiddenTestCases = parseAutoParsedCases(hiddenText, 1000).map(({ explanation, ...tc }) => tc);
      }

      const nextDescription = stripParsedTestCaseSections(descriptionParts.join("\n\n"));

      const finalTitle = newTitle || null;

      setProblemData((prev) => ({
        ...prev,
        title: finalTitle || prev.title,
        description: nextDescription || stripParsedTestCaseSections(prev.description),
        testCases: newShownTestCases.length > 0 ? newShownTestCases : prev.testCases,
        hiddenTestCases: newHiddenTestCases.length > 0 ? newHiddenTestCases : prev.hiddenTestCases,
      }));

      // Sidebar list mein bhi title update karo
      if (finalTitle) {
        setSidebarQuestionsRaw(prev => {
          const updated = prev.map(q => q.id === activeQuestion ? { ...q, title: finalTitle } : q);
          saveLS(LS_QUESTIONS_KEY, updated);
          return updated;
        });
      }

      if (newShownTestCases.length > 0) {
        setTestCasesExpanded(true);
      }
    } catch (e) {
      console.error("Clipboard read failed", e);
      alert("Clipboard access is required to use Auto-Parse.");
    }
  };

  const splitPercentRef = useRef(splitPercent);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || problemCollapsed) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const minLeft = 300;
      const minRight = 300;
      const rawLeft = e.clientX - rect.left;
      const clampedLeft = Math.min(rect.width - minRight, Math.max(minLeft, rawLeft));
      const percent = (clampedLeft / rect.width) * 100;
      splitPercentRef.current = percent;
      // Direct DOM update — no React re-render, max smooth
      const leftPanel = container.querySelector('[data-panel="left"]');
      const rightPanel = container.querySelector('[data-panel="right"]');
      if (leftPanel) leftPanel.style.width = `${percent}%`;
      if (rightPanel) rightPanel.style.flex = 'none', rightPanel.style.width = `${100 - percent}%`;
    },
    [isDragging, problemCollapsed],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setSplitPercent(splitPercentRef.current);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    // Re-measure Monaco after the split is resized
    requestAnimationFrame(() => editorRef.current?.layout());
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`flex flex-col h-[calc(100vh-64px)] bg-gray-100 text-slate-900 dark:bg-black dark:text-slate-100 overflow-hidden relative ${isDragging ? "select-none cursor-col-resize" : ""
        }`}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:199; backdrop-filter:blur(1px); }
        .sidebar-panel { position:fixed;top:0;left:0;height:100%;width:280px;background:#f9fafb;box-shadow:4px 0 24px rgba(0,0,0,0.13);z-index:200;transition:transform 0.3s ease; }
        .sidebar-panel.dark { background:#1e293b; box-shadow:4px 0 24px rgba(0,0,0,0.3); }
      `}</style>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar-panel ${darkMode ? 'dark' : ''} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
            <span className="font-bold text-gray-800 dark:text-slate-100 text-sm">Questions</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
          </div>

          {/* Add New Question Button */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <button
              onClick={() => {
                const newId = Date.now();
                // Use the last numeric segment (26.1.5 → 6), not every digit.
                const maxNum = sidebarQuestions.reduce((max, q) => {
                  const n = parseInt(String(q.num ?? "").split(".").pop(), 10);
                  return Number.isFinite(n) && n > max ? n : max;
                }, 0);
                const newNum = `Q${maxNum + 1}`;
                const newQ = {
                  id: newId,
                  num: newNum,
                  title: "New Question",
                  difficulty: "Medium",
                };
                const newProblem = {
                  num: newQ.num,
                  title: newQ.title,
                  description: "",
                  testCases: [{ id: Date.now(), input: "", output: "", explanation: "" }],
                  hiddenTestCases: [],
                };
                // Neeche add karo (append)
                setSidebarQuestions(prev => [...prev, newQ]);
                // Save its problemData
                setAllProblemsRaw(prev => {
                  const updated = { ...prev, [newId]: newProblem };
                  saveLS(LS_PROBLEMS_KEY, updated);
                  return updated;
                });
                // Set active question (code will auto-load as default)
                setActiveQuestion(newId);
                setTimerSeconds(0);
                setTimerRunning(false);
                setSubmitState("idle");
                setTestResults([]);
                setIsSubmitted(false);
                setTerminalOutput("");
                setIsEditing(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <PlusCircle size={16} /> Add New Question
            </button>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sidebarQuestions.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">No questions yet. Add one above!</p>
            ) : (
              sidebarQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setActiveQuestion(q.id);
                    setTimerSeconds(0);
                    setTimerRunning(false);
                    setSubmitState("idle");
                    setTestResults([]);
                    setIsSubmitted(false);
                    setTerminalOutput("");
                    setIsEditing(false);
                    setSidebarOpen(false);
                  }}
                  className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors group ${activeQuestion === q.id
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-100 text-gray-700 dark:hover:bg-slate-700 dark:text-slate-200"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-mono opacity-50">{q.num}</p>
                      <p className="text-sm font-semibold truncate">{q.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                        q.difficulty === "Hard" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                      }`}>
                        {q.difficulty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm(`"${q.title}" delete karna chahte ho?`)) return;

                          const remaining = sidebarQuestions.filter(x => x.id !== q.id);
                          setSidebarQuestionsRaw(remaining);
                          saveLS(LS_QUESTIONS_KEY, remaining);

                          // Remove orphaned problem/code records for this question.
                          const nextProblems = { ...allProblems };
                          delete nextProblems[q.id];
                          setAllProblemsRaw(nextProblems);
                          saveLS(LS_PROBLEMS_KEY, nextProblems);

                          const nextCodes = { ...allCodes };
                          delete nextCodes[q.id];
                          setAllCodesRaw(nextCodes);
                          saveLS(LS_CODES_KEY, nextCodes);

                          if (activeQuestion === q.id) {
                            setActiveQuestion(remaining[0]?.id ?? null);
                            setTimerSeconds(0);
                            setTimerRunning(false);
                            setSubmitState("idle");
                            setTestResults([]);
                            setIsSubmitted(false);
                            setTerminalOutput("");
                            setIsEditing(false);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition-all"
                        title="Delete question"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className={`flex flex-1 overflow-hidden border-t border-white ${isNarrow ? "flex-col" : "flex-row"}`} ref={containerRef} style={{ fontFamily: uiFontFamily }}>

        {/* Questions Sidebar Toggle */}
        {!problemCollapsed && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Show Questions"
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 z-30 w-11 h-8 flex flex-col items-center justify-center gap-1 bg-slate-400/50 hover:bg-slate-500/70 rounded-full shadow transition-colors backdrop-blur-sm"
            style={{ marginTop: "22px" }}
          >
            <span className="block w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span>
            <span className="block w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span>
          </button>
        )}

        <div
          data-panel="left"
          className={`bg-[#D9DDE1] border-r border-[#D9DDE1] flex flex-col overflow-hidden rounded-t-lg relative dark:bg-black dark:border-slate-800/80 ${problemCollapsed ? "pointer-events-none" : ""} ${isDragging ? "" : "transition-[width] duration-150"
            }`}
          style={{
            width: problemCollapsed ? 0 : isNarrow ? "100%" : `${splitPercent}%`,
            minWidth: problemCollapsed ? 0 : isNarrow ? 0 : "300px",
            height: isNarrow && !problemCollapsed ? "50%" : undefined,
          }}
        >
          <div className="mt-px h-10 bg-[#2A3439] text-slate-100 flex items-center px-4 justify-between rounded-t-lg sticky top-0 z-20 border-b backdrop-blur-md border-[#2A3439] shadow-sm dark:bg-black/80 dark:text-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 dark:hover:bg-slate-700 dark:text-slate-200"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              {isEditing && problemData ? (
                <input
                  type="text"
                  value={problemData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setProblemData({ ...problemData, title: newTitle });
                    setSidebarQuestionsRaw(prev => {
                      const updated = prev.map(q => q.id === activeQuestion ? { ...q, title: newTitle } : q);
                      saveLS(LS_QUESTIONS_KEY, updated);
                      return updated;
                    });
                  }}
                  className="bg-transparent border-b border-slate-300 outline-none text-sm font-bold tracking-[0.01em] text-slate-100 w-48"
                  placeholder="Enter Question Title"
                />
              ) : (
                <span className="text-[15px] font-bold tracking-[0.01em] text-slate-100">
                  {problemData ? `${problemData.num}. ${problemData.title}` : "No question selected"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-slate-200 dark:text-slate-200">
              <span className="px-3 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-semibold text-xs">
                {formatTime(timerSeconds)}
              </span>
              <CaseUpper size={16} className="opacity-80" />
              {isEditing && (
                <button
                  onClick={handleBulkImport}
                  className="p-1 rounded hover:bg-white/10 text-emerald-300 dark:hover:bg-emerald-900/40 dark:text-emerald-400 transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                  title="Paste Problem from Clipboard and Auto-Parse"
                >
                  <ClipboardPaste size={14} /> Auto-Parse
                </button>
              )}
              <button
                onClick={() => problemData && setIsEditing(!isEditing)}
                disabled={!problemData}
                className={`p-1 rounded transition-colors disabled:opacity-40 ${isEditing ? 'bg-white/15 text-blue-200 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-white/10 text-slate-200 dark:hover:bg-slate-700 dark:text-slate-200'}`}
                title={isEditing ? "Save Changes" : "Edit Problem"}
              >
                {isEditing ? <CheckCircle2 size={16} /> : <Edit3 size={16} />}
              </button>
              <Link2 size={16} className="opacity-80" />
              <button
                onClick={() => setProblemCollapsed((v) => !v)}
                className="p-1 rounded hover:bg-white/10 text-slate-200 dark:hover:bg-slate-700 dark:text-slate-200"
                title={problemCollapsed ? "Restore panel" : "Minimize panel"}
              >
                <Minus size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#D9DDE1] px-6 pt-6 pb-2 text-[15.5px] leading-8 text-black dark:bg-black dark:text-slate-300">
            <div className="min-h-full flex flex-col">
              {problemData ? (
                <>
              {/* Description Section */}
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <textarea
                      value={problemData.description}
                      onChange={(e) => setProblemData({ ...problemData, description: e.target.value })}
                      className="w-full h-80 p-3 rounded-lg border bg-gray-50 dark:bg-black dark:border-slate-800 outline-none focus:border-blue-500 transition-all leading-relaxed"
                      style={{ fontFamily: uiFontFamily }}
                      placeholder="Enter Problem Description... (Use **text** for bold)"
                    />
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Preview
                      </p>
                      <div
                        className="whitespace-pre-wrap leading-8 text-[15.5px] font-[450] tracking-[0.005em] text-black dark:text-slate-300"
                        style={{ fontFamily: uiFontFamily }}
                      >
                        {renderFormattedDescription(problemData.description)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap leading-8 text-[15.5px] font-[450] tracking-[0.005em] text-black dark:text-slate-300" style={{ fontFamily: uiFontFamily }}>
                    {renderFormattedDescription(problemData.description)}
                  </div>
                )}
              </div>

              {/* Test Cases Section */}
              <div className="pt-10 pb-2 mt-auto space-y-3">

                {/* ── Shown Test Cases ── */}
                <div className={`bg-[#FDFEFF] dark:bg-black rounded-2xl border border-[#D7DFEE] dark:border-slate-800 transition-all duration-300 overflow-hidden ${isEditing ? 'ring-2 ring-blue-500/20' : 'shadow-md shadow-slate-300/40 dark:shadow-none'}`}>
                  <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer group"
                    onClick={() => !isEditing && setTestCasesExpanded(!testCasesExpanded)}
                  >
                    <h3 className="font-semibold text-[16px] text-slate-800 dark:text-slate-200 group-hover:text-slate-900 transition-colors flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Sample Test Cases
                    </h3>
                    {!isEditing && (
                      <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1">
                        {testCasesExpanded ? <Minus size={16} /> : <Plus size={16} />}
                      </button>
                    )}
                  </div>

                  {(testCasesExpanded || isEditing) && (
                    <div className="px-4 pb-3 space-y-3">
                      {problemData.testCases.map((tc, idx) => (
                        <div key={tc.id} className="space-y-2 relative group/tc">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50">
                            <h4 className="font-bold text-[15px] text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Test case {idx + 1}
                            </h4>
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const newTc = [...problemData.testCases];
                                  newTc.splice(idx, 1);
                                  setProblemData({ ...problemData, testCases: newTc });
                                }}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Remove Test Case"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Input</span>
                              <textarea
                                value={tc.input}
                                onChange={(e) => {
                                  const newTc = problemData.testCases.map((c, i) =>
                                    i === idx ? { ...c, input: e.target.value } : c
                                  );
                                  setProblemData({ ...problemData, testCases: newTc });
                                }}
                                className="w-full h-16 p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900 font-mono text-xs outline-none focus:border-cyan-400 text-cyan-900 dark:text-cyan-100"
                                placeholder="Input values..."
                              />
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-2">Output</span>
                              <textarea
                                value={tc.output}
                                onChange={(e) => {
                                  const newTc = problemData.testCases.map((c, i) =>
                                    i === idx ? { ...c, output: e.target.value } : c
                                  );
                                  setProblemData({ ...problemData, testCases: newTc });
                                }}
                                className="w-full h-16 p-2 rounded-lg bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 font-mono text-xs outline-none focus:border-blue-400 text-slate-700 dark:text-slate-300"
                                placeholder="Expected output..."
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 group">
                                <div className="flex-1 space-y-1.5">
                                  {tc.input.split("\n").filter(Boolean).map((line, lIdx) => (
                                    <div key={lIdx} className="flex items-center gap-1.5 flex-wrap">
                                      {line.split(/\s+/).filter(Boolean).map((token, tokenIdx) => (
                                        <span
                                          key={`${lIdx}-${tokenIdx}`}
                                          className="inline-flex items-center rounded-full bg-emerald-200 px-2 py-[1px] text-[11px] font-medium text-emerald-900 shadow-sm leading-none"
                                          style={{ fontFamily: uiFontFamily }}
                                        >
                                          {token}
                                        </span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(tc.input)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500 transition-all p-1 mt-1"
                                  title="Copy Input"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                              <div className="h-px bg-[#D9E0EA] w-full"></div>
                              <div className="flex items-start gap-2 group">
                                <div className="flex-1 whitespace-pre-wrap text-[13px] leading-7 text-slate-700" style={{ fontFamily: uiFontFamily }}>
                                  {tc.output}
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(tc.output)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                                  title="Copy Output"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          onClick={() => setProblemData({
                            ...problemData,
                            testCases: [...problemData.testCases, { id: Date.now(), input: "", output: "", explanation: "" }]
                          })}
                          className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all font-bold text-sm"
                        >
                          <PlusCircle size={16} /> Add Sample Test Case
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Hidden Test Cases ── */}
                {isEditing && (
                  <div className="bg-[#FDFEFF] dark:bg-black rounded-2xl border border-orange-200 dark:border-orange-900/40 overflow-hidden ring-2 ring-orange-400/20">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <h3 className="font-semibold text-[16px] text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                        Hidden Test Cases
                        <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">Not visible to users</span>
                      </h3>
                      <span className="text-[11px] text-slate-400">{(problemData.hiddenTestCases || []).length} cases</span>
                    </div>

                    <div className="px-4 pb-3 space-y-3">
                      {(problemData.hiddenTestCases || []).length === 0 && (
                        <p className="text-[12px] text-slate-400 italic py-2">No hidden test cases yet. Add manually or use Auto-Parse.</p>
                      )}
                      {(problemData.hiddenTestCases || []).map((tc, idx) => (
                        <div key={tc.id} className="space-y-2 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-100 dark:border-orange-900/30">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[13px] text-orange-700 dark:text-orange-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              Hidden {idx + 1}
                            </h4>
                            <button
                              onClick={() => {
                                const newTc = [...(problemData.hiddenTestCases || [])];
                                newTc.splice(idx, 1);
                                setProblemData({ ...problemData, hiddenTestCases: newTc });
                              }}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Remove Hidden Test Case"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-orange-400">Input</span>
                            <textarea
                              value={tc.input}
                              onChange={(e) => {
                                const newTc = (problemData.hiddenTestCases || []).map((c, i) =>
                                  i === idx ? { ...c, input: e.target.value } : c
                                );
                                setProblemData({ ...problemData, hiddenTestCases: newTc });
                              }}
                              className="w-full h-14 p-2 rounded-lg bg-white dark:bg-black border border-orange-200 dark:border-orange-900 font-mono text-xs outline-none focus:border-orange-400 text-slate-800 dark:text-slate-200"
                              placeholder="Hidden input..."
                            />
                            <span className="text-[10px] uppercase font-bold text-orange-400 block">Output</span>
                            <textarea
                              value={tc.output}
                              onChange={(e) => {
                                const newTc = (problemData.hiddenTestCases || []).map((c, i) =>
                                  i === idx ? { ...c, output: e.target.value } : c
                                );
                                setProblemData({ ...problemData, hiddenTestCases: newTc });
                              }}
                              className="w-full h-14 p-2 rounded-lg bg-white dark:bg-black border border-orange-200 dark:border-orange-900 font-mono text-xs outline-none focus:border-orange-400 text-slate-800 dark:text-slate-200"
                              placeholder="Expected output..."
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setProblemData({
                          ...problemData,
                          hiddenTestCases: [...(problemData.hiddenTestCases || []), { id: Date.now(), input: "", output: "" }]
                        })}
                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 dark:border-orange-800 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all font-bold text-sm"
                      >
                        <PlusCircle size={16} /> Add Hidden Test Case
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden count badge (view mode) */}
                {!isEditing && (problemData.hiddenTestCases || []).length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                    <span className="text-[12px] text-orange-600 dark:text-orange-400 font-semibold">
                      + {(problemData.hiddenTestCases || []).length} hidden test case{(problemData.hiddenTestCases || []).length > 1 ? 's' : ''} (not shown to users)
                    </span>
                  </div>
                )}
              </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center py-20 text-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">No question selected</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Add a question from the sidebar to start practicing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {!problemCollapsed && !isNarrow && (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`cursor-col-resize flex items-center justify-center transition-colors ${isDragging ? "bg-[#2A3439]/80" : "bg-[#2A3439]/60 hover:bg-[#2A3439]/90"}`}
            style={{ minWidth: "6px", width: "6px" }}
          >
            <div className="w-[3px] h-12 rounded-full bg-slate-400/60 hover:bg-slate-300 transition-colors" />
          </div>
        )}

        <div
          data-panel="right"
          className={`flex-1 flex flex-col overflow-hidden rounded-t-lg relative border border-transparent dark:border-slate-800 ${darkMode ? 'bg-black' : 'bg-[#F3F5F8]'} ${isDragging ? "" : "transition-[width] duration-150"
            }`}
          style={{
            width: isNarrow || problemCollapsed ? "100%" : `${100 - splitPercent}%`,
            minWidth: isNarrow ? 0 : "300px",
          }}
        >
          <div className={`h-10 border-b flex items-center px-3 justify-between sticky top-0 z-20 rounded-t-lg shadow-sm transition-colors ${darkMode ? 'bg-[#111] border-slate-800' : 'bg-[#2A3439] border-[#2A3439]'
            }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-1.5 rounded transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-white/10 text-slate-200'}`}
              >
                <MessageSquare size={14} />
              </button>
              {problemCollapsed && (
                <button
                  onClick={() => setProblemCollapsed(false)}
                  className={`p-1 px-2.5 rounded text-[10px] font-bold border transition-all ${darkMode ? 'bg-[#222] hover:bg-[#333] text-gray-300 border-[#444]' : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/15'
                    }`}
                >
                  Show Problem
                </button>
              )}
              <div className="relative">
                <div
                  onClick={() => setLangDropdownOpen(v => !v)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border cursor-pointer shadow-sm transition-all ${darkMode ? 'bg-[#222] hover:bg-[#333] text-gray-300 border-[#444]' : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/15'}`}
                >
                  {language} <ChevronDown size={10} />
                </div>
                {langDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e1e1e] border border-[#444] rounded-lg shadow-xl overflow-hidden min-w-[90px]">
                    {["C++", "Java"].map(lang => (
                      <button
                        key={lang}
                        onClick={() => { 
                          setLanguage(lang); 
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${language === lang ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={isRunning || !problemData}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded border transition-all active:scale-95 shadow-sm disabled:opacity-50 ${darkMode ? 'bg-[#222] hover:bg-[#333] text-white border-[#444]' : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/15'
                  }`}
              >
                {isRunning ? (
                  <Loader2 size={10} className="animate-spin text-emerald-300" />
                ) : (
                  <Play size={10} className="text-emerald-300" />
                )}{" "}
                {isRunning ? "Running" : "Run"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "loading" || !problemData}
                className={`flex items-center gap-1.5 text-white text-[10px] font-bold px-4 py-1 rounded shadow-md active:scale-95 transition-all disabled:opacity-60 ${submitState === "loading" ? "bg-emerald-600/70" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
              >
                {submitState === "loading" ? "Judging..." : <><Send size={10} /> Submit</>}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative transition-colors duration-300">
            <div className={`flex-1 relative w-full h-full`}>
              <Editor
                height="100%"
                width="100%"
                path={`mockverse/q-${activeQuestion ?? "none"}-${language === "C++" ? "cpp" : "java"}`}
                language={language.toLowerCase() === "c++" ? "cpp" : language.toLowerCase()}
                theme={darkMode ? MONACO_DARK_THEME : "light"}
                beforeMount={defineMonacoTheme}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                value={code}
                onChange={(value) => {
                  setCode(value || "");
                  handleStartTimerOnType();
                }}
                loading={<div className="h-full w-full bg-[#111]" />}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
                  fontLigatures: true,
                  padding: { top: 14, bottom: 14 },
                  lineNumbers: "on",
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  folding: true,
                  autoIndent: "full",
                  formatOnPaste: true,
                  formatOnType: true,
                  matchBrackets: "always",
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  bracketPairColorization: { enabled: true },
                  tabSize: 4,
                  wordWrap: "off",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  renderLineHighlight: "line",
                  scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  },
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {terminalOutput && (
            <div className={`flex-none border-t ${darkMode ? "border-[#3e3e42] bg-[#0b0b0b]" : "border-gray-200 bg-[#1e1e1e]"} text-slate-200`}>
              <div className="flex items-center justify-between px-3 py-1 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Terminal
                </span>
                <button
                  onClick={() => setTerminalOutput("")}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                  title="Clear terminal"
                >
                  Clear
                </button>
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[12px] leading-5">
                {terminalOutput}
              </pre>
            </div>
          )}

          <div
            className={`border-t flex flex-col transition-all duration-300 overflow-hidden ${isSubmitted ? "h-96" : "h-0 border-transparent"
              } ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'
              }`}
          >
            {isSubmitted && (
              <div className="flex-1 bg-white text-slate-800 overflow-y-auto p-4 relative dark:bg-slate-800 dark:text-slate-100">
                <button
                  onClick={handleCloseResults}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                  title="Close results"
                >
                  ×
                </button>
                {submitState === "loading" && <p className="text-sm text-gray-600 dark:text-slate-300">Running tests...</p>}
                {submitState === "results" && (
                  <>
                    {(() => {
                      const durations = testResults.map((t) => Number(t.durationSeconds) || 0);
                      const avgSeconds =
                        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
                      const maxSeconds = durations.length > 0 ? Math.max(...durations) : 0;
                      const passed = testResults.filter((t) => t.passed && !t.hidden).length;
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-slate-500 text-xs font-semibold uppercase dark:text-slate-400">Average time</p>
                              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{avgSeconds.toFixed(3)} s</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDurationMs(avgSeconds)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-slate-500 text-xs font-semibold uppercase dark:text-slate-400">Maximum time</p>
                              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{maxSeconds.toFixed(3)} s</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDurationMs(maxSeconds)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            <ProgressSummary passed={passed} total={testResults.filter(t => !t.hidden).length} label="shown test case(s) passed" />
                            {testResults.some(t => t.hidden) && (
                              <ProgressSummary
                                passed={testResults.filter(t => t.hidden && t.passed).length}
                                total={testResults.filter(t => t.hidden).length}
                                label="hidden test case(s) passed"
                              />
                            )}
                          </div>
                          <div className="space-y-3">
                            {testResults.map((tc, index) => (
                              <div key={`${tc.id}-${index}`} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm dark:text-slate-100">
                                    {tc.passed ? (
                                      <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                      <XCircle size={16} className="text-rose-500" />
                                    )}
                                    Test case {index + 1}
                                    <span
                                      className={`px-2 py-0.5 text-[11px] rounded-full ${
                                        tc.passed
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                      }`}
                                    >
                                      {tc.timeLabel || formatDurationMs(tc.durationSeconds)}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 text-xs text-slate-600 px-4 py-3 gap-4 dark:text-slate-300">
                                  <div>
                                    <p className="font-bold mb-2 text-slate-700 dark:text-slate-200">Expected output</p>
                                    <div className="space-y-1">
                                      {(tc.expectedOutput || "").split("\n").map((line, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1 flex-wrap">
                                          <span className="px-2 py-1 bg-slate-100 rounded-full dark:bg-slate-700 dark:text-slate-200">{line}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold mb-2 text-slate-700 dark:text-slate-200">Actual output</p>
                                    <div className="space-y-1">
                                      {(tc.actualOutput || "").split("\n").map((line, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1 flex-wrap">
                                          <span className="px-2 py-1 bg-slate-100 rounded-full dark:bg-slate-700 dark:text-slate-200">{line}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                {tc.error && (
                                  <div className="px-4 pb-3">
                                    <p className="font-bold mb-1 text-[11px] uppercase text-rose-600">Error</p>
                                    <pre className="whitespace-pre-wrap rounded-lg bg-rose-50 p-2 text-[11px] leading-5 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                                      {tc.error}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-end px-6 gap-2 shrink-0">
        <button
          onClick={() => {
            const currentIndex = sidebarQuestions.findIndex(q => q.id === activeQuestion);
            if (currentIndex > 0) {
              const prevQ = sidebarQuestions[currentIndex - 1];
              setActiveQuestion(prevQ.id);
              setTimerSeconds(0);
              setTimerRunning(false);
              setSubmitState("idle");
              setTestResults([]);
              setIsSubmitted(false);
              setTerminalOutput("");
              setIsEditing(false);
            }
          }}
          disabled={sidebarQuestions.findIndex(q => q.id === activeQuestion) === 0}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
        >
          &lt; Prev
        </button>
        <button
          onClick={() => {
            setCode(language === "Java" ? defaultCodeJava : defaultCodeCpp);
            setTerminalOutput("");
            setSubmitState("idle");
            setTestResults([]);
            setIsSubmitted(false);
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-all active:scale-95"
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitState === "loading"}
          className="flex items-center gap-2 px-6 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          Submit
        </button>
        <button
          onClick={() => {
            const currentIndex = sidebarQuestions.findIndex(q => q.id === activeQuestion);
            if (currentIndex < sidebarQuestions.length - 1) {
              const nextQ = sidebarQuestions[currentIndex + 1];
              setActiveQuestion(nextQ.id);
              setTimerSeconds(0);
              setTimerRunning(false);
              setSubmitState("idle");
              setTestResults([]);
              setIsSubmitted(false);
              setTerminalOutput("");
              setIsEditing(false);
            }
          }}
          disabled={sidebarQuestions.findIndex(q => q.id === activeQuestion) === sidebarQuestions.length - 1}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}
