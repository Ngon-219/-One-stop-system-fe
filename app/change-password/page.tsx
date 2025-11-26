"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { changePasswordApi } from "../api/auth_service";
import { ChangePasswordRequest } from "../api/interface/request/change_password";
import NavBar from "../components/navbar";
import ManagerNavBar from "../components/manager-navbar";
import { useAuth } from "../context/AuthContext";

const ChangePasswordPage = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
            Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp", "error");
            return;
        }

        const req: ChangePasswordRequest = {
            oldPassword,
            newPassword,
        };

        try {
            setLoading(true);
            const res = await changePasswordApi(req);
            Swal.fire("Thành công", res.message, "success");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            const message =
                error?.response?.data ??
                error?.message ??
                "Đổi mật khẩu thất bại. Vui lòng thử lại.";
            Swal.fire("Lỗi", message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            {(user?.role === "admin" || user?.role === "manager") && <ManagerNavBar />}
            <div className="flex items-center justify-center w-full p-4">
                <div className="w-full max-w-md mt-6">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Đổi mật khẩu
                            </h1>
                            <p className="text-gray-500">
                                Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label
                                    htmlFor="old-password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Mật khẩu hiện tại
                                </label>
                                <input
                                    id="old-password"
                                    type="password"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
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
                                {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;


