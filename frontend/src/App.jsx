import React, { useState, useEffect } from "react";
import { User, Edit3, Mail, Settings as SettingsIcon, MapPin, Calendar, BookOpen, Fingerprint } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import PracticeWorkspace from "./pages/PracticeWorkspace";
import Login from "./pages/Login";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";

const DARK_STORAGE_KEY = "mockverse-dark";
const VIEW_STORAGE_KEY = "mockverse-view";
const profileStorageKey = (uid) => `mockverse-profile:${uid || "guest"}`;

const buildProfile = (user) => {
  const name = user?.displayName || (user?.email ? user.email.split("@")[0] : "Guest");
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const created = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;

  return {
    name,
    role: "Learner",
    about: "Tell us about yourself — open My Profile to edit.",
    email: user?.email || "",
    location: "Not set",
    memberSince: created
      ? created.toLocaleDateString(undefined, { month: "short", year: "numeric" })
      : "—",
    avatar: user?.photoURL || "",
    initials,
    stats: { rating: "—", rank: "—", solved: 0, badges: 0 },
  };
};

const loadProfile = (user) => {
  const base = buildProfile(user);
  try {
    const raw = localStorage.getItem(profileStorageKey(user?.uid));
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch {
    return base;
  }
};

export default function App() {
  const { currentUser, loading, authError } = useAuth();
  const [profile, setProfile] = useState(() => loadProfile(currentUser));
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
    return false;
  });
  const [view, setViewState] = useState(() => {
    try {
      return sessionStorage.getItem(VIEW_STORAGE_KEY) || "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const setView = (next) => {
    setViewState(next);
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(profile);


  useEffect(() => {
    localStorage.setItem(DARK_STORAGE_KEY, darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!currentUser) return;
    setProfile(loadProfile(currentUser));
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!isProfilePanelOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsProfilePanelOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isProfilePanelOpen]);

  useEffect(() => {
    if (isProfilePanelOpen) {
      setIsEditingProfile(false);
      setEditForm(profile);
    }
  }, [isProfilePanelOpen, profile]);

  // Show a clear error instead of a blank screen when auth is misconfigured.
  if (authError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] px-6">
        <div className="max-w-md text-center rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/50 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-rose-600">Authentication unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{authError}</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if user is not authenticated
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="h-screen flex flex-col font-sans transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[#1A222C] dark:text-white">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        profile={profile}
        view={view}
        setView={setView}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsProfilePanelOpen={setIsProfilePanelOpen}
      />


      <div className="flex-1 overflow-auto mt-[56px]">
        {view === "dashboard" ? (
          <Dashboard darkMode={darkMode} onOpenPractice={() => setView("practice")} />
        ) : view === "practice" ? (
          <PracticeWorkspace onBack={() => setView("dashboard")} darkMode={darkMode} />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-[#1A222C]">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <SettingsIcon size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 capitalize">
                {view.replace("-", " ")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                This section is currently under development. Please check back later for updates.
              </p>
              <button 
                onClick={() => setView("dashboard")} 
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {view === "dashboard" && (
        <footer className="py-2 px-4 text-white text-[10px] font-semibold tracking-wider uppercase border-t border-slate-800 bg-[#0c1424] shadow-inner flex-shrink-0 flex items-center justify-center">
          &copy; {new Date().getFullYear()} MockVerse. All rights reserved.
        </footer>
      )}

      {isProfilePanelOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsProfilePanelOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A222C] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#313D4A] p-6 md:p-8 overflow-y-auto max-h-[90vh] transition-all transform duration-300">
            <div className="flex items-start justify-between mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-red-400 to-orange-400 p-[2px] shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#1e293b] flex items-center justify-center text-lg font-bold overflow-hidden relative">
                    {editForm.avatar ? <img src={editForm.avatar} alt="Avatar" className="w-full h-full object-cover" /> : profile.initials}
                    {isEditingProfile && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 size={16} />
                        <span className="text-[10px] font-medium leading-tight mt-0.5 px-1 text-center">Edit</span>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setEditForm({ ...editForm, avatar: URL.createObjectURL(file) });
                        }}/>
                      </div>
                    )}
                  </div>
                </div>
                {!isEditingProfile ? (
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.role}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <input 
                      className="px-2 py-1 text-sm bg-white dark:bg-[#1A222C] border border-gray-300 dark:border-[#313D4A] rounded outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      placeholder="Name"
                    />
                    <input 
                      className="px-2 py-1 text-sm bg-white dark:bg-[#1A222C] border border-gray-300 dark:border-[#313D4A] rounded outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                      value={editForm.role} 
                      onChange={e => setEditForm({...editForm, role: e.target.value})} 
                      placeholder="Role"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 self-start ml-auto">
                {!isEditingProfile ? (
                  <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-lg transition-colors">
                    <Edit3 size={14} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setProfile(editForm);
                        try {
                          localStorage.setItem(
                            profileStorageKey(currentUser?.uid),
                            JSON.stringify(editForm)
                          );
                        } catch {
                          /* ignore quota errors */
                        }
                        setIsEditingProfile(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button onClick={() => { setEditForm(profile); setIsEditingProfile(false); }} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-lg transition-colors">Cancel</button>
                  </>
                )}
                <button
                  onClick={() => setIsProfilePanelOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-2"
                  aria-label="Close profile panel"
                >
                  X
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <BookOpen size={16} /> About Me
                  </h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 min-h-[5.5rem] relative group">
                    {!isEditingProfile ? (
                      <p className="leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-300 sm:ml-1">{profile.about}</p>
                    ) : (
                      <textarea
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-slate-900 dark:text-white resize-none transition-all"
                        rows={4}
                        value={editForm.about}
                        onChange={e => setEditForm({...editForm, about: e.target.value})}
                        placeholder="Tell us about yourself..."
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <Fingerprint size={16} /> Details
                  </h3>
                  <div className="flex flex-col gap-1 sm:ml-1">
                    <Detail icon={Mail} label="Email Address" value={profile.email} />
                    <Detail icon={MapPin} label="Location" value={profile.location} />
                    <Detail icon={Calendar} label="Member Since" value={profile.memberSince} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <User size={16} /> Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Rating" value={profile.stats.rating} accent="from-blue-500 to-indigo-500" />
                  <StatCard label="Global Rank" value={profile.stats.rank} accent="from-emerald-400 to-teal-500" />
                  <StatCard label="Solved Tasks" value={profile.stats.solved} accent="from-orange-400 to-amber-500" />
                  <StatCard label="Badges Won" value={profile.stats.badges} accent="from-pink-500 to-rose-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="group flex items-start gap-4 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300">
      <div className="mt-0.5 flex w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 dark:group-hover:text-blue-400 dark:group-hover:bg-blue-500/20 transition-all duration-300">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1 flex-1 pt-0.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
        <span className="font-semibold text-[14px] leading-tight text-slate-800 dark:text-slate-200">{value}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${accent} opacity-[0.04] dark:opacity-10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500`} />
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`h-1.5 rounded-t-full bg-gradient-to-r ${accent}`} />
      </div>
    </div>
  );
}



