"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Table, Tag, Button, Modal, Input, Form, Select, DatePicker, message, Space, Card, Spin, Alert } from "antd";
import { EyeOutlined, CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { getAllRequestsApi, scheduleRequestApi, getMfaStatusApi } from "@/app/api/auth_service";
import { RequestResponse, RequestStatus } from "@/app/api/interface/response/request";
import { ScheduleRequestRequest } from "@/app/api/interface/request/schedule_request";
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

const statusOptions = [
    { label: statusLabelMap.Pending, value: "Pending" },
    { label: statusLabelMap.Scheduled, value: "Scheduled" },
];

export default function RequestsPage() {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<RequestResponse[]>([]);
    const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isScheduleModalVisible, setIsScheduleModalVisible] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestResponse | null>(null);
    const [scheduleForm] = Form.useForm();
    const [mfaCode, setMfaCode] = useState<string>("");
    const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
    const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
            return;
        }

        if (!loading && user && user.role !== "admin" && user.role !== "manager") {
            Swal.fire({
                icon: "warning",
                title: "Không có quyền truy cập",
                text: "Trang này chỉ dành cho quản trị viên và quản lý.",
            });
            router.replace("/manager/dashboard");
            return;
        }

        if (isAuthenticated && (user?.role === "admin" || user?.role === "manager")) {
            checkMfaStatus();
            fetchRequests();
        }
    }, [loading, isAuthenticated, user, router, page, pageSize, statusFilter]);

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
            const response = await getAllRequestsApi(
                page,
                pageSize,
                statusFilter === "all" ? undefined : statusFilter
            );
            setRequests(response.requests);
            setTotal(response.total);
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

    const handleScheduleRequest = async (values: any) => {
        if (!selectedRequest) return;

        if (!mfaEnabled) {
            Swal.fire({
                icon: "warning",
                title: "MFA chưa được kích hoạt",
                text: "Bạn cần kích hoạt MFA để lên lịch yêu cầu. Sẽ chuyển đến trang cài đặt MFA.",
                confirmButtonText: "Đi đến cài đặt",
            }).then(() => {
                router.push("/profile");
            });
            return;
        }

        const payload: ScheduleRequestRequest = {
            scheduled_at: dayjs(values.scheduled_at).format("YYYY-MM-DDTHH:mm:ss"),
            message: values.message || undefined,
            authenticator_code: mfaCode.trim() || undefined,
        };

        setScheduleLoading(true);
        try {
            await scheduleRequestApi(selectedRequest.request_id, payload);
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Yêu cầu đã được lên lịch và email đã được gửi cho sinh viên!",
            });
            setIsScheduleModalVisible(false);
            scheduleForm.resetFields();
            setMfaCode("");
            setSelectedRequest(null);
            fetchRequests();
        } catch (error: any) {
            console.error("Failed to schedule request:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể lên lịch yêu cầu!",
            });
        } finally {
            setScheduleLoading(false);
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
            title: "User ID",
            dataIndex: "user_id",
            key: "user_id",
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
            width: 150,
            render: (_: any, record: RequestResponse) => (
                <Space className="flex flex-col">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedRequest(record);
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
                    {record.status === "Pending" && (
                        <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={() => {
                                setSelectedRequest(record);
                                setIsScheduleModalVisible(true);
                            }}
                        >
                        </Button>
                    )}
                    {record.status === "Scheduled" && (
                        <Tag color="blue">Đã lên lịch</Tag>
                    )}
                </Space>
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
            <ManagerNavBar />
            <div className="w-[90vw] mx-auto py-8">
                <Card>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý yêu cầu</h1>
                        <p className="text-gray-600">Xem và xử lý các yêu cầu từ sinh viên. Lên lịch để gửi email thông báo cho sinh viên.</p>
                    </div>

                    <div className="mb-4 flex gap-4">
                        <Select
                            value={statusFilter}
                            options={statusOptions}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                            style={{ width: 200 }}
                            placeholder="Lọc theo trạng thái"
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={requests}
                        rowKey="request_id"
                        loading={loadingRequests}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} yêu cầu`,
                            onChange: (page, pageSize) => {
                                setPage(page);
                                setPageSize(pageSize);
                            },
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </div>

            {/* Schedule Request Modal */}
            <Modal
                title="Lên lịch xử lý yêu cầu"
                open={isScheduleModalVisible}
                onCancel={() => {
                    setIsScheduleModalVisible(false);
                    scheduleForm.resetFields();
                    setMfaCode("");
                    setSelectedRequest(null);
                }}
                footer={null}
                width={600}
                destroyOnHidden
            >
                {selectedRequest && (
                    <Form form={scheduleForm} onFinish={handleScheduleRequest} layout="vertical">
                        <Alert
                            title="Thông tin yêu cầu"
                            description={
                                <div className="mt-2">
                                    <p><strong>ID yêu cầu:</strong> {selectedRequest.request_id}</p>
                                    <p><strong>User ID:</strong> {selectedRequest.user_id}</p>
                                    <p><strong>Nội dung:</strong> {selectedRequest.content}</p>
                                </div>
                            }
                            type="info"
                            showIcon
                            className="mb-4"
                        />
                        <Form.Item
                            name="scheduled_at"
                            label="Thời gian lên lịch xử lý"
                            rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
                            help="Thời gian này sẽ được gửi trong email thông báo cho sinh viên"
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                                disabledDate={(current) => current && current < dayjs().startOf("day")}
                            />
                        </Form.Item>
                        <Form.Item 
                            name="message" 
                            label="Tin nhắn gửi cho sinh viên"
                            help="Tin nhắn này sẽ được gửi kèm trong email thông báo"
                        >
                            <TextArea rows={4} placeholder="Nhập tin nhắn cho sinh viên (ví dụ: Vui lòng đến phòng hành chính vào thời gian đã lên lịch)..." />
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
                                    setIsScheduleModalVisible(false);
                                    scheduleForm.resetFields();
                                    setMfaCode("");
                                    setSelectedRequest(null);
                                }}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit" loading={scheduleLoading}>
                                    Lên lịch và gửi email
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
}

