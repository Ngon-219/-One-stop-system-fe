"use client";

import axios from "axios";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface LoadingContextValue {
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

type Listener = (activeCount: number) => void;

let activeRequestCount = 0;
const listeners = new Set<Listener>();
let interceptorsInitialized = false;

const notify = () => {
  for (const listener of listeners) {
    listener(activeRequestCount);
  }
};

const increment = () => {
  activeRequestCount += 1;
  notify();
};

const decrement = () => {
  activeRequestCount = Math.max(activeRequestCount - 1, 0);
  notify();
};

const ensureInterceptors = () => {
  if (interceptorsInitialized) {
    return;
  }
  interceptorsInitialized = true;

  axios.interceptors.request.use(
    (config) => {
      // Bỏ qua loading nếu request có flag skipLoadingInterceptor
      if ((config as any).skipLoadingInterceptor) {
        return config;
      }
      increment();
      return config;
    },
    (error) => {
      if (!(error.config as any)?.skipLoadingInterceptor) {
        decrement();
      }
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      // Bỏ qua loading nếu request có flag skipLoadingInterceptor
      if ((response.config as any).skipLoadingInterceptor) {
        return response;
      }
      decrement();
      return response;
    },
    (error) => {
      if (!(error.config as any)?.skipLoadingInterceptor) {
        decrement();
      }
      
      // Xử lý 401 Unauthorized - tự động logout và redirect về login
      if (error.response?.status === 401) {
        // Tránh xử lý 401 ở trang login để tránh loop
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          // Xóa cookies và redirect
          const cookiesToRemove = ["huce_access_token", "huce_email", "huce_expires_in", "huce_role", "huce_user_id"];
          cookiesToRemove.forEach(cookieName => {
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          });
          window.location.href = "/login";
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export const subscribeLoading = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

ensureInterceptors();

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(activeRequestCount > 0);

  useEffect(() => {
    const unsubscribe = subscribeLoading((count) => setIsLoading(count > 0));
    return unsubscribe;
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

