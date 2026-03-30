import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Moon,
  Sun,
  Code,
  FileText,
  Users,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Play,
  Send,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  Link2,
  Minus,
  Edit3,
  CaseUpper,
  Bug,
  List,
} from "lucide-react";

const defaultCode = `#include<bits/stdc++.h>
using namespace std;

int dp[105][105], cut[105][105], a[105];

void print(int i, int j){
    if(j-i<=1)
        return ;
    int k =cut[i][j];
    cout << a[k] << " ";
    print(i, k);
    print(k, j);
}

int main(){
    int n, m;
    cin >> n >> m;
    for(int i=1; i<=m; i++)
        cin >> a[i];
    a[m+1] = n;
    sort(a, a+m+2);

    for(int len=2; len<=m+1; len++)
        for(int i=0; i+len<=m+1; i++){
            int j = i+len;
            dp[i][j] = INT_MAX;
            for(int k=i+1; k<j; k++){
                int cost = dp[i][k] + dp[k][j] + a[j] - a[i];
                if(cost < dp[i][j]){
                    dp[i][j] = cost;
                    cut[i][j] = k;
                }
            }
        }

    cout << dp[0][m+1] << endl;
    print(0, m+1);
    return 0;
}`;

const mockTestCases = [
  {
    id: 1,
    input: "6\n3\n1 2 5",
    expectedOutput: "12\n1 2 5",
    actualOutput: "12\n1 2 5",
    passed: true,
    time: "8 ms",
  },
  {
    id: 2,
    input: "10\n2\n3 7",
    expectedOutput: "20\n3 7",
    actualOutput: "20\n3 7",
    passed: true,
    time: "6 ms",
  },
  {
    id: 3,
    input: "15\n4\n2 5 9 12",
    expectedOutput: "38\n2 5 9 12",
    actualOutput: "38\n2 5 9 12",
    passed: true,
    time: "7 ms",
  },
  {
    id: 4,
    input: "8\n3\n1 4 6",
    expectedOutput: "17\n1 4 6",
    actualOutput: "17\n1 4 6",
    passed: true,
    time: "5 ms",
  },
];

const sidebarQuestions = [
  { id: 1, num: "26.1.1", title: "Rod Cutting", difficulty: "Hard" },
  { id: 2, num: "26.1.2", title: "Matrix Chain Multiplication", difficulty: "Hard" },
  { id: 3, num: "26.1.3", title: "Longest Common Subsequence", difficulty: "Medium" },
  { id: 4, num: "26.1.4", title: "0/1 Knapsack", difficulty: "Medium" },
  { id: 5, num: "26.1.5", title: "Coin Change", difficulty: "Easy" },
];

const codeTokens = (line) => {
  const keywords = /\b(int|void|for|if|return|using|namespace|std|include|cout|cin|sort|endl|else|while)\b/g;
  const types = /\b(INT_MAX)\b/g;
  const numbers = /\b(\d+)\b/g;
  const strings = /"([^"]*)"/g;
  const comments = /(\/\/.*)/g;
  const preprocessor = /(#include[^\n]*)/g;

  let html = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(preprocessor, '<span class="code-preprocessor">$1</span>');
  html = html.replace(strings, '<span class="code-string">"$1"</span>');
  html = html.replace(comments, '<span class="code-comment">$1</span>');
  html = html.replace(keywords, '<span class="code-keyword">$1</span>');
  html = html.replace(types, '<span class="code-type">$1</span>');
  html = html.replace(numbers, '<span class="code-number">$1</span>');
  return html;
};

