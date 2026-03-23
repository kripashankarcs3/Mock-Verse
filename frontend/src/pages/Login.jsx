import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import mockTantraKnot from "../assets/mockverse-logo.png";

function BrandLogo({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-4"}`}>
      <img
        src={mockTantraKnot}
        alt="Mock-Verse"
        className={`${compact ? "h-11 w-11" : "h-16 w-16"} ${compact ? "" : "float-soft"} object-contain`}
      />
      <div className="leading-none">
        <div className="flex items-end gap-0.5">
          <span className={`${compact ? "text-[1.55rem]" : "text-[3.15rem]"} font-black tracking-[-0.06em] text-[#103f7d]`}>
            Mock-
          </span>
          <span className={`${compact ? "text-[1.55rem]" : "text-[3.15rem]"} font-black tracking-[-0.06em] text-[#18c8ea]`}>
            Verse
          </span>
        </div>
        {!compact ? (
          <p className="mt-1 text-[0.88rem] font-extrabold uppercase tracking-[0.16em] text-[#103f7d]">
            Code. Practice. Create. Progress.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function Login() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  if (currentUser) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered. Please sign in.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        setError("No account found with this email.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="page-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(170,225,255,0.85),transparent_28%),linear-gradient(180deg,#edf7ff_0%,#f8fcff_100%)] px-6 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[14%] h-[820px] w-[820px] -translate-x-1/2 rounded-full border border-sky-100/70" />
        <div className="absolute left-1/2 top-[26%] h-[560px] w-[560px] -translate-x-1/2 rounded-full border border-sky-100/60" />
        <div className="absolute left-[14%] top-[24%] h-32 w-56 rounded-[28px] border border-slate-200/70 bg-white/18 shadow-[0_8px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm" />
        <div className="absolute left-[18%] top-[32%] h-56 w-36 rounded-[28px] border border-slate-200/70 bg-white/18 shadow-[0_8px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm" />
        <div className="absolute right-[12%] top-[22%] h-36 w-64 rounded-[28px] border border-slate-200/70 bg-white/18 shadow-[0_8px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm" />
        <div className="absolute right-[16%] top-[42%] h-40 w-64 rounded-[28px] border border-slate-200/70 bg-white/18 shadow-[0_8px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm" />
        <div className="absolute right-[18%] bottom-[20%] h-32 w-48 rounded-[28px] border border-slate-200/70 bg-white/18 shadow-[0_8px_28px_rgba(148,163,184,0.12)] backdrop-blur-sm" />
        <div className="absolute left-[26%] top-[18%] whitespace-pre text-sm leading-6 text-slate-300/80">
          {`return coder.login();\nconst result = solve(mock);\nif (passed) ship();`}
        </div>
        <div className="absolute right-[22%] top-[16%] whitespace-pre text-sm leading-6 text-slate-300/80">
          {`<App />\nimport workspace;\nclass TeamCoder {}`}
        </div>
        <div className="absolute left-[28%] bottom-[24%] whitespace-pre text-sm leading-6 text-slate-300/80">
          {`export default Login;\nconst score = 100;\nconsole.log(score);`}
        </div>
        <div className="absolute bottom-[-3rem] left-[-3rem] h-48 w-80 rounded-full bg-white/45 blur-2xl" />
        <div className="absolute bottom-8 right-8 h-56 w-72 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[780px] rounded-[34px] border border-white/80 bg-[radial-gradient(circle_at_top,rgba(168,228,255,0.34),transparent_34%),rgba(255,255,255,0.72)] px-10 py-10 shadow-[0_28px_80px_rgba(148,180,211,0.28)] backdrop-blur-xl md:px-14">
        <div className="mx-auto max-w-[410px]">
          <div className="flex items-center justify-center">
            <BrandLogo />
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-[3.15rem] font-black tracking-tight text-slate-900">
              {isSignup ? "Create an Account" : "Welcome Back, Coder!"}
            </h1>
            <p className="mt-2 text-[1.15rem] text-slate-700">
              {isSignup ? "Start your Mock-Verse journey today." : "Sign in to your Mock-Verse workspace."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="mt-8">
            <input type="text" name="fake-username" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="fake-password" autoComplete="current-password" className="hidden" tabIndex={-1} />
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-lg font-semibold text-slate-800">Email</label>
                <div className="flex h-14 items-center rounded-2xl border border-sky-300 bg-white px-4 text-slate-500 shadow-[0_8px_24px_rgba(148,163,184,0.08)]">
                  <input
                    type="email"
                    name="mocktantra-email"
                    autoComplete="off"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder=""
                    className="h-full w-full border-none bg-transparent text-[1.15rem] font-medium text-slate-700 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-lg font-semibold text-slate-800">Password</label>
                <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 shadow-[0_8px_24px_rgba(148,163,184,0.08)]">
                  <input
                    type="password"
                    name="mocktantra-password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder=""
                    className="h-full w-full border-none bg-transparent text-[1.15rem] font-medium text-slate-700 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[1.05rem] font-medium text-slate-800 underline-offset-4 transition hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-5 flex h-14 w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,#54c6f9_0%,#4f84f7_100%)] px-5 text-lg font-bold text-white shadow-[0_10px_26px_rgba(79,132,247,0.28)] transition hover:brightness-105"
            >
              <span className="flex-1 text-center">{isSignup ? "Sign Up" : "Sign In"}</span>
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4 text-[1.05rem] text-slate-500">
            <div className="h-px flex-1 bg-slate-300/80" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-300/80" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-14 items-center justify-center gap-3 rounded-full border border-white/80 bg-white/92 px-4 text-lg font-semibold text-slate-800 shadow-[0_8px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path fill="#EA4335" d="M12.24 10.285v3.914h5.414c-.226 1.29-.902 2.381-1.928 3.113l3.12 2.422c1.82-1.678 2.874-4.145 2.874-7.076 0-.673-.06-1.32-.172-1.948z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.965-.896 6.62-2.424l-3.12-2.422c-.867.582-1.977.926-3.5.926-2.688 0-4.964-1.815-5.778-4.255H3.003v2.506A9.997 9.997 0 0 0 12 22z" />
                  <path fill="#4A90E2" d="M6.222 13.825A5.996 5.996 0 0 1 5.9 12c0-.634.11-1.25.322-1.825V7.67H3.003A9.997 9.997 0 0 0 2 12c0 1.61.386 3.13 1.003 4.33z" />
                  <path fill="#FBBC05" d="M12 5.92c1.468 0 2.786.506 3.822 1.5l2.864-2.864C16.96 2.94 14.696 2 12 2A9.997 9.997 0 0 0 3.003 7.67l3.219 2.506C7.036 7.735 9.312 5.92 12 5.92z" />
                </svg>
              </span>
              <span>Google</span>
            </button>
            <button
              type="button"
              className="flex h-14 items-center justify-center gap-3 rounded-full border border-white/80 bg-white/92 px-4 text-lg font-semibold text-slate-800 shadow-[0_8px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-slate-900" aria-hidden="true">
                  <path d="M12 .5C5.648.5.5 5.648.5 12A11.5 11.5 0 0 0 8.36 22.92c.575.106.784-.25.784-.555 0-.273-.01-.997-.015-1.957-3.18.69-3.852-1.533-3.852-1.533-.52-1.32-1.27-1.672-1.27-1.672-1.04-.71.08-.696.08-.696 1.15.08 1.755 1.182 1.755 1.182 1.02 1.748 2.676 1.243 3.328.95.104-.738.4-1.243.726-1.53-2.54-.29-5.21-1.27-5.21-5.654 0-1.25.446-2.27 1.178-3.07-.118-.288-.51-1.45.112-3.023 0 0 .96-.307 3.145 1.173A10.95 10.95 0 0 1 12 6.03c.975.005 1.957.132 2.875.387 2.183-1.48 3.142-1.173 3.142-1.173.624 1.573.232 2.735.115 3.023.734.8 1.176 1.82 1.176 3.07 0 4.395-2.674 5.36-5.222 5.645.41.354.776 1.05.776 2.117 0 1.528-.014 2.76-.014 3.135 0 .308.207.667.79.553A11.5 11.5 0 0 0 23.5 12C23.5 5.648 18.352.5 12 .5z" />
                </svg>
              </span>
              <span>GitHub</span>
            </button>
          </div>

          <p className="mt-6 text-center text-[1.05rem] text-slate-700">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="font-semibold underline underline-offset-4"
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
