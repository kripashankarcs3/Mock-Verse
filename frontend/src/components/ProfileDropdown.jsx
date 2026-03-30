import { useEffect, useRef } from "react";

export default function ProfileDropdown({
  open,
  onToggle,
  onMyProfile,
  onEditProfile,
  onSettings,
  onLogout,
  user,
  avatar,
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-slate-100 shadow-lg transition hover:bg-white/20"
        aria-label="Open user menu"
      >
        {avatar || user?.avatar ? (
          <img src={avatar || user?.avatar} alt="user" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{user?.initials || "ME"}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(12rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-2 text-sm text-slate-100 shadow-2xl sm:w-48">
          <button
            type="button"
            onClick={() => {
              onMyProfile();
              onToggle(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-800"
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={() => {
              onEditProfile();
              onToggle(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-800"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => {
              onSettings();
              onToggle(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-800"
          >
            Settings
          </button>
          <hr className="my-2 border-slate-700" />
          <button
            type="button"
            onClick={() => {
              onLogout();
              onToggle(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-rose-300 transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}