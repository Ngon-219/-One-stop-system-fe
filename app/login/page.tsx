"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { loginNotMfaApi } from "../api/auth_service";
import { LoginRequest } from "../api/interface/request/login";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState<string>("");
  const [mfaDigits, setMfaDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaHidden,setMfaHidden] = useState(false);
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { login } = useAuth();
  const router = useRouter();

  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (user?.role == "student") {
        router.push("/home");
      } else {
        router.push("/manager/dashboard");
      }
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    if (mfaHidden) {
      setTimeout(() => {
        mfaInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setMfaDigits(["", "", "", "", "", ""]);
      setAuthenticatorCode("");
    }
  }, [mfaHidden]);

  const handleMfaDigitChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newDigits = [...mfaDigits];
    newDigits[index] = value;
    setMfaDigits(newDigits);
    
    const code = newDigits.join("");
    setAuthenticatorCode(code);

    if (value && index < 5) {
      mfaInputRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Xử lý backspace để quay lại ô trước
    if (e.key === "Backspace" && !mfaDigits[index] && index > 0) {
      mfaInputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newDigits = [...mfaDigits];
        digits.forEach((digit, i) => {
          if (index + i < 6) {
            newDigits[index + i] = digit;
          }
        });
        setMfaDigits(newDigits);
        setAuthenticatorCode(newDigits.join(""));
        
        const lastIndex = Math.min(index + digits.length - 1, 5);
        mfaInputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let req: LoginRequest = {
      email: username,
      password: password,
    };
    
    if (authenticatorCode && authenticatorCode.trim() !== "") {
      req.authenticatorCode = authenticatorCode;
    }

    let response = await loginNotMfaApi(req);
    
    if (response.status_code == 400) {
      setMfaHidden(true);
      Swal.fire({
        title: "You already enable MFA",
        text: response.message,
        icon: "question"
      });
      return;
    }

    if (response.status_code == 401) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: response.message + "!",
      });
      return;
    }

    if (response.status_code == 200) {
      login(response, rememberMe);

      Swal.fire({
        title: "Login Successful",
        text: "Login successful",
        icon: "success"
      });

      switch (response.role) {
        case "admin": {
          router.push("/manager/dashboard");
          break;
        }

        case "student": {
          router.push("/home");
          break;
        }

        default: {
          router.push("/");
          break;
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center w-full p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Please login to your account</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input 
                id="username"
                type="text" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input 
                id="password"
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
              />
            </div>
            
            <div className={`space-y-2 ${!mfaHidden ? "hidden" : ""}`}>
              <label 
                htmlFor="authenticatorCode" 
                className="block text-sm font-medium text-gray-700"
              >
                Authenticator Code
              </label>
              <div className="flex gap-2 justify-center">
                {mfaDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      mfaInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleMfaDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleMfaKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <a 
                href="#" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Forgot password?
              </a>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;