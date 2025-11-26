"use client"

import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { useEffect, useState } from "react";
import { getDocumentStatsApi, getUserStatsApi } from "@/app/api/auth_service";
import { DocumentStatsResponse, UserStatsResponse } from "@/app/api/interface/response/stats";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return formatDate(d);
    });
    const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()));

    const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
    const [documentStats, setDocumentStats] = useState<DocumentStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const [userRes, docRes] = await Promise.all([
                getUserStatsApi(startDate, endDate),
                getDocumentStatsApi(startDate, endDate),
            ]);
            setUserStats(userRes);
            setDocumentStats(docRes);
        } catch (err) {
            console.error(err);
            setError("Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilter = () => {
        loadStats();
    };

    return (
        <div className="w-full h-full">
            <NavBar />
            <ManagerNavBar />
            <div className="w-[90vw] mx-auto py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">Từ</span>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">Đến</span>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleFilter}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                            disabled={loading}
                        >
                            {loading ? "Đang tải..." : "Lọc"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Tổng user</p>
                        <p className="text-2xl font-semibold">
                            {userStats?.total_users ?? "-"}
                        </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Student</p>
                        <p className="text-2xl font-semibold">
                            {userStats?.total_students ?? "-"}
                        </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Manager</p>
                        <p className="text-2xl font-semibold">
                            {userStats?.total_managers ?? "-"}
                        </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Teacher/Admin</p>
                        <p className="text-2xl font-semibold">
                            {((userStats?.total_teachers ?? 0) + (userStats?.total_admins ?? 0)) || "-"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Tài liệu đã tạo</p>
                        <p className="text-2xl font-semibold">
                            {documentStats?.total_documents ?? "-"}
                        </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Tài liệu đã ký (signed)</p>
                        <p className="text-2xl font-semibold">
                            {documentStats?.signed_documents ?? "-"}
                        </p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-4">
                        <p className="text-sm text-gray-500">Tài liệu lỗi (failed)</p>
                        <p className="text-2xl font-semibold text-red-600">
                            {documentStats?.failed_documents ?? "-"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">User tạo mới theo ngày</h2>
                        <div className="h-64">
                            {userStats?.users_per_day.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userStats.users_per_day}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Không có dữ liệu trong khoảng ngày.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">Tài liệu tạo theo ngày</h2>
                        <div className="h-64">
                            {documentStats?.documents_per_day.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={documentStats.documents_per_day}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#16a34a"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Không có dữ liệu trong khoảng ngày.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">Phân bổ vai trò user</h2>
                        <div className="h-64 flex items-center justify-center">
                            {userStats ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Student", value: userStats.total_students },
                                                { name: "Manager", value: userStats.total_managers },
                                                { name: "Teacher", value: userStats.total_teachers },
                                                { name: "Admin", value: userStats.total_admins },
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {["#2563eb", "#16a34a", "#f97316", "#dc2626"].map(
                                                (color, index) => (
                                                    <Cell key={index} fill={color} />
                                                )
                                            )}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Không có dữ liệu user.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">Trạng thái tài liệu</h2>
                        <div className="h-64 flex items-center justify-center">
                            {documentStats ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    name: "Signed",
                                                    value: documentStats.signed_documents,
                                                },
                                                {
                                                    name: "Failed",
                                                    value: documentStats.failed_documents,
                                                },
                                                {
                                                    name: "Khác",
                                                    value:
                                                        documentStats.total_documents -
                                                        documentStats.signed_documents -
                                                        documentStats.failed_documents,
                                                },
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {["#16a34a", "#dc2626", "#6b7280"].map(
                                                (color, index) => (
                                                    <Cell key={index} fill={color} />
                                                )
                                            )}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Không có dữ liệu tài liệu.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}