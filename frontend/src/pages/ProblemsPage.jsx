import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createProblem,
  getPublicProblems,
  getUserProblems,
  deleteProblem,
} from "../services/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

function Tag({ children, color = "slate" }) {
  const colors = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function ProblemCard({ problem, isOwner, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`"${problem.title}" delete karna chahte ho?`)) return;
    setDeleting(true);
    try {
      await onDelete(problem._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">
            {problem.title}
          </h3>
          {problem.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {problem.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Tag color={problem.isPublic ? "teal" : "slate"}>
            {problem.isPublic ? "Public" : "Private"}
          </Tag>
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-900/30"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>🧪 {problem.testCases?.length || 0} test cases</span>
        <span>·</span>
        <span className="uppercase tracking-wide">{problem.language || "cpp"}</span>
        <span>·</span>
        <span>{new Date(problem.createdAt).toLocaleDateString("en-IN")}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = ["My Problems", "Public Problems", "Add Problem"];

export default function ProblemsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("My Problems");

  // Lists
  const [myProblems, setMyProblems] = useState([]);
  const [publicProblems, setPublicProblems] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Fetch
  const fetchMyProblems = useCallback(async () => {
    if (!currentUser) return;
    setLoadingMine(true);
    try {
      const data = await getUserProblems(currentUser.uid);
      setMyProblems(data);
    } catch {
      setFetchError("Aapke problems load nahi ho sake. Backend chal raha hai?");
    } finally {
      setLoadingMine(false);
    }
  }, [currentUser]);

  const fetchPublicProblems = useCallback(async () => {
    setLoadingPublic(true);
    try {
      const data = await getPublicProblems();
      setPublicProblems(data);
    } catch {
      setFetchError("Public problems load nahi ho sake.");
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProblems();
    fetchPublicProblems();
  }, [fetchMyProblems, fetchPublicProblems]);

  // Test case helpers
  const updateTestCase = (index, field, value) =>
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  const addTestCase = () =>
    setTestCases((prev) => [...prev, { input: "", expectedOutput: "" }]);
  const removeTestCase = (index) =>
    setTestCases((prev) => prev.filter((_, i) => i !== index));

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title zaroor dena hai!");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      await createProblem({
        title: formTitle.trim(),
        description: formDesc.trim(),
        testCases,
        isPublic: formIsPublic,
        createdBy: currentUser.uid,
      });
      setFormSuccess("✅ Problem save ho gayi!");
      setFormTitle("");
      setFormDesc("");
      setFormIsPublic(false);
      setTestCases([{ input: "", expectedOutput: "" }]);
      fetchMyProblems();
      if (formIsPublic) fetchPublicProblems();
    } catch (err) {
      setFormError(err?.response?.data?.error || "Kuch galat ho gaya, dobara try karo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    await deleteProblem(id);
    setMyProblems((prev) => prev.filter((p) => p._id !== id));
    setPublicProblems((prev) => prev.filter((p) => p._id !== id));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">📚 Problems</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Apne problems manage karo aur public problems explore karo.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {tab}
              {tab === "My Problems" && !loadingMine && (
                <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  {myProblems.length}
                </span>
              )}
              {tab === "Public Problems" && !loadingPublic && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {publicProblems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {fetchError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            ⚠️ {fetchError}
          </div>
        )}

        {/* ── Tab: My Problems ── */}
        {activeTab === "My Problems" && (
          <div>
            {loadingMine ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                Loading...
              </div>
            ) : myProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center dark:border-slate-700">
                <p className="text-4xl">🤔</p>
                <p className="mt-3 text-lg font-semibold text-slate-600 dark:text-slate-300">
                  Koi problem nahi banayi abhi tak!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("Add Problem")}
                  className="mt-4 rounded-xl bg-teal-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-teal-600"
                >
                  + Pehli problem banao
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myProblems.map((p) => (
                  <ProblemCard key={p._id} problem={p} isOwner onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Public Problems ── */}
        {activeTab === "Public Problems" && (
          <div>
            {loadingPublic ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                Loading...
              </div>
            ) : publicProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center dark:border-slate-700">
                <p className="text-4xl">🌐</p>
                <p className="mt-3 text-lg font-semibold text-slate-600 dark:text-slate-300">
                  Abhi koi public problem nahi hai.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicProblems.map((p) => (
                  <ProblemCard
                    key={p._id}
                    problem={p}
                    isOwner={p.createdBy === currentUser?.uid}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Add Problem ── */}
        {activeTab === "Add Problem" && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
              Nayi Problem Banao
            </h2>

            {/* Title */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-teal-900"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                rows={4}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Problem statement aur constraints likho..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-teal-900"
              />
            </div>

            {/* Test Cases */}
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Test Cases
                </label>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-teal-600 transition hover:bg-teal-50 dark:hover:bg-teal-900/30"
                >
                  + Add Case
                </button>
              </div>
              <div className="space-y-3">
                {testCases.map((tc, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Test Case {i + 1}</span>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(i)}
                          className="text-xs text-rose-400 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-400">Input</label>
                        <textarea
                          rows={2}
                          value={tc.input}
                          onChange={(e) => updateTestCase(i, "input", e.target.value)}
                          placeholder="Input..."
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none focus:border-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-400">
                          Expected Output
                        </label>
                        <textarea
                          rows={2}
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                          placeholder="Expected output..."
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none focus:border-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Toggle */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormIsPublic((prev) => !prev)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  formIsPublic ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    formIsPublic ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formIsPublic ? "Public (sab dekh sakte hain)" : "Private (sirf tum)"}
              </span>
            </div>

            {/* Feedback */}
            {formError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-teal-500 font-bold text-white transition hover:bg-teal-600 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Problem"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
