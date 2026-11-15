import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseConfigError } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(!firebaseConfigError);
  const [authError, setAuthError] = useState(firebaseConfigError);

  useEffect(() => {
    if (firebaseConfigError) return undefined;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth state error:", error);
        setAuthError("Could not restore your session. Please sign in again.");
        setLoading(false);
      }
    );

    // Safety net: never leave the app stuck on the spinner.
    const timeout = setTimeout(() => setLoading(false), 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    loading,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
