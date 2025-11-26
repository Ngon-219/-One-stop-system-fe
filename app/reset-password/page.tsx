"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import { resetPasswordApi } from "../api/auth_service";
import { ResetPasswordRequest } from "../api/interface/request/reset_password";

const ResetPasswordPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !otpCode || !newPassword || !confirmPassword) {
            Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp", "error");
            return;
        }

        const req: ResetPasswordRequest = {
            email,
            otpCode,
            newPassword,
        };

        try {
            setLoading(true);
            const res = await resetPasswordApi(req);
            Swal.fire("Thành công", res.message, "success");
            router.push("/login");
        } catch (error: any) {
            const message =
                error?.response?.data ??
                error?.message ??
                "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
            Swal.fire("Lỗi", message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center w-full p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Đặt lại mật khẩu
                        </h1>
                        <p className="text-gray-500">
                            Nhập OTP đã được gửi và mật khẩu mới
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="otp"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Mã OTP
                            </label>
                            <input
                                id="otp"
                                type="text"
                                placeholder="Nhập mã OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="new-password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Mật khẩu mới
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="confirm-password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60"
                        >
                            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;


