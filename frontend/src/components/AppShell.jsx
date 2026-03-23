import { useCallback, useEffect, useRef, useState } from "react";
import mockTantraKnot from "../assets/mockverse-logo.png";

function useRipple() {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);

  const onPointerDown = useCallback((e) => {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== id));
    }, 700);
  }, []);

  return { ref, ripples, onPointerDown };
}

function RippleWrap({ children, className = "", ...props }) {
  const { ref, ripples, onPointerDown } = useRipple();
  return (
    <span
      ref={ref}
      role="presentation"
      className={`ripple-container ${className}`}
      onPointerDown={onPointerDown}
      {...props}
    >
      {children}
      {ripples.map((r) => (
        <span key={r.id} className="ripple-wave" style={{ left: r.x, top: r.y }} />
      ))}
    </span>
  );
}

function IconDashboard({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 7h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm0-11h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v4a1 1 0 001 1z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCode({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 18l-6-6 6-6M16 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQuiz({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20a8 8 0 100-16 8 8 0 000 16z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M9.5 9.5h.01M14.5 9.5h.01M9.8 14.2c.8.9 1.9 1.4 3.2 1.4s2.4-.5 3.2-1.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconMock({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5M4 19h16M8 17V11M12 17V8M16 17v-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00-.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSun({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { id: "practice", label: "Practice", Icon: IconCode },
  { id: "quiz", label: "Quiz", Icon: IconQuiz },
  { id: "mock-builder", label: "Mock Tests", Icon: IconMock },
  { id: "analytics", label: "Analytics", Icon: IconChart },
  { id: "problems", label: "Problems", Icon: IconCode },
  { id: "settings", label: "Settings", Icon: IconSettings },
];

export default function AppShell({
  navActiveId,
  onNavigate,
  darkMode,
  onDarkModeChange,
  sidebarCollapsed,
  onSidebarCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  profileSection,
  searchQuery,
  onSearchChange,
  children,
  contentClassName = "",
}) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const closeMobile = () => onMobileOpenChange(false);

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 transition-colors duration-400 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header - Global & Non-Scrolling */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center border-b border-white/10 bg-[#1f2d33]/95 px-4 text-white shadow-xl backdrop-blur-xl transition-all dark:border-white/5 dark:bg-slate-950">
        <div className="flex items-center gap-3 lg:w-56">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
            onClick={() => onMobileOpenChange(true)}
          >
            <IconMenu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={mockTantraKnot} alt="" className="h-8 w-8 object-contain" />
            <span className="hidden text-lg font-bold tracking-tight text-white sm:block">
              Mock-Verse
            </span>
          </div>
        </div>

        <div className="relative hidden max-w-md flex-1 md:ml-8 md:block lg:ml-4">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-200" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems..."
            className="h-9 w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 text-sm text-white outline-none ring-slate-400/20 transition placeholder:text-slate-300 focus:bg-white/20 focus:ring-2"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={() => onDarkModeChange(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            {darkMode ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
          </button>
          <div className="shrink-0">{profileSection}</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-[#1f2d33]/95 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-white/5 dark:bg-slate-950 lg:static lg:z-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${sidebarCollapsed ? "lg:w-16" : "lg:w-64"}`}
          style={{ top: "4rem" }}
        >
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map(({ id, label, Icon }) => {
              const active = navActiveId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigate(id);
                    onMobileOpenChange(false);
                  }}
                  title={sidebarCollapsed ? label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-white/10 text-white shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  } ${sidebarCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      active ? "text-sky-400" : "text-slate-300 group-hover:text-white"
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  {active && !sidebarCollapsed && (
                    <div className="absolute left-0 h-6 w-1 rounded-r-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="border-t border-white/5 p-4">
            <button
              type="button"
              onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
              className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
            >
              <IconChevron className={`h-4 w-4 text-slate-200 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`min-w-0 flex-1 overflow-auto ${contentClassName}`}>
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}
    </div>
  );
}
