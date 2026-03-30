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
      bio: stored.bio || actualUser.bio || "",
      org: stored.org || actualUser.org || "",
      avatar: stored.avatar || actualUser.avatar || "",
      links: stored.links || actualUser.links || { github: "", linkedin: "" },
    };
  });

  const [editData, setEditData] = useState({
    name: profile.name,
    bio: profile.bio,
    org: profile.org,
    avatar: profile.avatar,
    links: profile.links,
  });

  useEffect(() => {
    setEditData({
      name: profile.name,
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
    <div className="fixed inset-0 z-[60] bg-black/60 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="flex min-h-full items-center justify-center">
        <div
          ref={modalRef}
          className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl lg:flex-row"
        >
          <button
            onClick={() => onClose?.()}
            className="absolute right-3 top-3 z-20 rounded-full border border-slate-600 bg-slate-900/80 p-2 text-slate-300 transition hover:bg-slate-800"
            aria-label="Close profile dashboard"
          >
            <FaTimes />
          </button>

          <aside className="w-full overflow-y-auto border-b border-slate-700 p-4 sm:p-5 lg:w-[22rem] lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={editData.avatar || profile.avatar}
                alt="avatar"
                className="h-24 w-24 rounded-full border-4 border-violet-500 object-cover sm:h-28 sm:w-28"
              />
              <div className="space-y-2">
                <h2 className="text-xl font-bold sm:text-2xl">{profile.name || actualUser.name}</h2>
                <div className="inline-block rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 sm:text-sm">
                  {profile.bio || actualUser.bio || "Aspiring Developer"}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {isEditing ? (
                <div className="space-y-3 text-sm">
                  <label className="block text-slate-300">Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-violet-400"
                  />

                  <label className="block text-slate-300">Bio</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-violet-400"
                    rows={3}
                  />

                  <label className="block text-slate-300">College</label>
                  <input
                    type="text"
                    value={editData.org}
                    onChange={(e) => setEditData((prev) => ({ ...prev, org: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-violet-400"
                  />

                  <label className="block text-slate-300">Profile Picture</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="cursor-pointer rounded-full border border-slate-600 bg-slate-800 px-3 py-2 text-center text-sm transition hover:bg-slate-700">
                      Upload
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                    <span className="text-xs text-slate-400">(preview updates instantly)</span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={onSaveProfile}
                      className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          name: profile.name,
                          bio: profile.bio,
                          org: profile.org,
                          avatar: profile.avatar,
                          links: profile.links,
                        });
                      }}
                      className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-slate-200 transition hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">{profile.bio || actualUser.bio || "No bio yet."}</p>
                  <p className="break-words text-slate-300">
                    <span className="font-semibold text-slate-200">College:</span>{" "}
                    {profile.org || actualUser.org || "Not added"}
                  </p>
                </div>
              )}

              {!isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    Edit Profile
                  </button>

                  <div className="flex items-center justify-center gap-4">
                    {[
                      {
                        key: "github",
                        icon: FaGithub,
                      },
                      {
                        key: "linkedin",
                        icon: FaLinkedin,
                      },
                    ].map(({ key, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSocialClick(key)}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] sm:h-12 sm:w-12"
                        style={{
                          background:
                            key === "github"
                              ? "linear-gradient(135deg, #171515, #6e5494)"
                              : "linear-gradient(135deg, #0a66c2, #00a0dc)",
                        }}
                        aria-label={key}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 profile-modal-scrollbar">
            <div className="mx-auto w-full max-w-3xl">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Contest Rating</p>
                  <p className="text-2xl font-bold sm:text-3xl">{derivedStats.rating}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Global Rank</p>
                  <p className="text-2xl font-bold sm:text-3xl">#{derivedStats.globalRank}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Contests Attended</p>
                  <p className="text-2xl font-bold sm:text-3xl">{derivedStats.contests}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Performance</p>
                  <div className="mt-4 h-24 overflow-hidden">
                    <div className="flex h-full items-end gap-2">
                      {derivedStats.history.map((point) => {
                        const height = Math.min(100, Math.max(16, (point.score / 2000) * 100));
                        return (
                          <div key={point.name} className="flex-1">
                            <div className="mx-auto h-full w-4 rounded bg-violet-400" style={{ height: `${height}%` }} />
                            <p className="mt-1 text-center text-[10px] text-slate-400">{point.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold">Solved Problems</h3>
                  <span className="text-sm text-slate-400">{derivedStats.solved.total} total</span>
                </div>
                <div className="space-y-3">
                  {["easy", "medium", "hard"].map((level) => {
                    const current = derivedStats.solved[level];
                    const perc = Math.round((current / maxBar) * 100);
                    const color =
                      level === "easy"
                        ? "bg-emerald-400"
                        : level === "medium"
                          ? "bg-amber-400"
                          : "bg-rose-400";
                    return (
                      <div key={level}>
                        <div className="mb-1 flex justify-between text-xs text-slate-300">
                          <span className="capitalize">{level}</span>
                          <span>{current}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-700">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${perc}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <h3 className="text-lg font-semibold">Badges</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-3">
                  {derivedStats.badges.slice(0, 5).map((badge) => (
                    <div
                      key={badge.name}
                      className={`rounded-lg border border-slate-700 bg-gradient-to-tr p-3 text-center text-sm font-semibold text-white ${badge.color}`}
                    >
                      {badge.name}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>,
    document.body
  );
}