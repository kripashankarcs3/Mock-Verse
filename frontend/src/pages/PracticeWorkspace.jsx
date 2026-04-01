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
  Bug,
  List,
  CheckCircle2,
  Loader2,
  PlusCircle,
  ClipboardPaste,
  Plus,
  Copy,
  Trash2
} from "lucide-react";
import ProgressSummary from "../components/ProgressSummary";
import { runCode } from "../services/api";

const mockTestCases = [
  { id: 1, input: "6\n3\n1 2 5", expectedOutput: "12\n1 2 5", actualOutput: "12\n1 2 5", passed: true, time: "8 ms" },
  { id: 2, input: "10\n2\n3 7", expectedOutput: "20\n3 7", actualOutput: "20\n3 7", passed: true, time: "6 ms" },
  { id: 3, input: "15\n4\n2 5 9 12", expectedOutput: "38\n2 5 9 12", actualOutput: "38\n2 5 9 12", passed: true, time: "7 ms" },
  { id: 4, input: "8\n3\n1 4 6", expectedOutput: "17\n1 4 6", actualOutput: "17\n1 4 6", passed: true, time: "5 ms" },
];

const sidebarQuestions = [
  { id: 1, num: "26.1.1", title: "Rod Cutting", difficulty: "Hard" },
  { id: 2, num: "26.1.2", title: "Matrix Chain Multiplication", difficulty: "Hard" },
  { id: 3, num: "26.1.3", title: "Longest Common Subsequence", difficulty: "Medium" },
  { id: 4, num: "26.1.4", title: "0/1 Knapsack", difficulty: "Medium" },
  { id: 5, num: "26.1.5", title: "Coin Change", difficulty: "Easy" },
];

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

const codeTokens = (line) => {
  const keywords = /\b(int|void|for|if|return|using|namespace|std|include|cout|cin|sort|endl|else|while)\b/g;
  const types = /\b(INT_MAX)\b/g;
  const numbers = /\b(\d+)\b/g;
  const strings = /"([^"\n]*)"/g;
  const comments = /(\/\/.*)/g;
  const preprocessor = /(#include[^\n]*)/g;

  let html = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const segments = [];
  let segmentIndex = 0;
  const mark = (regex, wrap) => {
    html = html.replace(regex, (match) => {
      const token = `__TOKEN_${segmentIndex}__`;
      segments.push(wrap(match));
      segmentIndex += 1;
      return token;
    });
  };

  mark(preprocessor, (match) => `<span class="code-preprocessor">${match}</span>`);
  mark(strings, (match) => `<span class="code-string">${match}</span>`);
  mark(comments, (match) => `<span class="code-comment">${match}</span>`);
  mark(keywords, (match) => `<span class="code-keyword">${match}</span>`);
  mark(types, (match) => `<span class="code-type">${match}</span>`);
  mark(numbers, (match) => `<span class="code-number">${match}</span>`);

  segments.forEach((segment, index) => {
    html = html.replace(`__TOKEN_${index}__`, segment);
  });

  return html;
};

