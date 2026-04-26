// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("fb_user_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch the latest ID token and store it
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem("fb_user_token", idToken);
        localStorage.setItem("fb_user_phone", firebaseUser.phoneNumber);
        setToken(idToken);
        setUser(firebaseUser);
      } else {
        localStorage.removeItem("fb_user_token");
        localStorage.removeItem("fb_user_phone");
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  // Refresh token on demand
  const refreshToken = async () => {
    if (auth.currentUser) {
      const newToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem("fb_user_token", newToken);
      setToken(newToken);
      return newToken;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
