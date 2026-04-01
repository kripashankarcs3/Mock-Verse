import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaGithub, FaLinkedin, FaTimes } from "react-icons/fa";

const PROFILE_STORAGE_KEY = "user_profile_data";

const dummyData = {
  user: {
    name: "Kripa Dev",
    handle: "@kripa_dev",
    bio: "Aspiring Developer",
    location: "Bengaluru, India",
    org: "OpenAI University",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
    links: {
      github: "https://github.com/kripa",
      linkedin: "https://linkedin.com/in/kripa",
    },
  },
  stats: {
    rating: 1845,
    globalRank: 2721,
    contests: 22,
    history: [
      { name: "Jan", score: 1250 },
      { name: "Feb", score: 1440 },
      { name: "Mar", score: 1580 },
      { name: "Apr", score: 1700 },
      { name: "May", score: 1845 },
      { name: "Jun", score: 1900 },
    ],
    solved: {
      total: 143,
      easy: 60,
      medium: 58,
      hard: 25,
    },
    badges: [
      { name: "Fast Coder", color: "from-green-400 to-teal-500" },
      { name: "Night Owl", color: "from-purple-500 to-indigo-600" },
      { name: "Problem Solver", color: "from-yellow-400 to-orange-500" },
      { name: "Consistency King", color: "from-blue-400 to-sky-500" },
      { name: "Bug Hunter", color: "from-red-400 to-pink-500" },
    ],
  },
};

const loadProfileFromStorage = () => {
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Error loading profile from localStorage:", err);
  }
  return {
    name: "",
    location: "",
    bio: "",
    org: "",
    avatar: "",
    links: {
      github: "",
      linkedin: "",
    },
  };
};

