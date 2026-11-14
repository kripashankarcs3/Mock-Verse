import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { createOrUpdateUser } from "../services/api";
function BrandLogo({ compact = false, animate = false }) {
  const fullText = "Mock-verse";

  return (
    <div className={`w-full flex justify-center`}>
      <div className={`login-logo-card ${compact ? "py-3 px-5" : "py-4 px-6"}`}>
        <div className="flex flex-col items-center gap-1">
          <span className={`${compact ? "text-[2.6rem]" : "text-[3.6rem]"} mockverse-text login-logo-text`}>
            <span className="inline-block min-w-[12ch] text-center">
              {fullText.split("").map((char, idx) => (
                <span
                  key={idx}
                  className="hello-letter"
                  style={{ "--delay": animate ? `${idx * 140}ms` : "0ms" }}
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUser) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!email || !password || (isSignup && !name)) {
      setError("Please fill in all required fields.");
      setMessage("");
      return;
    }

    if (isSignup && !termsAccepted) {
      setError("You must agree to Terms and Privacy Policy to continue.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      if (user) {
        // Best-effort profile sync: a DB outage must not break sign-in.
        try {
          await createOrUpdateUser({
            name: user.displayName || name,
            email: user.email,
          });
        } catch (syncError) {
          console.warn("Profile sync failed:", syncError?.message);
        }
      }

      setMessage(isSignup ? "Account created successfully!" : "Signed in successfully!");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered. Please sign in.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user) {
        try {
          await createOrUpdateUser({
            name: user.displayName || "",
            email: user.email,
          });
        } catch (syncError) {
          console.warn("Profile sync failed:", syncError?.message);
        }
      }
    } catch (err) {
      setError(err.message || "Google login failed.");
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
        setMessage("If an account exists for that email, a reset link has been sent.");
      } else {
        setError("Could not send the reset email. Please try again.");
      }
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-login-hero dark:bg-[#0f172a] flex items-start sm:items-center justify-center px-4 py-6 relative">
      <div className="absolute inset-0 pointer-events-none">
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

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
        <div className="mx-auto max-w-[340px]">
          <div className="flex items-center justify-center">
            <BrandLogo animate={true} />
          </div>

          <div className="mt-3 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {isSignup ? "Sign up" : "Welcome Back, Coder!"}
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {isSignup ? "Already have an account?" : "Happy to see you back at Mock-Verse."}
              {" "}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:text-blue-700"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                  setMessage("");
                }}
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <form onSubmit={handleAuth} className="mt-4 space-y-2">
            <input type="text" name="fake-username" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="fake-password" autoComplete="current-password" className="hidden" tabIndex={-1} />
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  name="mocktantra-email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {isSignup && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    name="mocktantra-name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  name="mocktantra-password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {isSignup && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I agree to the <span className="text-blue-600 underline">Terms</span> and <span className="text-blue-600 underline">Privacy Policy</span>.
                  </span>
                </label>
              )}
            </div>

            {!isSignup && (
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-slate-800 underline-offset-2 transition hover:underline focus:outline-none dark:text-slate-300"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error ? (
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5c3f] via-[#ff4f36] to-[#ff2f15] px-4 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex-1 text-center">
                {isSubmitting ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
              </span>
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
              disabled
              title="GitHub login coming soon"
              aria-disabled="true"
              className="flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 opacity-60 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-slate-900" aria-hidden="true">
                  <path d="M12 .5C5.648.5.5 5.648.5 12A11.5 11.5 0 0 0 8.36 22.92c.575.106.784-.25.784-.555 0-.273-.01-.997-.015-1.957-3.18.69-3.852-1.533-3.852-1.533-.52-1.32-1.27-1.672-1.27-1.672-1.04-.71.08-.696.08-.696 1.15.08 1.755 1.182 1.755 1.182 1.02 1.748 2.676 1.243 3.328.95.104-.738.4-1.243.726-1.53-2.54-.29-5.21-1.27-5.21-5.654 0-1.25.446-2.27 1.178-3.07-.118-.288-.51-1.45.112-3.023 0 0 .96-.307 3.145 1.173A10.95 10.95 0 0 1 12 6.03c.975.005 1.957.132 2.875.387 2.183-1.48 3.142-1.173 3.142-1.173.624 1.573.232 2.735.115 3.023.734.8 1.176 1.82 1.176 3.07 0 4.395-2.674 5.36-5.222 5.645.41.354.776 1.05.776 2.117 0 1.528-.014 2.76-.014 3.135 0 .308.207.667.79.553A11.5 11.5 0 0 0 23.5 12C23.5 5.648 18.352.5 12 .5z" />
                </svg>
              </span>
              <span>GitHub</span>
            </button>
          </div>

          <p className="mt-6 text-center text-[1.05rem] text-slate-700 dark:text-slate-300">
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
