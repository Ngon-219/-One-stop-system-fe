"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutResponse } from "../api/interface/response/logout";
import { logoutApi } from "../api/auth_service";
import Swal from "sweetalert2";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/home");
  };

  const handleLogout = async () => {
    let response: LogoutResponse = await logoutApi();
    if (response.status_code == 200) {
      Swal.fire({
        title: "Logout Successful",
        text: response.message,
        icon: "success"
      });
      logout();
    } else {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: response.message + "!",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Không có quyền truy cập
        </h1>
        
        <p className="text-gray-600 mb-6">
          Bạn không có quyền truy cập vào trang này. Chỉ có <strong>Admin</strong> hoặc <strong>Manager</strong> mới được phép truy cập.
        </p>

        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Vai trò hiện tại của bạn: <span className="font-semibold">{user.role}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Về trang chủ
          </button>
          
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

