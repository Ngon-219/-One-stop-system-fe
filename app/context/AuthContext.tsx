"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoginResponse } from "../api/interface/response/login";

interface User {
  access_token: string;
  email: string;
  expires_in: string;
  role: string;
  user_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (response: LoginResponse, rememberMe?: boolean) => void;
  logout: () => void;
  checkUserLoggedIn: () => void; // Export để có thể gọi lại khi cần
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = document.cookie
      ?.split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
  };

  const setCookie = (name: string, value: string | null, rememberMe: boolean) => {
    if (typeof document === "undefined" || !value) return;
    const baseOptions = `path=/; SameSite=Lax`;
    const cookieOptions = rememberMe
      ? `${baseOptions}; max-age=${60 * 60 * 24 * 7}`
      : baseOptions;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions}`;
  };

  const removeCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const access_token = getCookie("huce_access_token");
      
      if (access_token) {
        const email = getCookie("huce_email") || "";
        const expires_in = getCookie("huce_expires_in") || "";
        const role = getCookie("huce_role") || "";
        const user_id = getCookie("huce_user_id") || "";
        
        setUser({
          access_token: access_token,
          email: email,
          expires_in: expires_in,
          role: role,
          user_id: user_id,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking user logged in", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (response: LoginResponse, rememberMe: boolean = false) => {
    if (response.status_code === 200 && response.access_token) {
      const userData: User = {
        access_token: response.access_token,
        email: response.email || "",
        expires_in: response.expires_in || "",
        role: response.role || "",
        user_id: response.user_id || "",
      };

      setCookie("huce_access_token", response.access_token, rememberMe);
      setCookie("huce_role", response.role || "", rememberMe);
      setCookie("huce_email", response.email || "", rememberMe);
      setCookie("huce_expires_in", response.expires_in || "", rememberMe);
      setCookie("huce_user_id", response.user_id || "", rememberMe);

      setUser(userData);
    }
  };

  const logout = () => {
    removeCookie("huce_access_token");
    removeCookie("huce_email");
    removeCookie("huce_expires_in");
    removeCookie("huce_role");
    removeCookie("huce_user_id");

    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user, 
        login, 
        logout,
        checkUserLoggedIn // Export để có thể gọi lại khi cần
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};