export default function PracticeWorkspace({ onBack, darkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState(defaultCode);
  const [bottomTab, setBottomTab] = useState("terminal");
  const [isEditing, setIsEditing] = useState(false);
  const [problemData, setProblemData] = useState({
    num: "26.1.1",
    title: "Rod Cutting",
    description: "There is a rod of length N with weak points at A1, A2, ..., AM. You must cut the rod at all weak points.\n\nThe cost of a cut is the length of the sub-rod being cut. Minimize the total cost and return the lexicographically smallest sequence of cuts.\n\n**Constraints:**\nInterval DP solution recommended. Time Complexity: O(M³).",
    testCases: [
      { id: 1, input: "6\n3\n1 2 5", output: "12\n1 2 5", explanation: "" },
      { id: 2, input: "10\n2\n3 7", output: "20\n3 7", explanation: "" }
    ],
    hiddenTestCases: []
  });
  const [testCasesExpanded, setTestCasesExpanded] = useState(false);
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
  const uiFontFamily = '"Aptos", "Segoe UI Variable", "Segoe UI", "Trebuchet MS", sans-serif';

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

  const handleBulkImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      let newTitle = problemData.title;
      let newDescription = "";
      let newTestCases = [];

      const lines = text.split('\n');
      const firstLine = lines.find(l => l.trim().replace(/[\*\#\`]/g, '').length > 0);
      if (firstLine && firstLine.length < 80) {
        newTitle = firstLine.trim().replace(/[\*\#\`]/g, '');
      }

      let currentSection = 'description';
      let currentTc = null;
      let currentTcLines = [];
      let hasExplicitLabels = false;

      const finalizeTc = () => {
        if (!currentTc) return;
        if (!hasExplicitLabels && currentTcLines.length > 0) {
          const nonEmpty = currentTcLines.filter(l => l.trim().length > 0);
          if (nonEmpty.length > 0) {
            const outLine = nonEmpty.pop();
            currentTc.output = outLine.replace(/·/g, '\n').trim();
            currentTc.input = nonEmpty.join('\n').replace(/\t/g, '').trim();
          }
        }
        if (currentTc.input.trim() !== "" || currentTc.output.trim() !== "") {
          newTestCases.push(currentTc);
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase().trim();
        const cleanedLine = lowerLine.replace(/[\*\#]/g, '').trim();

        if (cleanedLine === 'sample test cases') continue;

        if (cleanedLine.startsWith('example') || cleanedLine.startsWith('test case')) {
          finalizeTc();
          currentTc = { id: Date.now() + i, input: "", output: "", explanation: "" };
          currentTcLines = [];
          hasExplicitLabels = false;
          currentSection = 'example';
          continue;
        }

        const inputMatch = cleanedLine.match(/^input\s*[:=]\s*(.*)/);
        if (inputMatch) {
          hasExplicitLabels = true;
          currentSection = 'input';
          if (!currentTc) currentTc = { id: Date.now() + i, input: "", output: "", explanation: "" };
          let val = inputMatch[1];
          if (val) currentTc.input += val + "\n";
          continue;
        }

        const outputMatch = cleanedLine.match(/^output\s*[:=]\s*(.*)/);
        if (outputMatch) {
          hasExplicitLabels = true;
          currentSection = 'output';
          if (!currentTc) currentTc = { id: Date.now() + i, input: "", output: "", explanation: "" };
          let val = outputMatch[1];
          if (val) currentTc.output += val + "\n";
          continue;
        }

        const expMatch = cleanedLine.match(/^explanation\s*[:=]\s*(.*)/);
        if (expMatch) {
          hasExplicitLabels = true;
          currentSection = 'explanation';
          if (!currentTc) currentTc = { id: Date.now() + i, input: "", output: "", explanation: "" };
          let val = expMatch[1];
          if (val) currentTc.explanation += val + "\n";
          continue;
        }

        if (cleanedLine.startsWith('constraints:') || cleanedLine === 'constraints' || cleanedLine.startsWith('note:') || cleanedLine === 'note') {
          currentSection = 'ignore';
          continue;
        }

        if (cleanedLine.startsWith('input format:') || cleanedLine === 'input format' || cleanedLine.startsWith('output format:') || cleanedLine === 'output format') {
          currentSection = 'description';
          newDescription += `\n**${line.trim()}**\n`;
          continue;
        }

        // Output lines handling
        if (currentSection === 'ignore') {
          continue;
        } else if (currentSection === 'description') {
          if (line.trim().replace(/[\*\#]/g, '') === newTitle) continue;
          newDescription += line + "\n";
        } else if (currentSection === 'example' && currentTc) {
          if (!hasExplicitLabels) {
            currentTcLines.push(line);
          }
        } else if (currentSection === 'input' && currentTc) {
          currentTc.input += line + "\n";
        } else if (currentSection === 'output' && currentTc) {
          currentTc.output += line + "\n";
        } else if (currentSection === 'explanation' && currentTc) {
          currentTc.explanation += line + "\n";
        }
      }
      finalizeTc();

      // Normalize spacing and fix copy-paste layout artifacts
      let finalDesc = newDescription;
      // 1. Join isolated very short variables that broke onto their own line (e.g. \n n \n -> ' n ')
      finalDesc = finalDesc.replace(/\n\s*([a-zA-Z0-9_\-\+\=\<\>]{1,4})\s*\n/g, ' $1 ');
      finalDesc = finalDesc.replace(/\n\s*([a-zA-Z0-9_\-\+\=\<\>]{1,4})\s*\n/g, ' $1 '); // Run twice for overlap

      // 2. Fix mid-sentence breaks (e.g. line ends in letter, next line starts with lowercase or number)
      finalDesc = finalDesc.replace(/([a-zA-Z0-9])\s*\n\s*([a-z0-9])/g, '$1 $2');

      // 3. Fix dangling punctuation and extra spaces before punctuation (like ` \n,` or ` ,`)
      finalDesc = finalDesc.replace(/\s+([,\.\:\;\)])/g, '$1');

      // 4. Clean up massive vertical gaps even with hidden spaces/returns to max 2 newlines
      finalDesc = finalDesc.replace(/\n([\s]*\n)+/g, '\n\n');

      const cleanStr = (s) => s.trim().replace(/\n+$/, '');

      setProblemData(prev => ({
        ...prev,
        title: newTitle || prev.title,
        description: cleanStr(finalDesc) || prev.description,
        testCases: newTestCases.length > 0 ? newTestCases.map(tc => ({
          ...tc, input: cleanStr(tc.input), output: cleanStr(tc.output), explanation: cleanStr(tc.explanation)
        })) : prev.testCases
      }));
    } catch (e) {
      console.error("Clipboard read failed", e);
      alert("Clipboard access is required to use Auto-Parse. You can manually paste into the fields.");
    }
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
      className={`flex flex-col h-[calc(100vh-44px)] bg-gray-100 text-slate-900 dark:bg-black dark:text-slate-100 overflow-hidden relative ${isDragging ? "select-none cursor-col-resize" : ""
        }`}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .code-keyword { color: #8b1db0; font-weight: 500; }
        .code-string { color: #df5a1c; }
        .code-comment { color: #98a2b3; font-style: italic; }
        .code-number { color: #2f855a; }
        .code-preprocessor { color: #e85d04; font-weight: 500; }
        .code-type { color: #059669; }
        .code-highlight { position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:auto;white-space:pre;font-family:monospace;font-size:13px;line-height:21px;padding:8px 8px 8px 0;margin:0; }
        .code-textarea { position:relative;z-index:2;background:transparent;color:transparent;white-space:pre;font-family:monospace;font-size:13px;line-height:21px;resize:none;outline:none;border:none;width:100%;height:100%;overflow:auto;padding:8px 8px 8px 0; }
        .code-textarea.dark { caret-color:#fff; }
        .code-textarea.light { caret-color:#2d3748; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:199; backdrop-filter:blur(1px); }
        .sidebar-panel { position:fixed;top:0;left:0;height:100%;width:280px;background:#f9fafb;box-shadow:4px 0 24px rgba(0,0,0,0.13);z-index:200;transition:transform 0.3s ease; }
        .sidebar-panel.dark { background:#1e293b; box-shadow:4px 0 24px rgba(0,0,0,0.3); }
      `}</style>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar-panel ${darkMode ? 'dark' : ''} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-slate-800">
            <span className="font-bold text-gray-800 dark:text-slate-100">Questions</span>
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
                className={`p-3 rounded-lg mb-1 cursor-pointer transition-colors ${activeQuestion === q.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                    : "hover:bg-gray-100 text-gray-700 dark:hover:bg-slate-700 dark:text-slate-200"
                  }`}
              >
                <p className="text-[10px] font-mono opacity-50">{q.num}</p>
                <p className="text-sm font-semibold">{q.title}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 overflow-hidden border-t border-white" ref={containerRef} style={{ fontFamily: uiFontFamily }}>
        <div
          className={`bg-[#D9DDE1] border-r border-[#D9DDE1] flex flex-col overflow-hidden rounded-t-lg relative transition-[width] dark:bg-black dark:border-slate-800/80 ${problemCollapsed ? "pointer-events-none" : ""
            }`}
          style={{
            width: problemCollapsed ? 0 : `${splitPercent}%`,
            minWidth: problemCollapsed ? 0 : "300px",
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
              {isEditing ? (
                <input
                  type="text"
                  value={problemData.title}
                  onChange={(e) => setProblemData({ ...problemData, title: e.target.value })}
                  className="bg-transparent border-b border-slate-300 outline-none text-sm font-bold tracking-[0.01em] text-slate-100 w-48"
                  placeholder="Enter Question Title"
                />
              ) : (
                <span className="text-[15px] font-bold tracking-[0.01em] text-slate-100">{problemData.num}. {problemData.title}</span>
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
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1 rounded transition-colors ${isEditing ? 'bg-white/15 text-blue-200 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-white/10 text-slate-200 dark:hover:bg-slate-700 dark:text-slate-200'}`}
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

          <div className="flex-1 overflow-y-auto bg-[#D9DDE1] px-6 pt-6 pb-2 text-[15.5px] leading-8 text-black dark:text-slate-300">
            <div className="min-h-full flex flex-col">
              {/* Description Section */}
              <div className="space-y-4">
                {isEditing ? (
                  <textarea
                    value={problemData.description}
                    onChange={(e) => setProblemData({ ...problemData, description: e.target.value })}
                    className="w-full h-80 p-3 rounded-lg border bg-gray-50 dark:bg-black dark:border-slate-800 outline-none focus:border-blue-500 transition-all leading-relaxed"
                    style={{ fontFamily: uiFontFamily }}
                    placeholder="Enter Problem Description... (Use **text** for bold)"
                  />
                ) : (
                  <div className="whitespace-pre-wrap leading-8 text-[15.5px] font-[450] tracking-[0.005em] text-black" style={{ fontFamily: uiFontFamily }}>
                    {problemData.description.split(/(\*\*.*?\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-black dark:text-slate-100">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}
              </div>

              {/* Test Cases Mockup Section */}
              <div className="pt-10 pb-2 mt-auto">
                <div className={`bg-[#FDFEFF] dark:bg-black rounded-2xl border border-[#D7DFEE] dark:border-slate-800 transition-all duration-300 overflow-hidden ${isEditing ? 'ring-2 ring-blue-500/20' : 'shadow-md shadow-slate-300/40 dark:shadow-none'}`}>
                  <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer group"
                    onClick={() => !isEditing && setTestCasesExpanded(!testCasesExpanded)}
                  >
                    <h3 className="font-semibold text-[16px] text-slate-800 dark:text-slate-200 group-hover:text-slate-900 transition-colors">
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
                                  const newTc = [...problemData.testCases];
                                  newTc[idx].input = e.target.value;
                                  setProblemData({ ...problemData, testCases: newTc });
                                }}
                                className="w-full h-16 p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900 font-mono text-xs outline-none focus:border-cyan-400 text-cyan-900 dark:text-cyan-100"
                                placeholder="Input values..."
                              />
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mt-2">Output</span>
                              <textarea
                                value={tc.output}
                                onChange={(e) => {
                                  const newTc = [...problemData.testCases];
                                  newTc[idx].output = e.target.value;
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
                                <div
                                  className="flex-1 whitespace-pre-wrap text-[13px] leading-7 text-slate-700"
                                  style={{ fontFamily: uiFontFamily }}
                                >
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

                              {idx < problemData.testCases.length - 1 && (
                                <div className="h-px bg-[#D9E0EA] w-full absolute -bottom-2"></div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          onClick={() => {
                            setProblemData({
                              ...problemData,
                              testCases: [...problemData.testCases, { id: Date.now(), input: "", output: "", explanation: "" }]
                            });
                          }}
                          className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all font-bold"
                        >
                          <PlusCircle size={18} /> Add New Test Case
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {!problemCollapsed && (
          <div
            onMouseDown={handleDividerMouseDown}
            className={`w-2 cursor-col-resize bg-[#2A3439] hover:bg-[#2A3439] transition-colors ${isDragging ? "bg-[#2A3439]" : ""
              }`}
            style={{ minWidth: "8px" }}
          />
        )}

        <div
          className={`flex-1 flex flex-col overflow-hidden rounded-t-lg relative transition-[width] border border-transparent dark:border-slate-800 ${darkMode ? 'bg-black' : 'bg-[#F3F5F8]'
            }`}
          style={{
            width: problemCollapsed ? "100%" : `${100 - splitPercent}%`,
            minWidth: "300px",
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
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border cursor-pointer shadow-sm transition-all ${darkMode ? 'bg-[#222] hover:bg-[#333] text-gray-300 border-[#444]' : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/15'
                }`}>
                {language} <ChevronDown size={10} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded border transition-all active:scale-95 shadow-sm ${darkMode ? 'bg-[#222] hover:bg-[#333] text-white border-[#444]' : 'bg-white/10 hover:bg-white/15 text-slate-100 border-white/15'
                  }`}
              >
                <Play size={10} className="text-emerald-300" /> Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "loading"}
                className={`flex items-center gap-1.5 text-white text-[10px] font-bold px-4 py-1 rounded shadow-md active:scale-95 transition-all ${submitState === "loading" ? "bg-emerald-600/70" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
              >
                {submitState === "loading" ? "Judging..." : <><Send size={10} /> Submit</>}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative transition-colors duration-300">
            <div className={`w-12 border-r text-right p-3 text-[12px] font-mono select-none transition-colors duration-300 ${darkMode
                ? 'bg-black border-slate-800/80 text-slate-600'
                : 'bg-[#EBEEF3] border-[#DCE1E8] text-slate-500'
              }`}>
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className={`flex-1 relative ${darkMode ? 'bg-black' : 'bg-[#F7F8FA]'}`}>
              <div
                ref={highlightRef}
                className={`code-highlight px-3 pointer-events-none transition-colors duration-300 ${darkMode ? 'text-[#d4d4d4]' : 'text-slate-800'
                  }`}
                aria-hidden="true"
              >
                {codeLines.map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: codeTokens(line) || "&nbsp;" }} />
                ))}
              </div>
              <textarea
                ref={editorRef}
                className={`code-textarea px-3 transition-colors duration-300 ${darkMode ? 'dark bg-[#1e1e1e] text-[#d4d4d4]' : 'light bg-[#F7F8FA] text-slate-800'
                  }`}
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
            className={`border-t flex flex-col transition-all duration-300 overflow-hidden ${isSubmitted ? "h-96" : "h-0 border-transparent"
              } ${darkMode ? 'border-[#3e3e42]' : 'border-gray-200'
              }`}
          >
            {isSubmitted && (
              <div className="flex-1 bg-white text-slate-800 overflow-y-auto p-4 relative dark:bg-slate-800 dark:text-slate-100">
                <button
                  onClick={handleCloseResults}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  title="Close results"
                >
                  ×
                </button>
                {submitState === "loading" && <p className="text-sm text-gray-600">Running tests...</p>}
                {submitState === "results" && (
                  <>
                    {(() => {
                      const times = testResults.map((t) => Number(t.time.split(" ")[0]) || 0);
                      const avg = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(3) : "0.000";
                      const max = times.length > 0 ? Math.max(...times).toFixed(3) : "0.000";
                      const passed = testResults.filter((t) => t.passed).length;
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-slate-500 text-xs font-semibold uppercase">Average time</p>
                              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{avg} s</p>
                              <p className="text-[11px] text-slate-500">{(avg * 1000).toFixed(0)} ms</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-slate-500 text-xs font-semibold uppercase">Maximum time</p>
                              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{max} s</p>
                              <p className="text-[11px] text-slate-500">{(max * 1000).toFixed(0)} ms</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            <ProgressSummary passed={passed} total={testResults.length} label="shown test case(s) passed" />
                            <ProgressSummary passed={4} total={4} label="hidden test case(s) passed" />
                          </div>
                          <div className="space-y-3">
                            {testResults.map((tc) => (
                              <div key={tc.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm dark:text-slate-100">
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

      <div className="h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-end px-6 gap-2 shrink-0">
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
}
