"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Table, Tag, Button, Modal, Input, Form, message, Space, Card, Spin } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import NavBar from "@/app/components/navbar";
import StudentNavBar from "@/app/components/student-navbar";
import { getMyRequestsApi, createRequestApi, getMfaStatusApi } from "@/app/api/auth_service";
import { RequestResponse, RequestStatus } from "@/app/api/interface/response/request";
import { CreateRequestRequest } from "@/app/api/interface/request/create_request";
import dayjs from "dayjs";

const { TextArea } = Input;

const statusLabelMap: Record<RequestStatus, string> = {
    Pending: "Chờ xử lý",
    Scheduled: "Đã lên lịch",
};

const statusColorMap: Record<RequestStatus, string> = {
    Pending: "gold",
    Scheduled: "blue",
};

export default function MyRequestsPage() {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<RequestResponse[]>([]);
    const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);
    const [createForm] = Form.useForm();
    const [mfaCode, setMfaCode] = useState<string>("");
    const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
            return;
        }

        if (isAuthenticated) {
            checkMfaStatus();
            fetchRequests();
        }
    }, [loading, isAuthenticated, router]);

    const checkMfaStatus = async () => {
        try {
            const mfaStatus = await getMfaStatusApi();
            setMfaEnabled(mfaStatus.isEnabled);
        } catch (error) {
            console.error("Failed to check MFA status:", error);
        }
    };

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const response = await getMyRequestsApi();
            setRequests(response.requests);
        } catch (error: any) {
            console.error("Failed to fetch requests:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tải danh sách yêu cầu!",
            });
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleCreateRequest = async (values: any) => {
        if (!mfaEnabled) {
            Swal.fire({
                icon: "warning",
                title: "MFA chưa được kích hoạt",
                text: "Bạn cần kích hoạt MFA để tạo yêu cầu. Sẽ chuyển đến trang cài đặt MFA.",
                confirmButtonText: "Đi đến cài đặt",
            }).then(() => {
                router.push("/profile");
            });
            return;
        }

        const payload: CreateRequestRequest = {
            content: values.content,
            authenticator_code: mfaCode.trim() || undefined,
        };

        try {
            await createRequestApi(payload);
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Yêu cầu đã được tạo thành công!",
            });
            setIsCreateModalVisible(false);
            createForm.resetFields();
            setMfaCode("");
            fetchRequests();
        } catch (error: any) {
            console.error("Failed to create request:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tạo yêu cầu!",
            });
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "request_id",
            key: "request_id",
            width: 100,
            render: (text: string) => <span className="font-mono text-xs">{text.substring(0, 8)}...</span>,
        },
        {
            title: "Nội dung",
            dataIndex: "content",
            key: "content",
            ellipsis: true,
            render: (text: string) => (
                <span className="max-w-xs truncate block" title={text}>
                    {text}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: RequestStatus) => (
                <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
            ),
        },
        {
            title: "Ngày lên lịch",
            dataIndex: "scheduled_at",
            key: "scheduled_at",
            width: 180,
            render: (text: string | null) =>
                text ? dayjs(text).format("DD/MM/YYYY HH:mm") : "-",
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 180,
            render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Hành động",
            key: "action",
            width: 100,
            render: (_: any, record: RequestResponse) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        Modal.info({
                            title: "Chi tiết yêu cầu",
                            width: 600,
                            content: (
                                <div className="mt-4 space-y-2">
                                    <p><strong>ID:</strong> {record.request_id}</p>
                                    <p><strong>Nội dung:</strong> {record.content}</p>
                                    <p><strong>Trạng thái:</strong> <Tag color={statusColorMap[record.status]}>{statusLabelMap[record.status]}</Tag></p>
                                    {record.scheduled_at && (
                                        <p><strong>Ngày lên lịch:</strong> {dayjs(record.scheduled_at).format("DD/MM/YYYY HH:mm")}</p>
                                    )}
                                    <p><strong>Ngày tạo:</strong> {dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}</p>
                                    <p><strong>Ngày cập nhật:</strong> {dayjs(record.updated_at).format("DD/MM/YYYY HH:mm")}</p>
                                </div>
                            ),
                        });
                    }}
                >
                    Xem
                </Button>
            ),
        },
    ];

    if (loading || (!loading && !isAuthenticated)) {
        return (
            <div className="flex items-center justify-center w-full py-20">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <StudentNavBar />
            <div className="w-[90vw] mx-auto py-8">
                <Card>
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Yêu cầu của tôi</h1>
                            <p className="text-gray-600">Xem và quản lý các yêu cầu của bạn</p>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateModalVisible(true)}
                        >
                            Tạo yêu cầu mới
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={requests}
                        rowKey="request_id"
                        loading={loadingRequests}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Tổng ${total} yêu cầu`,
                        }}
                    />
                </Card>
            </div>

            {/* Create Request Modal */}
            <Modal
                title="Tạo yêu cầu mới"
                open={isCreateModalVisible}
                onCancel={() => {
                    setIsCreateModalVisible(false);
                    createForm.resetFields();
                    setMfaCode("");
                }}
                footer={null}
                width={600}
                destroyOnHidden
            >
                <Form form={createForm} onFinish={handleCreateRequest} layout="vertical">
                    <Form.Item
                        name="content"
                        label="Nội dung yêu cầu"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung yêu cầu!" }]}
                    >
                        <TextArea rows={6} placeholder="Nhập nội dung yêu cầu..." />
                    </Form.Item>
                    {mfaEnabled && (
                        <Form.Item
                            label="Mã xác thực MFA (6 chữ số)"
                            rules={[{ required: true, message: "Vui lòng nhập mã MFA!" }]}
                        >
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="Nhập mã MFA"
                                value={mfaCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");
                                    setMfaCode(value);
                                }}
                            />
                        </Form.Item>
                    )}
                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setIsCreateModalVisible(false);
                                createForm.resetFields();
                                setMfaCode("");
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Tạo yêu cầu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

