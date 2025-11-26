"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { forgotPasswordApi } from "../api/auth_service";
import { ForgotPasswordRequest } from "../api/interface/request/forgot_password";
import { useRouter } from "next/navigation";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) {
            Swal.fire("Lỗi", "Vui lòng nhập email", "error");
            return;
        }

        const req: ForgotPasswordRequest = { email };

        try {
            setLoading(true);
            const res = await forgotPasswordApi(req);
            Swal.fire("Thành công", res.message, "success");
            router.push("/reset-password?email=" + encodeURIComponent(email));
        } catch (error: any) {
            const message =
                error?.response?.data ??
                error?.message ??
                "Gửi OTP thất bại. Vui lòng thử lại.";
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
                            Quên mật khẩu
                        </h1>
                        <p className="text-gray-500">
                            Nhập email để nhận mã OTP đặt lại mật khẩu
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60"
                        >
                            {loading ? "Đang gửi OTP..." : "Gửi mã OTP"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;


