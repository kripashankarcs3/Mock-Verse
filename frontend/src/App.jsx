import React, { useState, useEffect, useRef } from "react";
import { Moon, Sun, User, Edit3, Mail, Settings as SettingsIcon, LogOut, MapPin, Calendar, BookOpen, Fingerprint } from "lucide-react";
import { auth } from "./services/firebase";
import { signOut } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import PracticeWorkspace from "./pages/PracticeWorkspace";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { currentUser, loading } = useAuth();
  const DARK_STORAGE_KEY = "mockverse-dark";
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    role: "Senior Developer",
    about: "Passionate about building scalable web applications. Open to learning new technologies and exploring advanced CSS structures.",
    email: "alex.johnson@example.com",
    location: "San Francisco, CA",
    memberSince: "Jan 2023",
    avatar: "",
    initials: "AJ",
    stats: {
      rating: "2120",
      rank: "#342",
      solved: 487,
      badges: 12,
    },
  });
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
    return false;
  });
  const [view, setView] = useState("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const dropdownRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(DARK_STORAGE_KEY, darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isProfilePanelOpen) {
      setIsEditingProfile(false);
      setEditForm(profile);
    }
  }, [isProfilePanelOpen, profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

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
      <header className="fixed top-0 left-0 right-0 z-[100] flex flex-nowrap justify-between items-center px-6 h-[44px] border-b backdrop-blur-md bg-[linear-gradient(90deg,#34475a_0%,#25556d_38%,#1f6b83_68%,#f97316_88%,#fb7185_100%)] text-white shadow-md border-transparent dark:from-[#0b1224] dark:via-[#0f1f2f] dark:to-[#12324a]">
        <div className="flex flex-nowrap items-center gap-2 lg:gap-4 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-[#facc15] via-[#fb7185] to-[#6366f1] rounded-lg flex items-center justify-center shadow-[0_10px_24px_rgba(244,114,182,0.35)] flex-shrink-0">
            <div className="w-4 h-5 bg-white rounded-sm transform -rotate-12"></div>
          </div>
          <h1 className="text-lg lg:text-xl font-bold tracking-tight cursor-pointer whitespace-nowrap flex-shrink-0 text-white" onClick={() => setView("dashboard")}>
            Mock-Verse
          </h1>
        </div>

        <div className="flex flex-nowrap items-center gap-2 lg:gap-4 flex-shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 text-white ${
              darkMode ? "hover:bg-white/20 bg-white/10" : "hover:bg-[#fb7185]/20 bg-white/10"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 via-slate-900 to-black p-[2px] shadow-md cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-slate-900 text-white">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{profile?.initials || "AJ"}</span>
                )}
              </div>
            </button>

            <div
              className={`absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-[120] transition-all duration-200 ease-out origin-top-right ${
                isProfileOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="py-2 px-2 flex flex-col gap-1">
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors group"
                  onClick={() => {
                    setIsProfilePanelOpen(true);
                    setIsProfileOpen(false);
                  }}
                >
                  <User className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  My Profile
                </button>

                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors group"
                  onClick={() => {
                    setView("contact");
                    setIsProfileOpen(false);
                  }}
                >
                  <Mail className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  Contact
                </button>
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors group"
                  onClick={() => {
                    setView("settings");
                    setIsProfileOpen(false);
                  }}
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  Settings
                </button>
              </div>
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto mt-[44px]">
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
          (c) 2024 Mock-Verse. All rights reserved.
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
                    <button onClick={() => { setProfile(editForm); setIsEditingProfile(false); }} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Save</button>
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
