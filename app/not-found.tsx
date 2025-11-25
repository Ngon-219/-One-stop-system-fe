"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Swal from "sweetalert2";
import { LogoutResponse } from "./api/interface/response/logout";
import { logoutApi } from "./api/auth_service";

export default function NotFound() {
  let {logout} = useAuth();

  useEffect(() => {
    document.body.classList.add("hide-header");
    return () => {
      document.body.classList.remove("hide-header");
    };
  }, []);

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
    <div className="min-h-screen bg-linear-to-b from-[#fff] via-white to-white flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-3xl border border-gray-100 p-10 text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border-8 border-[#e5f1ff] flex items-center justify-center bg-[#f5fbff]">
            <span className="text-4xl font-bold text-[#0f6ab4]">404</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.5em] text-gray-400">
            Không tìm thấy trang
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0f3f78]">
            Trang bạn tìm kiếm hiện không tồn tại
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Có thể đường dẫn đã sai, nội dung đã được chuyển sang vị trí mới
            hoặc bạn chưa đăng nhập. Vui lòng quay lại trang chủ hoặc liên hệ quản trị viên.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/home"
            className="px-6 py-3 rounded-xl bg-[#0f6ab4] text-white font-semibold hover:bg-[#0e5a96] transition-colors"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Đăng nhập lại
          </button>
        </div>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-400">
          Nếu bạn nghĩ đây là lỗi của hệ thống, vui lòng liên hệ bộ phận hỗ trợ qua số
          <span className="font-semibold text-[#0f6ab4]"> (024) 3869 2008</span>.
        </div>
      </div>
    </div>
  );
}

