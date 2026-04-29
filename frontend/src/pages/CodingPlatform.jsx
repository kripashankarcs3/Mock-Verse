import { useState, useRef, useEffect } from "react";
import { runCode, getPublicProblems, submitCodeToJudge } from "../services/api";

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
  if (!line) return "&nbsp;";
  const keywords = /\b(int|void|for|if|return|using|namespace|std|include|cout|cin|sort|endl|else|while)\b/g;
  const types = /\b(INT_MAX)\b/g;
  const numbers = /\b(\d+)\b/g;
  const strings = /("[^"]*")/g;
  const comments = /(\/\/.*)/g;
  const preprocessor = /(#include[^\n]*)/g;

  let html = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Use a temporary map to store highlighted segments to avoid double-matching
  const segments = [];
  let segIdx = 0;
  const mark = (regex, cls) => {
    html = html.replace(regex, (match) => {
      const key = `__SEG_${segIdx}__`;
      segments[segIdx++] = `<span class="${cls}">${match}</span>`;
      return key;
    });
  };

  mark(preprocessor, "code-preprocessor");
  mark(strings, "code-string");
  mark(comments, "code-comment");
  mark(keywords, "code-keyword");
  mark(types, "code-type");
  mark(numbers, "code-number");

  // Restore segments
  segments.forEach((seg, i) => {
    html = html.replace(`__SEG_${i}__`, seg);
  });

  return html;
};

