import React, { useState, useEffect, useRef } from "react";
import { Search, Moon, Sun } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import PracticeWorkspace from "./pages/PracticeWorkspace";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { currentUser, loading } = useAuth();
  const DARK_STORAGE_KEY = "mockverse-dark";
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_STORAGE_KEY);
    if (stored === "true" || stored === "false") return stored === "true";
    return false;
  });
  const [view, setView] = useState("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
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

  const profile = {
    name: "Alex Johnson",
    role: "Senior Developer",
    email: "alex.johnson@example.com",
    location: "San Francisco, CA",
    memberSince: "Jan 2023",
    stats: {
      rating: "2120",
      rank: "#342",
      solved: 487,
      badges: 12,
    },
  };

  return (
    <div className="h-screen flex flex-col font-sans transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[#1A222C] dark:text-white">
      <header className="fixed top-0 left-0 right-0 z-[100] flex flex-nowrap justify-between items-center px-6 h-[44px] border-b backdrop-blur-md bg-gradient-to-r from-[#2f3f50] via-[#255a73] to-[#0e7b90] text-white shadow-md border-transparent dark:from-[#0b1224] dark:via-[#0f1f2f] dark:to-[#12324a] overflow-hidden">
        <div className="flex flex-nowrap items-center gap-2 lg:gap-4 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
            <div className="w-4 h-5 bg-white rounded-sm transform -rotate-12"></div>
          </div>
          <h1 className="text-lg lg:text-xl font-bold tracking-tight cursor-pointer whitespace-nowrap flex-shrink-0 text-white" onClick={() => setView("dashboard")}>
            Mock-Verse
          </h1>
          <div className="relative hidden md:block ml-2 lg:ml-4 flex-shrink min-w-0 max-w-xs lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.25 rounded-md text-sm w-full outline-none border transition-all bg-white/15 border-white/25 text-white placeholder-white/70 focus:border-white focus:bg-white/20"
            />
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-2 lg:gap-4 flex-shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 text-white ${
              darkMode ? "hover:bg-white/20 bg-white/10" : "hover:bg-white/20 bg-white/10"
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
                <span className="text-xs font-bold">AJ</span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#24303F] border border-gray-200 dark:border-[#313D4A] rounded-lg shadow-xl overflow-hidden z-[120]">
                <div className="py-2">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setIsProfilePanelOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    My Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                    Support
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700">
                  <button className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto mt-[44px]">
        {view === "dashboard" ? (
          <Dashboard darkMode={darkMode} onOpenPractice={() => setView("practice")} />
        ) : (
          <PracticeWorkspace onBack={() => setView("dashboard")} darkMode={darkMode} />
        )}
      </div>

      {view === "dashboard" && (
        <footer className="py-2 px-4 text-white text-[10px] font-semibold tracking-wider uppercase border-t border-slate-800 bg-[#0c1424] shadow-inner flex-shrink-0 flex items-center justify-center">
          (c) 2024 Mock-Verse. All rights reserved.
        </footer>
      )}

      {isProfilePanelOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/30 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md h-full bg-white dark:bg-[#1A222C] shadow-2xl border-l border-gray-200 dark:border-[#313D4A] p-6 overflow-y-auto transition-transform duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-red-400 to-orange-400 p-[2px] shadow-md">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#1e293b] flex items-center justify-center text-lg font-bold">
                    AJ
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfilePanelOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                aria-label="Close profile panel"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Profile</h3>
                <div className="rounded-xl border border-gray-200 dark:border-[#313D4A] bg-gray-50/70 dark:bg-[#24303F] p-4 space-y-2">
                  <Detail label="Email" value={profile.email} />
                  <Detail label="Location" value={profile.location} />
                  <Detail label="Member Since" value={profile.memberSince} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Rating" value={profile.stats.rating} accent="from-blue-500 to-indigo-500" />
                  <StatCard label="Global Rank" value={profile.stats.rank} accent="from-emerald-500 to-teal-500" />
                  <StatCard label="Solved" value={profile.stats.solved} accent="from-amber-500 to-orange-500" />
                  <StatCard label="Badges" value={profile.stats.badges} accent="from-pink-500 to-rose-500" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsProfilePanelOpen(false)} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#313D4A] bg-white dark:bg-[#24303F] p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
      <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}