const CustomCalendar = ({ darkMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2021, 3, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2021, 3, 5));

  const daysLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const grid = [];
    for (let i = startingDay - 1; i >= 0; i--)
      grid.push({ val: daysInPrevMonth - i, currentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ val: i, currentMonth: true });
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) grid.push({ val: i, currentMonth: false });
    return grid;
  }, [year, month]);

  const isSelected = (day, isCurrentMonth) =>
    isCurrentMonth &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  return (
    <div
      className={`p-4 rounded-2xl shadow-xl w-full max-w-[280px] border border-gray-200 bg-white text-slate-900`}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-full text-slate-400"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-1.5">
          <div className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-slate-800 font-bold text-[11px]">
            {monthNames[month]} <ChevronDown size={10} className="inline text-blue-500" />
          </div>
          <div className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-slate-800 font-bold text-[11px]">
            {year} <ChevronDown size={10} className="inline text-blue-500" />
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-full text-slate-400"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {daysLabels.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, i) => (
          <div
            key={i}
            onClick={() => day.currentMonth && setSelectedDate(new Date(year, month, day.val))}
            className={`h-7 w-full flex items-center justify-center rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
              isSelected(day.val, day.currentMonth)
                ? "bg-blue-600 text-white shadow-md"
                : !day.currentMonth
                  ? "text-slate-200"
                  : "text-slate-700 hover:bg-gray-50"
            }`}
          >
            {day.val}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressSummary = ({ passed, total, label }) => {
  const percent = total === 0 ? 100 : Math.round((passed / total) * 100);
  const isAllPass = passed === total;
  const barColor = isAllPass ? "bg-emerald-500" : "bg-emerald-500";
  const iconColor = isAllPass ? "text-emerald-600" : "text-rose-500";
  const textColor = isAllPass ? "text-emerald-800" : "text-rose-600";
  const icon = isAllPass ? (
    <CheckCircle2 size={16} className={iconColor} />
  ) : (
    <svg className={`w-4 h-4 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span className={textColor}>
          {passed} out of {total} {label}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`${barColor} h-full transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
};

const PracticeWorkspace = ({ onBack, darkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState(defaultCode);
  const [bottomTab, setBottomTab] = useState("terminal");
  const [problemTab, setProblemTab] = useState("Description");
  const [submitState, setSubmitState] = useState("idle");
  const [testResults, setTestResults] = useState([]);
  const [expandedCase, setExpandedCase] = useState(1);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [splitPercent, setSplitPercent] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const editorRef = useRef(null);
  const highlightRef = useRef(null);
  const containerRef = useRef(null);

  const codeLines = code.split("\n");

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCloseResults = () => {
    setIsSubmitted(false);
    setSubmitState("idle");
    setTestResults([]);
    setBottomTab("terminal");
  };

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleStartTimerOnType = () => {
    if (!timerRunning) setTimerRunning(true);
  };

  const handleScroll = () => {
    if (editorRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  const handleRun = () => {
    setBottomTab("terminal");
    setTerminalOutput("Compiling...\n");
    setTimeout(() => {
      setTerminalOutput(
        "Compilation successful.\nRunning with sample input...\n> 6\n> 3\n> 1 2 5\n\nOutput:\n12\n1 2 5\n\nExecution time: 0.007s",
      );
    }, 800);
  };

  const handleSubmit = () => {
    setSubmitState("loading");
    setShowResultsPanel(true);
    setBottomTab("testcases");
    setIsSubmitted(true);
    setTimeout(() => {
      setTestResults(mockTestCases);
      setSubmitState("results");
    }, 1500);
  };

  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    if (problemCollapsed) return;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

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
      setSplitPercent(percent);
    },
    [isDragging, problemCollapsed],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
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
      className={`flex flex-col h-[calc(100vh-52px)] bg-gray-100 overflow-hidden relative ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .code-keyword { color: #569cd6; font-weight: 500; }
        .code-string { color: #ce9178; }
        .code-comment { color: #6a9955; font-style: italic; }
        .code-number { color: #b5cea8; }
        .code-preprocessor { color: #c586c0; }
        .code-type { color: #4ec9b0; }
        .code-highlight { position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:auto;white-space:pre;font-family:monospace;font-size:13px;line-height:21px;padding:8px 8px 8px 0;margin:0; }
        .code-textarea { position:relative;z-index:2;background:transparent;color:transparent;caret-color:#fff;white-space:pre;font-family:monospace;font-size:13px;line-height:21px;resize:none;outline:none;border:none;width:100%;height:100%;overflow:auto;padding:8px 8px 8px 0; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:199; backdrop-filter:blur(1px); }
        .sidebar-panel { position:fixed;top:0;left:0;height:100%;width:280px;background:#f9fafb;box-shadow:4px 0 24px rgba(0,0,0,0.13);z-index:200;transition:transform 0.3s ease; }
      `}</style>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar-panel ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center bg-white">
            <span className="font-bold text-gray-800">Questions</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sidebarQuestions.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  setActiveQuestion(q.id);
                  setSidebarOpen(false);
                }}
                className={`p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
                  activeQuestion === q.id
                    ? "bg-blue-50 text-blue-600"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <p className="text-[10px] font-mono opacity-50">{q.num}</p>
                <p className="text-sm font-semibold">{q.title}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        <div
          className={`bg-white border-r flex flex-col overflow-hidden rounded-t-xl relative transition-[width] ${
            problemCollapsed ? "pointer-events-none" : ""
          }`}
          style={{
            width: problemCollapsed ? 0 : `${splitPercent}%`,
            minWidth: problemCollapsed ? 0 : "300px",
          }}
        >
          <div className="h-10 bg-[#041633] text-slate-200 flex items-center px-4 justify-between rounded-t-xl sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-200"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="font-bold text-sm">26.1.1. Rod Cutting</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-emerald-900 font-semibold text-xs">
                {formatTime(timerSeconds)}
              </span>
              <CaseUpper size={16} className="opacity-80" />
              <Edit3 size={16} className="opacity-80" />
              <Link2 size={16} className="opacity-80" />
              <button
                onClick={() => setProblemCollapsed((v) => !v)}
                className="p-1 rounded hover:bg-white/10 text-slate-200"
                title={problemCollapsed ? "Restore panel" : "Minimize panel"}
              >
                <Minus size={16} />
              </button>
            </div>
          </div>
          <div className="flex border-b text-[11px] font-bold text-gray-500">
            {["Description", "Notes", "Example"].map((t) => (
              <button
                key={t}
                onClick={() => setProblemTab(t)}
                className={`px-4 py-2 border-b-2 transition-all ${
                  problemTab === t
                    ? "border-blue-500 text-blue-600 bg-blue-50/30"
                    : "border-transparent hover:text-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-gray-700">
            {problemTab === "Description" && (
              <div className="space-y-4">
                <p>
                  There is a rod of length <em>N</em> with weak points at <em>A1, A2, ..., AM</em>. You
                  must cut the rod at all weak points.
                </p>
                <p>
                  The cost of a cut is the length of the sub-rod being cut. Minimize the total cost and
                  return the lexicographically smallest sequence of cuts.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border text-xs font-mono">
                  Example: N=6, A=[1, 2, 5] {"->"} Output: 12, Order: [1, 2, 5]
                </div>
              </div>
            )}
            {problemTab === "Notes" && (
              <p className="italic opacity-70">Interval DP solution recommended. Time Complexity: O(M³).</p>
            )}
            {problemTab === "Example" && (
              <div className="p-3 bg-slate-900 text-white rounded font-mono text-xs">
                Input: 6\n3\n1 2 5\nOutput: 12\n1 2 5
              </div>
            )}
          </div>
        </div>

        {!problemCollapsed && (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`w-2 cursor-col-resize bg-transparent hover:bg-blue-500/20 transition-colors ${
              isDragging ? "bg-blue-500/30" : ""
            }`}
            style={{ minWidth: "8px" }}
          />
        )}

        <div
          className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden rounded-t-xl relative transition-[width]"
          style={{
            width: problemCollapsed ? "100%" : `${100 - splitPercent}%`,
            minWidth: "300px",
          }}
        >
          <div className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center px-3 justify-between sticky top-0 z-20 rounded-t-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400"
              >
                <MessageSquare size={14} />
              </button>
              {problemCollapsed && (
                <button
                  onClick={() => setProblemCollapsed(false)}
                  className="p-1 rounded bg-[#3c3c3c] text-gray-200 text-[10px] border border-[#555] hover:bg-[#4a4a4a]"
                >
                  Show Problem
                </button>
              )}
              <div className="flex items-center gap-1 bg-[#3c3c3c] px-2 py-1 rounded text-[10px] text-gray-300 font-bold border border-[#555] cursor-pointer">
                {language} <ChevronDown size={10} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex items-center gap-1.5 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-white text-[10px] font-bold px-3 py-1 rounded border border-[#555] transition-all active:scale-95"
              >
                <Play size={10} /> Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "loading"}
                className={`flex items-center gap-1.5 text-white text-[10px] font-bold px-4 py-1 rounded shadow-lg active:scale-95 transition-all ${
                  submitState === "loading" ? "bg-green-700 opacity-70" : "bg-green-600 hover:bg-green-500"
                }`}
              >
                {submitState === "loading" ? "Judging..." : <><Send size={10} /> Submit</>}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            <div className="w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] text-[#858585] text-right p-2 text-[11px] font-mono select-none">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="flex-1 relative">
              <div
                ref={highlightRef}
                className="code-highlight text-[#d4d4d4] px-3 pointer-events-none"
                aria-hidden="true"
              >
                {codeLines.map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: codeTokens(line) || "&nbsp;" }} />
                ))}
              </div>
              <textarea
                ref={editorRef}
                className="code-textarea px-3"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  handleStartTimerOnType();
                }}
                onScroll={handleScroll}
                spellCheck={false}
              />
            </div>
          </div>

          <div
            className={`border-t border-[#3e3e42] flex flex-col transition-all duration-300 overflow-hidden ${
              isSubmitted ? "h-96" : "h-0 border-transparent"
            }`}
          >
            {isSubmitted && (
              <div className="flex-1 bg-white text-slate-800 overflow-y-auto p-4 relative">
                <button
                  onClick={handleCloseResults}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  title="Close results"
                >
                  ×
                </button>
                {submitState === "loading" && (
                  <p className="text-sm text-gray-600">Running tests...</p>
                )}
                {submitState === "results" && (
                  <>
                    {(() => {
                      const times = testResults.map((t) => Number(t.time.split(" ")[0]) || 0);
                      const avg =
                        times.length > 0
                          ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(3)
                          : "0.000";
                      const max = times.length > 0 ? Math.max(...times).toFixed(3) : "0.000";
                      const passed = testResults.filter((t) => t.passed).length;
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-slate-500 text-xs font-semibold uppercase">Average time</p>
                              <p className="text-xl font-bold text-slate-800">{avg} s</p>
                              <p className="text-[11px] text-slate-500">{(avg * 1000).toFixed(0)} ms</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-slate-500 text-xs font-semibold uppercase">Maximum time</p>
                              <p className="text-xl font-bold text-slate-800">{max} s</p>
                              <p className="text-[11px] text-slate-500">{(max * 1000).toFixed(0)} ms</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            <ProgressSummary
                              passed={passed}
                              total={testResults.length}
                              label="shown test case(s) passed"
                            />
                            <ProgressSummary passed={4} total={4} label="hidden test case(s) passed" />
                          </div>
                          <div className="space-y-3">
                            {testResults.map((tc) => (
                              <div key={tc.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    Test case {tc.id}
                                    <span className="px-2 py-0.5 text-[11px] bg-emerald-100 text-emerald-700 rounded-full">
                                      {tc.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500">
                                    <button className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                                      <Bug size={12} /> Debug
                                    </button>
                                    <button className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                                      <List size={12} /> View
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 text-xs text-slate-600 px-4 py-3 gap-4">
                                  <div>
                                    <p className="font-bold mb-2 text-slate-700">Expected output</p>
                                    <div className="space-y-1">
                                      {tc.expectedOutput.split("\n").map((line, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1 flex-wrap">
                                          <span className="px-2 py-1 bg-slate-100 rounded-full">{line}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold mb-2 text-slate-700">Actual output</p>
                                    <div className="space-y-1">
                                      {tc.actualOutput.split("\n").map((line, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1 flex-wrap">
                                          <span className="px-2 py-1 bg-slate-100 rounded-full">{line}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
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

      <div className="h-12 bg-[#0f172a] border-t border-slate-800 flex items-center justify-end px-6 gap-2 shrink-0">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all active:scale-95">
          &lt; Prev
        </button>
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-all active:scale-95">
          Reset
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitState === "loading"}
          className="flex items-center gap-2 px-6 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          Submit
        </button>
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95">
          Next &gt;
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ onOpenPractice, darkMode }) => {
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Coding", val: "42h 15m", icon: <Clock size={18} className="text-blue-500" /> },
              {
                label: "Solved",
                val: "128",
                icon: <CheckCircle2 size={18} className="text-emerald-500" />,
              },
              { label: "Streak", val: "12 Days", icon: <Zap size={18} className="text-orange-500" /> },
              { label: "Rank", val: "#1,204", icon: <Award size={18} className="text-purple-500" /> },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all ${
                  darkMode ? "bg-[#1e293b] border-slate-700" : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                <div className={`p-2 w-fit rounded-lg mb-2 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                  {stat.icon}
                </div>
                <p className="text-xl font-bold">{stat.val}</p>
                <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/20"
                : "bg-blue-50 border-blue-100"
            }`}
          >
            <h4 className="text-sm font-bold text-blue-500 mb-1">Boost your streak!</h4>
            <p className="text-xs opacity-70 mb-3">Solve 2 more problems today to keep your activity alive.</p>
            <div className="w-full h-1.5 bg-gray-200/30 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-blue-500"></div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto flex justify-center">
          <CustomCalendar darkMode={darkMode} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainSections.map((section) => (
          <div
            key={section.id}
            className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              darkMode ? "bg-[#1e293b] border-slate-700" : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <div
              className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${section.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}
            ></div>
            <div className="p-6 space-y-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-md`}
              >
                {section.icon}
              </div>
              <h3 className="text-lg font-bold">{section.title}</h3>
              <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">{section.desc}</p>
              <button
                onClick={() => section.id === "practice" && onOpenPractice()}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                  section.id === "practice"
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                    : darkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-400"
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
};

export default function App() {
  const DARK_STORAGE_KEY = "mockverse-dark";
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
    return false;
  });
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    localStorage.setItem(DARK_STORAGE_KEY, darkMode);
  }, [darkMode]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        darkMode ? "bg-[#0f172a] text-white" : "bg-gray-50 text-slate-900"
      }`}
    >
      <header
        className={`sticky top-0 z-[100] flex items-center justify-between px-6 py-2 border-b backdrop-blur-md ${
          darkMode ? "bg-[#1e293b]/90 border-slate-700" : "bg-white/90 border-gray-100 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <div className="w-4 h-5 bg-white rounded-sm transform -rotate-12"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => setView("dashboard")}>
            Mock-Verse
          </h1>
          <div className="relative ml-4 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search problems..."
              className={`pl-10 pr-4 py-1.25 rounded-md text-sm w-72 outline-none border transition-all ${
                darkMode
                  ? "bg-[#111827] border-slate-600 focus:border-blue-500"
                  : "bg-gray-100 border-gray-200 focus:border-blue-400"
              }`}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-full transition-colors ${
              darkMode ? "hover:bg-slate-700 text-yellow-400" : "hover:bg-gray-200 text-slate-600"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-red-400 to-orange-400 p-[2px] shadow-md cursor-pointer hover:scale-105 transition-transform">
            <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${darkMode ? "bg-[#1e293b]" : "bg-white"}`}>
              <span className="text-xs font-bold">👤</span>
            </div>
          </div>
        </div>
      </header>

      {view === "dashboard" ? (
        <Dashboard darkMode={darkMode} onOpenPractice={() => setView("practice")} />
      ) : (
        <PracticeWorkspace onBack={() => setView("dashboard")} darkMode={darkMode} />
      )}

      {view === "dashboard" && (
        <footer className="py-10 text-center opacity-20 text-[10px] font-black tracking-widest uppercase">
          Mock-Verse Cloud Systems
        </footer>
      )}
    </div>
  );
}