export default function CodingPlatform() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarQuestions, setSidebarQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(defaultCode);
  const [bottomTab, setBottomTab] = useState("terminal");
  const [problemTab, setProblemTab] = useState("Description");
  const [submitState, setSubmitState] = useState("idle");
  const [testResults, setTestResults] = useState([]);
  const [expandedCase, setExpandedCase] = useState(1);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(true);
  
  const editorRef = useRef(null);
  const highlightRef = useRef(null);

  const languages = ["cpp", "java"];
  const languageLabels = { cpp: "C++", java: "Java" };

  useEffect(() => {
    async function fetchProblems() {
      try {
        const data = await getPublicProblems();
        setSidebarQuestions(data);
        setLoadingProblems(false);
      } catch (error) {
        console.error("Failed to fetch problems:", error);
        setLoadingProblems(false);
      }
    }
    fetchProblems();
  }, []);

  const activeQuestion = sidebarQuestions[activeQuestionIndex] || null;

  const codeLines = code.split("\n");

  const handleScroll = () => {
    if (editorRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  const handleRun = async () => {
    if (!activeQuestion) return;
    setBottomTab("terminal");
    setTerminalOutput("Compiling...\n");
    
    try {
      const sampleInput = activeQuestion.testCases?.[0]?.input || "";
      const result = await runCode({ code, language, input: sampleInput });
      const output = result.stdout || result.stderr || result.compile_output || "No output";
      setTerminalOutput(
        `Status: ${result.status || "Unknown"}\n\nOutput:\n${output}\n\nExecution time: ${result.time}s  Memory: ${result.memory} KB`
      );
    } catch (error) {
      setTerminalOutput(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!activeQuestion) return;
    setSubmitState("loading");
    setShowResultsPanel(true);
    setBottomTab("testcases");
    
    try {
      const payload = {
        problemId: activeQuestion._id,
        code,
        language,
      };
      const data = await submitCodeToJudge(payload);
      
      const formattedResults = (data.results || []).map((res) => ({
        id: res.testcase,
        input: activeQuestion.testCases[res.testcase - 1]?.input || "",
        expectedOutput: res.expected,
        actualOutput: res.actual,
        passed: res.status === "Passed",
        time: `${res.durationSeconds ? (parseFloat(res.durationSeconds) * 1000).toFixed(0) : "?"} ms`,
        error: res.error,
      }));
      
      setTestResults(formattedResults);
      setSubmitState("results");
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitState("idle");
      setTerminalOutput(`Submission failed: ${error.response?.data?.error || error.message}`);
      setBottomTab("terminal");
    }
  };

  const progressColor = (passed, total) => {
    if (total === 0) return "#22c55e";
    const pct = passed / total;
    if (pct === 0) return "#ef4444";
    if (pct === 1) return "#15803d";
    return "#22c55e";
  };
  const progressPct = (passed, total) =>
    total === 0 ? 100 : Math.round((passed / total) * 100);

  const shownPassed = testResults.filter((t) => t.passed).length;
  const shownTotal = testResults.length;

  return (
    <div
      className="flex flex-col bg-gray-100 font-sans overflow-hidden h-full"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >
      <style>{`
        .code-keyword { color: #569cd6; font-weight: 500; }
        .code-string { color: #ce9178; }
        .code-comment { color: #6a9955; font-style: italic; }
        .code-number { color: #b5cea8; }
        .code-preprocessor { color: #c586c0; }
        .code-type { color: #4ec9b0; }
        .code-highlight { position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:auto;white-space:pre;font-family:'JetBrains Mono','Fira Code','Courier New',monospace;font-size:13px;line-height:21px;padding:8px 8px 8px 12px;margin:0; }
        .code-textarea { position:relative;z-index:2;background:transparent;color:transparent;caret-color:#fff;white-space:pre;font-family:'JetBrains Mono','Fira Code','Courier New',monospace;font-size:13px;line-height:21px;resize:none;outline:none;border:none;width:100%;height:100%;overflow:auto;padding:8px 8px 8px 12px; }
        .line-nums { user-select:none; }
        .fade-in { animation:fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:6px;height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#444;border-radius:3px; }
        .tc-badge { display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600; }
        .output-chip { display:inline-block;background:#4dd0e1;color:#00363a;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:600;margin:2px 2px 2px 0; }
        .mv-search { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #ccc; font-size: 13px; padding: 5px 12px 5px 34px; outline: none; width: 220px; transition: background 0.2s; }
        .mv-search:focus { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.22); }
        .mv-search::placeholder { color: #888; }
        .prob-tab-active { color: #2563eb; border-bottom: 2px solid #2563eb; font-weight: 600; }
        .prob-tab-inactive { color: #6b7280; border-bottom: 2px solid transparent; }
        .sidebar-panel { position:fixed;top:0;left:0;height:100%;width:280px;background:#f9fafb;box-shadow:4px 0 24px rgba(0,0,0,0.13);z-index:200;display:flex;flex-direction:column;transition:transform 0.28s cubic-bezier(0.4,0,0.2,1); }
        .sidebar-open { transform:translateX(0); }
        .sidebar-closed { transform:translateX(-100%); }
        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:199;backdrop-filter:blur(1px);animation:overlayIn 0.2s ease; }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        .q-item { display:flex;align-items:flex-start;gap:10px;padding:10px 16px;cursor:pointer;border-radius:8px;margin:2px 8px;transition:background 0.15s; }
        .q-item:hover { background:#e5e7eb; }
        .q-item.active { background:#eff6ff;border-left:3px solid #2563eb; }
        .diff-badge { font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px; }
        .diff-easy { background:#dcfce7;color:#15803d; }
        .diff-medium { background:#fef9c3;color:#854d0e; }
        .diff-hard { background:#fee2e2;color:#b91c1c; }
        .hamburger-btn { background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:4px;padding:6px;border-radius:6px;transition:background 0.15s; }
        .hamburger-btn:hover { background:rgba(255,255,255,0.1); }
        .hamburger-btn span { display:block;width:18px;height:2px;background:#e2e8f0;border-radius:2px;transition:all 0.2s; }
      `}</style>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar-panel ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <div>
            <p className="font-bold text-gray-800 text-sm">Questions</p>
            <p className="text-xs text-gray-400 mt-0.5">Problem Library</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {loadingProblems ? (
            <div className="p-4 text-center text-gray-400 text-xs">Loading problems...</div>
          ) : sidebarQuestions.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-xs">No problems found.</div>
          ) : (
            sidebarQuestions.map((q, idx) => (
              <div
                key={q._id || idx}
                className={`q-item ${activeQuestionIndex === idx ? "active" : ""}`}
                onClick={() => { setActiveQuestionIndex(idx); setSidebarOpen(false); }}
              >
                <div className="mt-0.5 shrink-0">
                  {activeQuestionIndex === idx ? (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#2563eb" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "#d1d5db" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: activeQuestionIndex === idx ? "#1d4ed8" : "#374151" }}
                  >
                    {q.title}
                  </p>
                  <span
                    className={`diff-badge mt-1 inline-block ${
                      q.difficulty === "Easy" ? "diff-easy" : q.difficulty === "Medium" ? "diff-medium" : "diff-hard"
                    }`}
                  >
                    {q.difficulty || "Medium"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className="px-4 py-3 shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-xs text-gray-400">Click a question to navigate</span>
        </div>
      </aside>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex flex-col bg-white border-r border-gray-200 overflow-hidden"
          style={{ width: "46%", minWidth: 300 }}
        >
          <div
            className="flex items-center shrink-0 px-4"
            style={{ height: 40, background: "#fff", borderBottom: "1px solid #e5e7eb" }}
          >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 mr-1"
              title="Open problem list"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span className="font-semibold text-gray-800 text-sm truncate">
              {activeQuestion ? activeQuestion.title : "Select a problem"}
            </span>
          </div>
          </div>

          <div
            className="flex items-end shrink-0 px-4"
            style={{ borderBottom: "1px solid #e5e7eb", background: "#fff" }}
          >
            {["Description", "Example"].map((tab) => (
              <button
                key={tab}
                onClick={() => setProblemTab(tab)}
                className={`text-xs px-3 py-2 mr-0.5 transition-colors ${problemTab === tab ? "prob-tab-active" : "prob-tab-inactive hover:text-gray-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-800 leading-relaxed">
            {activeQuestion ? (
              <>
                {problemTab === "Description" && (
                  <div className="whitespace-pre-wrap">{activeQuestion.statement || activeQuestion.description}</div>
                )}
                {problemTab === "Example" && (
                  <div className="py-2">
                    <p className="font-semibold text-gray-900 mb-3">Sample Test Cases</p>
                    {activeQuestion.testCases?.map((tc, i) => (
                      <div key={i} className="mb-4">
                        <p className="font-medium text-gray-700 mb-1">Test Case {i + 1}:</p>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2 font-mono text-xs">
                          <p className="text-gray-500 text-[10px] mb-1">Input</p>
                          <pre>{tc.input}</pre>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono text-xs">
                          <p className="text-gray-500 text-[10px] mb-1">Expected Output</p>
                          <pre>{tc.expectedOutput || tc.output}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Please select a problem from the sidebar
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-col items-center shrink-0 py-2 gap-3"
          style={{ width: 32, background: "#f8fafc", borderRight: "1px solid #e5e7eb" }}
        >
          <button className="text-gray-400 hover:text-blue-500 p-1" title="Explorer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          <div
            className="flex items-center justify-between px-3 shrink-0"
            style={{ height: 40, background: "#252526", borderBottom: "1px solid #3e3e42" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-sm">{language.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#3c3c3c] border border-[#555] text-gray-200 text-xs rounded px-2 py-1 pr-6 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23999' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 6px center",
                }}
              >
                {languages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
              </select>
              <button
                onClick={handleRun}
                disabled={!activeQuestion}
                className="flex items-center gap-1.5 text-gray-200 text-xs font-medium px-3 py-1 rounded transition-colors border border-[#555] hover:bg-[#4a4a4a] disabled:opacity-50"
                style={{ background: "#3c3c3c" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "loading" || !activeQuestion}
                className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-1 rounded transition-colors shadow disabled:opacity-50"
                style={{ background: submitState === "loading" ? "#166534" : "#16a34a" }}
              >
                {submitState === "loading" ? (
                  <>
                    <svg className="spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Judging...
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-1 overflow-hidden bg-[#1e1e1e]">
              <div
                className="line-nums text-right text-[#858585] text-[13px] leading-[21px] px-3 py-2 select-none font-mono min-w-[40px] overflow-hidden shrink-0"
                style={{ background: "#1e1e1e", borderRight: "1px solid #2d2d2d" }}
              >
                {codeLines.map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <div className="flex-1 relative overflow-hidden">
                <div
                  ref={highlightRef}
                  className="code-highlight text-[#d4d4d4] bg-[#1e1e1e] px-3"
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
                  onChange={(e) => setCode(e.target.value)}
                  onScroll={handleScroll}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
            </div>

            {showResultsPanel && submitState === "results" && (
              <div
                className="fade-in px-4 py-3 shrink-0"
                style={{ background: "#252526", borderTop: "1px solid #3e3e42", maxHeight: 120, overflowY: "auto" }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <div
                      className="rounded-lg px-3 py-1.5"
                      style={{ background: "rgba(21,128,61,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-300 text-xs font-semibold">
                          {shownPassed} out of {shownTotal} test case(s) passed
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 4, background: "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progressPct(shownPassed, shownTotal)}%`,
                            background: progressColor(shownPassed, shownTotal),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowResultsPanel(false); setSubmitState("idle"); }}
                    className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none"
                  >×</button>
                </div>
              </div>
            )}

            <div
              className="flex items-center shrink-0"
              style={{ background: "#252526", borderTop: "1px solid #3e3e42" }}
            >
              {[["terminal", "Terminal"], ["testcases", "Test Results"]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setBottomTab(id)}
                  className={`flex items-center gap-1.5 text-xs px-4 py-2.5 font-medium transition-colors ${bottomTab === id ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                  style={bottomTab === id ? { borderBottom: "2px solid #60a5fa", background: "#1e1e1e" } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              style={{
                height: 180,
                overflowY: "hidden",
                background: "#1e1e1e",
                borderTop: "1px solid #3e3e42",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {bottomTab === "terminal" ? (
                <div className="p-3 overflow-y-auto flex-1">
                  <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap">
                    {terminalOutput || <span className="text-gray-500">Run your code to see output here…</span>}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-y-auto px-2 py-2">
                  {submitState === "loading" && <div className="p-3 text-gray-500 text-xs animate-pulse">Running test cases...</div>}
                  {submitState === "results" && testResults.map((tc) => (
                    <div key={tc.id} className="mb-2 rounded border border-[#3e3e42] overflow-hidden">
                      <button
                        onClick={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#252526] text-left"
                      >
                        <span className={`text-xs ${tc.passed ? "text-green-400" : "text-red-400"}`}>
                          {tc.passed ? "✓" : "✗"} Test Case {tc.id}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-auto">{tc.time}</span>
                      </button>
                      {expandedCase === tc.id && (
                        <div className="p-2 grid grid-cols-2 gap-2 text-[10px] bg-[#1a1a1a]">
                          <div>
                            <p className="text-gray-500 mb-1">Expected</p>
                            <pre className="text-gray-300 font-mono">{tc.expectedOutput}</pre>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Actual</p>
                            <pre className={`font-mono ${tc.passed ? "text-green-300" : "text-red-300"}`}>{tc.actualOutput || tc.error || "N/A"}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
