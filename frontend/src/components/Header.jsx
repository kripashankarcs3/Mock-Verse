import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Menu,
  X,
  Code,
  LayoutDashboard,
  MessageCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import Logo from "./Logo";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "practice", label: "Practice", icon: Code },
  { key: "contact", label: "Contact", icon: MessageCircle },
];

export default function Header({
  darkMode,
  setDarkMode,
  profile,
  view,
  setView,
  isProfileOpen,
  setIsProfileOpen,
  setIsProfilePanelOpen,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const closeAll = useCallback(() => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }, [setIsProfileOpen]);

  const goTo = useCallback(
    (next) => {
      setView(next);
      closeAll();
    },
    [setView, closeAll]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      try {
        sessionStorage.removeItem("mockverse-view");
      } catch {
        /* ignore */
      }
      setView("dashboard");
      closeAll();
      setIsProfilePanelOpen(false);
    } catch (error) {
      console.error("Logout error", error);
    }
  }, [setView, closeAll, setIsProfilePanelOpen]);

  // Close menus on outside click / Escape.
  useEffect(() => {
    if (!isProfileOpen && !isMenuOpen) return;

    const onPointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileOpen, isMenuOpen, setIsProfileOpen, closeAll]);

  const initials =
    (profile?.name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0f172a]/85">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Logo tagline onClick={() => goTo("dashboard")} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goTo(item.key)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                }`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              aria-label="Open account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white/60 transition-transform hover:scale-105 dark:ring-slate-900"
            >
              {initials}
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {profile?.name || "Learner"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {profile?.email || "Signed in"}
                  </p>
                </div>

                <div className="p-1.5">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setIsProfilePanelOpen(true);
                      setIsProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                  >
                    <User size={16} className="text-slate-400" aria-hidden="true" />
                    My Profile
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => goTo("settings")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                  >
                    <SettingsIcon size={16} className="text-slate-400" aria-hidden="true" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-slate-100 p-1.5 dark:border-slate-700">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 md:hidden"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      {isMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-[#0f172a] md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(item.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut size={18} aria-hidden="true" />
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