const saveProfileToStorage = (profileData) => {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  } catch (err) {
    console.error("Error saving profile to localStorage:", err);
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function ProfileModal({ open, onClose, user, stats, submissions = [], onProfileUpdate }) {
  const modalRef = useRef(null);

  const actualUser = user || dummyData.user;
  const submissionList = Array.isArray(submissions) ? submissions : [];

  const totalSolved = submissionList.filter((s) => s.result === "Accepted").length;
  const easySolved = submissionList.filter((s) => s.result === "Accepted" && s.difficulty === "easy").length;
  const mediumSolved = submissionList.filter((s) => s.result === "Accepted" && s.difficulty === "medium").length;
  const hardSolved = submissionList.filter((s) => s.result === "Accepted" && s.difficulty === "hard").length;

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(() => {
    const stored = loadProfileFromStorage();
    return {
      name: stored.name || actualUser.name || "",
      location: stored.location || actualUser.location || "",
      bio: stored.bio || actualUser.bio || "",
      org: stored.org || actualUser.org || "",
      avatar: stored.avatar || actualUser.avatar || "",
      links: stored.links || actualUser.links || { github: "", linkedin: "" },
    };
  });

  const [editData, setEditData] = useState({
    name: profile.name,
    location: profile.location,
    bio: profile.bio,
    org: profile.org,
    avatar: profile.avatar,
    links: profile.links,
  });

  useEffect(() => {
    setEditData({
      name: profile.name,
      location: profile.location,
      bio: profile.bio,
      org: profile.org,
      avatar: profile.avatar,
      links: profile.links,
    });
  }, [profile]);

  const derivedStats = {
    ...dummyData.stats,
    ...stats,
    solved: {
      ...dummyData.stats.solved,
      ...((stats && stats.solved) || {}),
      total: stats?.solved?.total ?? totalSolved,
      easy: stats?.solved?.easy ?? easySolved,
      medium: stats?.solved?.medium ?? mediumSolved,
      hard: stats?.solved?.hard ?? hardSolved,
    },
  };

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  const maxBar = derivedStats.solved.total || 1;

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setEditData((prev) => ({ ...prev, avatar: base64 }));
    } catch (err) {
      console.error("Error converting image to base64:", err);
    }
  };

  const onSaveProfile = () => {
    const updatedProfile = { ...profile, ...editData };
    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
    setIsEditing(false);
    onProfileUpdate?.(updatedProfile);
  };

  const handleSocialClick = (platform) => {
    const URL = editData.links?.[platform] || profile.links?.[platform];
    if (URL) {
      window.open(URL, "_blank");
      return;
    }
    const value = window.prompt(`Enter ${platform} URL (e.g. https://github.com/username)`);
    if (value) {
      const updatedProfile = {
        ...profile,
        links: {
          ...profile.links,
          [platform]: value,
        },
      };
      setEditData((prev) => ({
        ...prev,
        links: {
          ...prev.links,
          [platform]: value,
        },
      }));
      setProfile(updatedProfile);
      saveProfileToStorage(updatedProfile);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-3 py-4 sm:px-6">
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative z-10 flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b1629] lg:flex-row"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={() => onClose?.()}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-105 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          aria-label="Close profile modal"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <aside className="w-full max-w-[320px] flex-shrink-0 overflow-y-auto bg-gradient-to-b from-indigo-600 via-indigo-700 to-slate-900 px-5 py-6 text-white shadow-inner lg:px-7">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-white/40 ring-offset-2 ring-offset-indigo-700">
                {editData.avatar || profile.avatar ? (
                  <img src={editData.avatar || profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold">
                    {profile.name?.[0] || actualUser.name?.[0] || "U"}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-tight">{profile.name || actualUser.name}</h2>
                <p className="text-sm text-indigo-100">{actualUser.handle}</p>
                <p className="mt-2 text-sm text-indigo-100">{profile.bio || actualUser.bio || "Add a short bio."}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-indigo-50">
              <InfoRow label="Location" value={profile.location || actualUser.location} />
              <InfoRow label="College / Company" value={profile.org || actualUser.org} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <span className="text-xs uppercase tracking-widest text-indigo-100/80">Links</span>
              <div className="flex items-center gap-3 text-lg">
                <button
                  type="button"
                  onClick={() => handleSocialClick("github")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="GitHub"
                >
                  <FaGithub />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialClick("linkedin")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin />
                </button>
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="w-full rounded-lg bg-white text-indigo-700 px-4 py-2 text-sm font-semibold shadow-md transition hover:-translate-y-[1px] hover:shadow-lg"
              >
                {isEditing ? "Close Editor" : "Edit Profile"}
              </button>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20">
                Change Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            {isEditing && (
              <div className="mt-3 space-y-3 text-sm text-indigo-50">
                <LabeledField label="Name">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-indigo-200/70 focus:border-white/60"
                  />
                </LabeledField>

                <LabeledField label="Bio">
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-indigo-200/70 focus:border-white/60"
                    rows={3}
                  />
                </LabeledField>

                <LabeledField label="Location">
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-indigo-200/70 focus:border-white/60"
                  />
                </LabeledField>

                <LabeledField label="College / Company">
                  <input
                    type="text"
                    value={editData.org}
                    onChange={(e) => setEditData((prev) => ({ ...prev, org: e.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-indigo-200/70 focus:border-white/60"
                  />
                </LabeledField>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSaveProfile}
                    className="flex-1 rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900 shadow-md transition hover:-translate-y-[1px] hover:shadow-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        name: profile.name,
                        location: profile.location,
                        bio: profile.bio,
                        org: profile.org,
                        avatar: profile.avatar,
                        links: profile.links,
                      });
                    }}
                    className="flex-1 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-indigo-100/80">Data is stored locally in this browser.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-4 text-slate-900 dark:from-[#0b1629] dark:to-[#0a1020] dark:text-slate-100 sm:p-6 lg:p-8 profile-modal-scrollbar">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <MetricCard label="Contest Rating" value={derivedStats.rating} accent="from-sky-500 to-indigo-500" />
              <MetricCard label="Global Ranking" value={`#${derivedStats.globalRank}`} accent="from-emerald-500 to-teal-500" />
              <MetricCard label="Contests Attended" value={derivedStats.contests} accent="from-amber-400 to-orange-500" />
              <div className="md:col-span-3 lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Performance</p>
                    <p className="text-lg font-semibold">Last 6 contests</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    Line Chart
                  </span>
                </div>
                <div className="mt-3 rounded-xl bg-gradient-to-b from-slate-50 to-white p-3 dark:from-slate-800 dark:to-slate-900">
                  <LineChart data={derivedStats.history} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Solved Problems</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{derivedStats.solved.total}</p>
                </div>
                <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Easy {derivedStats.solved.easy}</span>
                  <span>• Medium {derivedStats.solved.medium}</span>
                  <span>• Hard {derivedStats.solved.hard}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {["easy", "medium", "hard"].map((level) => {
                  const current = derivedStats.solved[level];
                  const perc = Math.round((current / maxBar) * 100);
                  const color =
                    level === "easy" ? "bg-emerald-400" : level === "medium" ? "bg-amber-400" : "bg-rose-400";
                  return (
                    <div key={level}>
                      <div className="mb-1 flex justify-between text-sm font-medium capitalize">
                        <span>{level}</span>
                        <span>{current}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Badges</p>
                  <p className="text-lg font-semibold">Recent Achievements</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3">
                {derivedStats.badges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.name}
                    className={`rounded-xl border border-slate-100 bg-gradient-to-tr p-4 text-center text-sm font-semibold text-white shadow-sm dark:border-slate-800 ${badge.color}`}
                  >
                    {badge.name}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2">
      <span className="text-xs uppercase tracking-widest text-indigo-100/80">{label}</span>
      <span className="text-sm font-semibold text-white">{value || "Not added"}</span>
    </div>
  );
}

function LabeledField({ label, children }) {
  return (
    <label className="block text-xs uppercase tracking-[0.12em] text-indigo-100/80">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <div className={`mt-3 h-1.5 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

function LineChart({ data = [] }) {
  if (!data.length) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">No data</div>;
  }

  const width = 480;
  const height = 180;
  const padding = 16;
  const maxScore = Math.max(...data.map((d) => d.score), 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : width - padding * 2;

  const points = data.map((point, idx) => {
    const x = padding + idx * step;
    const y = height - padding - (point.score / maxScore) * (height - padding * 2);
    return { x, y, label: point.name, value: point.score };
  });

  const polyPoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPoints = [
    `${padding},${height - padding}`,
    polyPoints,
    `${padding + step * (data.length - 1)},${height - padding}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-slate-500">
      <defs>
        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGradient)" />
      <polyline points={polyPoints} fill="none" stroke="url(#chartGradient)" strokeWidth="3" strokeLinecap="round" />
      {points.map((point, idx) => (
        <g key={point.label + idx}>
          <circle cx={point.x} cy={point.y} r="5" fill="#6366f1" stroke="#e0e7ff" strokeWidth="2" />
          <text x={point.x} y={height - 4} textAnchor="middle" fontSize="11" className="fill-current">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
