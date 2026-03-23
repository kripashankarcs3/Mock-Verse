import React from "react";

export function AnalyticsPlaceholder({ solvedCount, savedQuestions, savedMocks, totalVisitMinutes, visitActivity }) {
  return (
    <div className="page-shell relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617] px-6 py-8 md:px-10 flex flex-col items-center justify-center transition-colors">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden saturate-[150%]">
        <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-sky-400/60 mix-blend-multiply blur-[120px] dark:hidden" />
        <div className="absolute right-[5%] top-[20%] h-[400px] w-[400px] rounded-full bg-indigo-400/50 mix-blend-multiply blur-[120px] dark:hidden" />
        
        <div className="absolute left-[10%] top-[-10%] hidden h-[500px] w-[500px] rounded-full bg-sky-500/40 mix-blend-screen blur-[120px] dark:block" />
        <div className="absolute right-[5%] top-[20%] hidden h-[400px] w-[400px] rounded-full bg-indigo-500/30 mix-blend-screen blur-[120px] dark:block" />
      </div>
      
      <div className="relative z-10 text-center rounded-3xl border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-12 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Coming soon! You have solved {solvedCount} problems.</p>
      </div>
    </div>
  );
}

export function SettingsPlaceholder({ darkMode, onDarkModeChange, onLogout }) {
  return (
    <div className="page-shell relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617] px-6 py-8 md:px-10 flex flex-col items-center justify-center transition-colors">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden saturate-[150%]">
        <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-400/50 mix-blend-multiply blur-[120px] dark:hidden" />
        <div className="absolute right-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-rose-400/50 mix-blend-multiply blur-[120px] dark:hidden" />
        
        <div className="absolute bottom-[-10%] left-[20%] hidden h-[600px] w-[600px] rounded-full bg-emerald-500/30 mix-blend-screen blur-[120px] dark:block" />
        <div className="absolute right-[10%] top-[10%] hidden h-[400px] w-[400px] rounded-full bg-rose-500/30 mix-blend-screen blur-[120px] dark:block" />
      </div>

      <div className="relative z-10 text-center space-y-6 rounded-3xl border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-12 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <div className="flex items-center gap-4 justify-center bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-2xl">
          <label className="text-lg font-semibold text-slate-700 dark:text-slate-300">Dark Mode</label>
          <input 
            type="checkbox" 
            checked={darkMode} 
            onChange={(e) => onDarkModeChange(e.target.checked)} 
            className="w-6 h-6 rounded border-slate-300 text-[#18c69d] focus:ring-[#18c69d] bg-white dark:bg-slate-800 dark:border-slate-600"
          />
        </div>
        <button
          onClick={onLogout}
          className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/40 px-6 py-4 font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function DashboardPremium({
  solvedCount,
  savedMocks,
  totalVisitMinutes,
  currentStreak,
  activeDays,
  practiceProgress,
  quizProgress,
  mockProgress,
  savedQuestions,
  recentActivity,
  savedProblemHighlights,
  visitActivity,
  onOpenPractice,
  onQuiz,
  onMock,
}) {
  return (
    <div className="page-shell relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617] px-6 py-8 md:px-10 transition-colors">
      
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden saturate-[150%]">
        {/* Light Context */}
        <div className="absolute left-[5%] top-[-5%] h-[600px] w-[600px] rounded-full bg-sky-200/60 blur-[100px] dark:hidden" />
        <div className="absolute right-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-200/50 blur-[100px] dark:hidden" />
        <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-emerald-100/60 blur-[100px] dark:hidden" />
        <div className="absolute bottom-[5%] right-[10%] h-[550px] w-[550px] rounded-full bg-rose-200/55 blur-[100px] dark:hidden" />
        <div className="absolute top-[40%] left-[40%] h-[400px] w-[400px] rounded-full bg-amber-100/50 blur-[100px] dark:hidden" />
        
        {/* Dark Context */}
        <div className="absolute left-[5%] top-[-5%] hidden h-[600px] w-[600px] rounded-full bg-sky-500/20 blur-[100px] dark:block" />
        <div className="absolute right-[5%] top-[10%] hidden h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[100px] dark:block" />
        <div className="absolute bottom-[-10%] left-[20%] hidden h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[100px] dark:block" />
        <div className="absolute bottom-[5%] right-[10%] hidden h-[550px] w-[550px] rounded-full bg-rose-500/15 blur-[100px] dark:block" />
        <div className="absolute top-[40%] left-[40%] hidden h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px] dark:block" />
        
        {/* Universal Grid Pattern overlay (opacity scaled depending on mode) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.06]" />
      </div>

      <div className="relative z-10 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            Dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Welcome back! Here is your progress overview.
          </p>
        </div>
      </div>
      
      <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Questions</p>
          <p className="mt-2 text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm">{solvedCount}</p>
        </div>
        <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Study Time</p>
          <p className="mt-2 text-4xl font-black text-[#18c69d] dark:text-[#2dd4bf] drop-shadow-sm">{totalVisitMinutes}m</p>
        </div>
        <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Active Streak</p>
          <p className="mt-2 text-4xl font-black text-orange-500 dark:text-orange-400 drop-shadow-sm">{currentStreak} Days</p>
        </div>
        <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Mock Tests</p>
          <p className="mt-2 text-4xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm">{savedMocks.length}</p>
        </div>
      </div>

      <div className="relative z-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[30px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl overflow-hidden relative">
             <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-300/40 to-sky-300/40 dark:from-indigo-900/40 dark:to-sky-900/40 blur-3xl" />
             <h2 className="relative z-10 text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-6 drop-shadow-sm">Quick Actions</h2>
             <div className="relative z-10 flex flex-wrap gap-4">
               <button onClick={onOpenPractice} className="rounded-2xl bg-[#0b1f44] dark:bg-[#1e293b] dark:border dark:border-slate-600 px-6 py-4 text-lg font-bold text-white transition hover:scale-[1.03] hover:shadow-lg shadow-md">
                 Practice Questions
               </button>
               <button onClick={onQuiz} className="rounded-2xl bg-[linear-gradient(135deg,#18c8ea_0%,#10a5c4_100%)] dark:bg-[linear-gradient(135deg,#0f766e_0%,#0d5e58_100%)] px-6 py-4 text-lg font-bold text-[#0b1f44] dark:text-white transition hover:scale-[1.03] hover:shadow-lg shadow-md">
                 Take a Quiz
               </button>
               <button onClick={onMock} className="rounded-2xl border-2 border-[#103f7d] dark:border-slate-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-4 text-lg font-bold text-[#103f7d] dark:text-slate-100 transition hover:scale-[1.03] hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                 Mock Test Studio
               </button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/60 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 drop-shadow-sm">Recent Activity</h3>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 p-4 transition-colors">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{activity.label}</p>
                    <p className="text-base font-medium text-slate-800 dark:text-slate-200">{activity.text}</p>
                    <p className="text-sm text-[#18c69d] dark:text-[#2dd4bf] font-bold mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4 font-medium">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
