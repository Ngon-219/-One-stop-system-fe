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

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const access_token = localStorage.getItem("huce_access_token");
      
      if (access_token) {
        const email = localStorage.getItem("huce_email") || "";
        const expires_in = localStorage.getItem("huce_expires_in") || "";
        const role = localStorage.getItem("huce_role") || "";
        const user_id = localStorage.getItem("huce_user_id") || "";
        
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

      if (typeof window !== "undefined") {
        // Luôn lưu token vào cookie để middleware có thể check
        // Cookie sẽ tự động expire khi đóng browser nếu không set max-age
        const cookieOptions = rememberMe 
          ? `max-age=${60 * 60 * 24 * 7}; path=/; SameSite=Lax` // 7 ngày nếu remember me
          : `path=/; SameSite=Lax`; // Session cookie nếu không remember
        
        document.cookie = `huce_access_token=${response.access_token}; ${cookieOptions}`;
        document.cookie = `huce_role=${response.role}; ${cookieOptions}`;
        
        if (rememberMe) {
          localStorage.setItem("huce_access_token", response.access_token);
          if (response.email) {
            localStorage.setItem("huce_email", response.email);
          }
          if (response.expires_in) {
            localStorage.setItem("huce_expires_in", response.expires_in);
          }
          if (response.role) {
            localStorage.setItem("huce_role", response.role);
          }
          if (response.user_id) {
            localStorage.setItem("huce_user_id", response.user_id);
          }
        }
      }

      setUser(userData);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("huce_access_token");
      localStorage.removeItem("huce_email");
      localStorage.removeItem("huce_expires_in");
      localStorage.removeItem("huce_role");
      localStorage.removeItem("huce_user_id");
      
      // Xóa tất cả cookies
      document.cookie = "huce_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "huce_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    
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