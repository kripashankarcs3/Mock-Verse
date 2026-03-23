import os

file_path = r"c:\Users\kripa\Desktop\ai browser agent\frontend\src\App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove BrandLogo and LoginScreen
import re

# We will use regex to carefully match and remove BrandLogo and LoginScreen
content = re.sub(
    r"function BrandLogo\(\{ compact = false \}\) \{.*?\n\}\n+function LoginScreen\(.*?\}\n+function ActivityCalendar",
    r"function ActivityCalendar",
    content,
    flags=re.DOTALL
)

# 2. Update profile useMemo
content = content.replace("buildUserProfile(loginEmail)", 'buildUserProfile(currentUser?.email || "coder")')
content = content.replace("[loginEmail, profileData]", "[currentUser, profileData]")

# 3. Update openPractice
old_open_practice = """  const openPractice = (questionId = selectedQuestionId) => {
    setSelectedQuestionId(questionId);
    setActiveView("practice");
  };"""
new_open_practice = """  const openPractice = (questionId = selectedQuestionId) => {
    setSelectedQuestionId(questionId);
    navigate("/practice");
  };"""
content = content.replace(old_open_practice, new_open_practice)

# 4. Update handleLogout and remove handleLogin/GoogleLogin
old_auth_handlers = """  const handleLogin = (event) => {
    event.preventDefault();
    setLoginError("Please use the Google Sign-In option.");
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError("");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveView("dashboard");
      setProfileMenuOpen(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    } catch (err) {
      console.error("Logout error", err);
    }
  };"""

new_auth_handlers = """  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileMenuOpen(false);
    } catch (err) {
      console.error("Logout error", err);
    }
  };"""
content = content.replace(old_auth_handlers, new_auth_handlers)

# 5. Fix handleShellNavigate
old_shell_navigate = """  const handleShellNavigate = (id) => {
    if (id === "practice") openPractice(selectedQuestionId);
    else setActiveView(id);
  };"""
new_shell_navigate = """  const handleShellNavigate = (id) => {
    if (id === "practice") {
      openPractice(selectedQuestionId);
    } else {
      navigate(id === "dashboard" ? "/" : `/${id}`);
    }
  };"""
content = content.replace(old_shell_navigate, new_shell_navigate)

# 6. Remove the `if (!isAuthenticated)` block completely
content = re.sub(
    r"  if \(!isAuthenticated\) \{\s*return \(\s*<LoginScreen.*?</LoginScreen>\s*\);\s*\}",
    "",
    content,
    flags=re.DOTALL
)

# 7. Restructure mainContent rendering
# Find "let mainContent;" up to the end of the giant `else` block
# we will construct a React Router <Routes>
pattern = r"let mainContent;.*?<ExplorerPanel"
replacement = """const mainContent = (
    <Routes>
      <Route path="/" element={<DashboardPremium
        solvedCount={solvedCount}
        savedMocks={savedMocks}
        totalVisitMinutes={totalVisitMinutes}
        currentStreak={currentStreak}
        activeDays={activeDays}
        practiceProgress={practiceProgress}
        quizProgress={quizProgress}
        mockProgress={mockProgress}
        savedQuestions={savedQuestions}
        recentActivity={recentActivity}
        savedProblemHighlights={savedProblemHighlights}
        visitActivity={visitActivity}
        onOpenPractice={() => openPractice(selectedQuestionId)}
        onQuiz={() => navigate("/quiz")}
        onMock={() => navigate("/mock-builder")}
      />} />
      <Route path="/analytics" element={<AnalyticsPlaceholder
        solvedCount={solvedCount}
        savedQuestions={savedQuestions}
        savedMocks={savedMocks}
        totalVisitMinutes={totalVisitMinutes}
        visitActivity={visitActivity}
      />} />
      <Route path="/settings" element={<SettingsPlaceholder
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        onLogout={handleLogout}
      />} />
      <Route path="/quiz" element={<QuizSection
        embedded
        savedQuestions={savedQuestions}
        onOpenPractice={openPractice}
        onBack={() => navigate("/")}
      />} />
      <Route path="/mock-builder" element={<MockBuilder
        embedded
        savedQuestions={savedQuestions}
        savedMocks={savedMocks}
        mockTitle={mockTitle}
        setMockTitle={setMockTitle}
        mockDuration={mockDuration}
        setMockDuration={setMockDuration}
        selectedMockQuestionIds={selectedMockQuestionIds}
        toggleMockQuestion={toggleMockQuestion}
        createMock={createMock}
        startMock={startMock}
        editMock={editMock}
        deleteMock={deleteMock}
        onBack={() => navigate("/")}
      />} />
      <Route path="/mock-summary" element={<MockSummary result={mockSummary} onBack={() => navigate("/mock-builder")} />} />
      <Route path="/practice" element={
        <div className="relative h-[calc(100dvh-4rem)] min-h-[320px] w-full overflow-hidden bg-[#dbe4f1] text-slate-800 dark:bg-[#2d3d45] dark:text-slate-100">
          <div className="relative flex h-full min-h-0 w-full flex-col">
            <div className="flex flex-1 flex-col xl:flex-row min-h-0 w-full">
              <ExplorerPanel"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Also need to fix the closing brace of PracticeNode now
# Find the end of MainApp
# It currently has: return ( \n <AppShell ... > {mainContent} </AppShell> \n ); \n }
# Actually, wait. We didn't change the `return (<AppShell ...>{mainContent}</AppShell>)` part of MainApp.
# Because the `mainContent` variable is just a JSX block! But wait, `mainContent` in the old code wasn't wrapped in <Routes>. My replacement wrapped it in <Routes>.
# So the end of practice block was closing `} else { mainContent = ( <div ...> ... </div> ); }`
# Now the end of practice block should just be: </div></div></div>} /> </Routes> );

pattern2 = r"              </EditorPanel>\s*</div>\s*</div>\s*</div>\s*\);\s*}\s*return \(\s*<AppShell"
replacement2 = """              </EditorPanel>
            </div>
          </div>
        </div>
      } />
    </Routes>
  );

  return (
    <AppShell"""

content = re.sub(pattern2, replacement2, content)

# 8. Append default export AppRouter
app_router = """
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
"""
content += app_router

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Update completed successfully!")
