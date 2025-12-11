"use client";

import { useEffect, useState } from "react";
import { profileApi, requestEnableMfaEmailApi, confirmEnableMfaApi, getMfaStatusApi } from "@/app/api/auth_service";
import { exportPrivateKeyApi } from "@/app/api/document_service";
import { ProfileResponse, ProfileMajor, ProfileDepartment } from "@/app/api/interface/response/profile";
import { Card, Descriptions, Spin, Tag, Result, Button, Input, message, Alert, Modal } from "antd";
import Swal from "sweetalert2";
import NavBar from "@/app/components/navbar";
import ManagerNavBar from "../components/manager-navbar";
import StudentNavBar from "../components/student-navbar";
import QRCode from "qrcode";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [mfaOtp, setMfaOtp] = useState("");
    const [sendingMfa, setSendingMfa] = useState(false);
    const [verifyingMfa, setVerifyingMfa] = useState(false);
    const [mfaQr, setMfaQr] = useState<string | null>(null);
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    const [checkingMfa, setCheckingMfa] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const {user} = useAuth();
    const router = useRouter();
    const [exportKeyMfaCode, setExportKeyMfaCode] = useState<string>("");
    const [exportingKey, setExportingKey] = useState<boolean>(false);
    const [isExportKeyModalVisible, setIsExportKeyModalVisible] = useState<boolean>(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await profileApi();
                setProfile(response);
            } catch (err: any) {
                console.error("Failed to load profile:", err);
                setError(err.response?.data?.message || "Không thể tải thông tin hồ sơ!");
            } finally {
                setLoading(false);
            }
        };

        const checkMfaStatus = async () => {
            setCheckingMfa(true);
            try {
                const mfaStatus = await getMfaStatusApi();
                setMfaEnabled(mfaStatus.isEnabled);
            } catch (err: any) {
                console.error("Failed to check MFA status:", err);
                // Nếu lỗi, mặc định là chưa enable để hiển thị UI enable
                setMfaEnabled(false);
            } finally {
                setCheckingMfa(false);
            }
        };

        fetchProfile();
        checkMfaStatus();
    }, []);

    const getBlockchainRoleName = (role: number | string | null | undefined): string => {
        if (role === null || role === undefined) return "N/A";
        
        const roleMap: Record<number, string> = {
            0: "NONE",
            1: "STUDENT",
            2: "TEACHER",
            3: "ADMIN",
            4: "MANAGER",
        };
        
        const roleNum = typeof role === "string" ? parseInt(role, 10) : role;
        if (isNaN(roleNum)) return String(role);
        
        return roleMap[roleNum] || `UNKNOWN (${roleNum})`;
    };

    const getBlockchainRoleColor = (role: number | string | null | undefined): string => {
        if (role === null || role === undefined) return "default";
        
        const roleNum = typeof role === "string" ? parseInt(role, 10) : role;
        if (isNaN(roleNum)) return "default";
        
        const colorMap: Record<number, string> = {
            0: "default", 
            1: "blue",  
            2: "cyan",  
            3: "red",   
            4: "orange",
        };
        
        return colorMap[roleNum] || "default";
    };

    const renderStatusTag = (label: string, value: boolean | string | number) => {
        if (typeof value === "boolean") {
            return <Tag color={value ? "green" : "red"}>{label}: {value ? "Có" : "Không"}</Tag>;
        }
        if (typeof value === "number") {
            return <Tag color="blue">{label}: {value}</Tag>;
        }
        return <Tag color="blue">{label}: {value}</Tag>;
    };

    const renderMajors = (majors: ProfileMajor[]) => (
        <div className="space-y-3">
            {majors.map((item) => (
                <div key={item.major_id} className="p-4 border rounded-2xl bg-white shadow-sm">
                    <strong className="text-base">{item.name}</strong>
                    <div className="text-sm text-gray-600 mt-1">
                        <p>Mã chuyên ngành: {item.major_id}</p>
                        <p>Mã khoa: {item.department_id}</p>
                        <p>Ngày thành lập: {new Date(item.founding_date).toLocaleDateString("vi-VN")}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDepartments = (departments: ProfileDepartment[]) => (
        <div className="space-y-3">
            {departments.map((item) => (
                <div key={item.department_id} className="p-4 border rounded-2xl bg-white shadow-sm">
                    <strong className="text-base">{item.name}</strong>
                    <div className="text-sm text-gray-600 mt-1">
                        <p>Trưởng khoa: {item.dean}</p>
                        <p>Mã khoa: {item.department_id}</p>
                        <p>Ngày thành lập: {new Date(item.founding_date).toLocaleDateString("vi-VN")}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    const handleSendMfaEmail = async () => {
        setSendingMfa(true);
        try {
            const res = await requestEnableMfaEmailApi();
            messageApi.success(res?.message || "Đã gửi email OTP. Vui lòng kiểm tra hộp thư.");
        } catch (err: any) {
            messageApi.error(err.response?.data?.message || "Không thể gửi OTP.");
        } finally {
            setSendingMfa(false);
        }
    };

    const buildQrCodeDataUrl = async (raw?: string | null): Promise<string | null> => {
        if (!raw) {
            return null;
        }
        if (raw.startsWith("data:image")) {
            return raw;
        }
        if (raw.startsWith("otpauth://")) {
            try {
                return await QRCode.toDataURL(raw, { errorCorrectionLevel: "M" });
            } catch (err) {
                console.error("Failed to convert OTP URI to QR:", err);
                messageApi.warning("Không thể tạo QR code từ OTP URI.");
                return null;
            }
        }
        const normalized = raw.replace(/^data:image\/png;base64,/, "");
        return `data:image/png;base64,${normalized}`;
    };

    const handleVerifyMfa = async () => {
        if (!mfaOtp.trim()) {
            messageApi.warning("Vui lòng nhập mã OTP.");
            return;
        }
        setVerifyingMfa(true);
        try {
            const res = await confirmEnableMfaApi(mfaOtp.trim());
            const qrPayload = await buildQrCodeDataUrl(res?.qrCode);
            setMfaQr(qrPayload);
            messageApi.success(res?.message || "Kích hoạt MFA thành công.");
        } catch (err: any) {
            messageApi.error(err.response?.data?.message || "Không thể xác minh OTP.");
        } finally {
            setVerifyingMfa(false);
        }
    };

    const handleExportPrivateKey = async () => {
        if (!exportKeyMfaCode.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Vui lòng nhập mã xác thực MFA!",
            });
            return;
        }

        if (!mfaEnabled) {
            Swal.fire({
                icon: "warning",
                title: "MFA chưa được kích hoạt",
                text: "Bạn cần kích hoạt MFA để xuất khóa riêng tư.",
            });
            return;
        }

        setExportingKey(true);
        try {
            const response = await exportPrivateKeyApi(exportKeyMfaCode.trim());
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: response.message || "Khóa riêng tư đã được gửi đến email của bạn!",
            });
            setIsExportKeyModalVisible(false);
            setExportKeyMfaCode("");
        } catch (error: any) {
            console.error("Failed to export private key:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể xuất khóa riêng tư!",
            });
        } finally {
            setExportingKey(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="min-h-screen bg-gray-50 space-y-2.5">
                <NavBar />
                {user?.role === "admin" || user?.role === "manager" ? <ManagerNavBar /> : null}
                {user?.role === "student" && <StudentNavBar />}
                <div className="w-[90vw] mx-auto py-8 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Result status="error" title="Không thể tải hồ sơ" subTitle={error} />
                ) : profile ? (
                    <div className="space-y-8 mb-2">
                        <Card title="Thông tin cá nhân" className="rounded-3xl shadow-sm">
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label="Họ tên">
                                    {profile.user.last_name} {profile.user.first_name}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    {profile.user.email}
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">
                                    {profile.user.phone_number}
                                </Descriptions.Item>
                                <Descriptions.Item label="CCCD">
                                    {profile.user.cccd}
                                </Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ">
                                    {profile.user.address}
                                </Descriptions.Item>
                                <Descriptions.Item label="Vai trò">
                                    {profile.user.role}
                                </Descriptions.Item>
                                <Descriptions.Item label="Mã sinh viên">
                                    {profile.user.student_code || "N/A"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                    {new Date(profile.user.created_at).toLocaleString("vi-VN")}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày cập nhật">
                                    {new Date(profile.user.updated_at).toLocaleString("vi-VN")}
                                </Descriptions.Item>
                            </Descriptions>
                            <div className="mt-4 mb-4 flex flex-wrap gap-2">
                                {renderStatusTag("Ưu tiên", profile.user.is_priority)}
                                {renderStatusTag("Lần đăng nhập đầu tiên", profile.user.is_first_login)}
                                {renderStatusTag("Tình trạng", profile.user.status)}
                                {renderStatusTag("Hoạt động", profile.is_active)}
                                <Tag color={getBlockchainRoleColor(profile.blockchain_role)}>
                                    Blockchain role: {getBlockchainRoleName(profile.blockchain_role)}
                                </Tag>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="primary" onClick={() => router.push("/change-password")}>
                                    Đổi mật khẩu
                                </Button>
                            </div>
                        </Card>

                        <br />

                        <Card title="Ví blockchain" className="rounded-3xl shadow-sm mb-2.5">
                            {profile.wallet ? (
                                <>
                                    <Descriptions bordered column={2}>
                                        <Descriptions.Item label="Địa chỉ">
                                            {profile.wallet.address}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Chuỗi">
                                            {profile.wallet.chain_type}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Trạng thái">
                                            {profile.wallet.status}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Network ID">
                                            {profile.wallet.network_id}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Public key">
                                            {profile.wallet.public_key}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Lần dùng cuối">
                                            {profile.wallet.last_used_at
                                                ? new Date(profile.wallet.last_used_at).toLocaleString("vi-VN")
                                                : "Chưa có"}
                                        </Descriptions.Item>
                                    </Descriptions>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="primary"
                                            danger
                                            onClick={() => setIsExportKeyModalVisible(true)}
                                            disabled={!mfaEnabled}
                                        >
                                            Xuất khóa riêng tư
                                        </Button>
                                    </div>
                                    {!mfaEnabled && (
                                        <Alert
                                            title="Cần kích hoạt MFA"
                                            description="Bạn cần kích hoạt MFA để có thể xuất khóa riêng tư."
                                            type="warning"
                                            showIcon
                                            className="mt-4"
                                        />
                                    )}
                                </>
                            ) : (
                                <Result status="info" title="Chưa có ví blockchain" />
                            )}
                        </Card>

                        <br />

                        <Card title="Bật xác thực đa yếu tố (MFA)" className="rounded-3xl shadow-sm">
                            {checkingMfa ? (
                                <div className="flex justify-center py-8">
                                    <Spin size="large" />
                                </div>
                            ) : mfaEnabled === true ? (
                                <Alert
                                    title="MFA đã được kích hoạt"
                                    description="Xác thực đa yếu tố (MFA) đã được bật cho tài khoản của bạn. Bạn có thể sử dụng ứng dụng Authenticator để xác thực khi đăng nhập hoặc thực hiện các tác vụ quan trọng."
                                    type="success"
                                    showIcon
                                    className="mb-4"
                                />
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Nhấn &quot;Gửi OTP&quot; để nhận mã qua email, sau đó nhập OTP để kích hoạt MFA.
                                    </p>
                                    <div className="flex gap-3 flex-wrap">
                                        <Button onClick={handleSendMfaEmail} loading={sendingMfa}>
                                            Gửi OTP
                                        </Button>
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <Input
                                                placeholder="Nhập mã OTP"
                                                value={mfaOtp}
                                                onChange={(e) => setMfaOtp(e.target.value)}
                                                maxLength={10}
                                                style={{ width: 200 }}
                                            />
                                            <Button type="primary" onClick={handleVerifyMfa} loading={verifyingMfa}>
                                                Xác nhận
                                            </Button>
                                        </div>
                                    </div>
                                    {mfaQr && (
                                        <div className="mt-4 text-center">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Quét QR sau bằng ứng dụng Authenticator để hoàn tất.
                                            </p>
                                            <img
                                                src={mfaQr.startsWith("data:image") ? mfaQr : `data:image/png;base64,${mfaQr}`}
                                                alt="MFA QR Code"
                                                className="mx-auto border rounded-xl p-2 bg-white shadow"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>

                        <br />

                        <Card title="Chuyên ngành" className="rounded-3xl shadow-sm">
                            {profile.majors.length > 0 ? (
                                renderMajors(profile.majors)
                            ) : (
                                <Result status="info" title="Chưa có thông tin chuyên ngành" />
                            )}
                        </Card>

                        <br />

                        <Card title="Khoa/Phòng ban" className="rounded-3xl shadow-sm">
                            {profile.departments.length > 0 ? (
                                renderDepartments(profile.departments)
                            ) : (
                                <Result status="info" title="Chưa có thông tin khoa/phòng ban" />
                            )}
                        </Card>
                    </div>
                ) : (
                    <Result status="404" title="Không có dữ liệu hồ sơ" />
                )}
                </div>
            </div>

            {/* Export Private Key Modal */}
            <Modal
                title="Xuất khóa riêng tư"
                open={isExportKeyModalVisible}
                onCancel={() => {
                    setIsExportKeyModalVisible(false);
                    setExportKeyMfaCode("");
                }}
                footer={null}
                width={500}
            >
                <Alert
                    title="Cảnh báo bảo mật"
                    description="Khóa riêng tư cho phép truy cập hoàn toàn vào ví của bạn. Không bao giờ chia sẻ với bất kỳ ai. Khóa riêng tư sẽ được gửi đến email của bạn."
                    type="warning"
                    showIcon
                    className="mb-4"
                />
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã xác thực MFA (6 chữ số)
                        </label>
                        <Input
                            type="text"
                            maxLength={6}
                            placeholder="Nhập mã MFA"
                            value={exportKeyMfaCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                setExportKeyMfaCode(value);
                            }}
                            size="large"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => {
                                setIsExportKeyModalVisible(false);
                                setExportKeyMfaCode("");
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={handleExportPrivateKey}
                            loading={exportingKey}
                        >
                            Xuất khóa riêng tư
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}