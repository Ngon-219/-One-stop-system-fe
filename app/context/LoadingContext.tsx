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
      increment();
      return config;
    },
    (error) => {
      decrement();
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      decrement();
      return response;
    },
    (error) => {
      decrement();
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

