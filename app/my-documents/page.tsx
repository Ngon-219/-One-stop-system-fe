"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Table, Tag, Button, Modal, Card, Spin, Select } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import NavBar from "@/app/components/navbar";
import StudentNavBar from "@/app/components/student-navbar";
import { getMyDocumentsApi } from "@/app/api/document_service";
import { DocumentResponse, DocumentStatus } from "@/app/api/interface/response/get_documents";
import dayjs from "dayjs";

const statusLabelMap: Record<string, string> = {
    draft: "Nháp",
    pending_approval: "Chờ duyệt",
    approved: "Đã duyệt",
    pending_blockchain: "Chờ blockchain",
    minted: "Đã phát hành",
    rejected: "Từ chối",
    revoked: "Đã thu hồi",
    failed: "Lỗi",
};

const statusColorMap: Record<string, string> = {
    draft: "default",
    pending_approval: "gold",
    approved: "blue",
    pending_blockchain: "cyan",
    minted: "green",
    rejected: "red",
    revoked: "magenta",
    failed: "volcano",
};

const statusOptions = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: statusLabelMap.draft, value: "draft" },
    { label: statusLabelMap.pending_approval, value: "pending_approval" },
    { label: statusLabelMap.approved, value: "approved" },
    { label: statusLabelMap.pending_blockchain, value: "pending_blockchain" },
    { label: statusLabelMap.minted, value: "minted" },
    { label: statusLabelMap.rejected, value: "rejected" },
    { label: statusLabelMap.revoked, value: "revoked" },
    { label: statusLabelMap.failed, value: "failed" },
];

const sortFieldOptions = [
    { label: "Ngày tạo", value: "created_at" },
    { label: "Ngày cập nhật", value: "updated_at" },
    { label: "Ngày phát hành", value: "issued_at" },
];

const sortOrderOptions = [
    { label: "Mới nhất", value: "DESC" },
    { label: "Cũ nhất", value: "ASC" },
];

export default function MyDocumentsPage() {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>(undefined);
    const [sortField, setSortField] = useState<"created_at" | "updated_at" | "issued_at">("created_at");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
            return;
        }

        if (isAuthenticated) {
            fetchDocuments();
        }
    }, [loading, isAuthenticated, router, page, pageSize, statusFilter, sortField, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, sortField, sortOrder]);

    const fetchDocuments = async () => {
        setLoadingDocuments(true);
        try {
            const response = await getMyDocumentsApi({
                page,
                limit: pageSize,
                status: statusFilter,
                sort: sortField,
                order: sortOrder,
            });
            setDocuments(response.data);
            setTotal(response.total);
        } catch (error: any) {
            console.error("Failed to fetch documents:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tải danh sách tài liệu!",
            });
        } finally {
            setLoadingDocuments(false);
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "document_id",
            key: "document_id",
            width: 100,
            render: (text: string) => <span className="font-mono text-xs">{text.substring(0, 8)}...</span>,
        },
        {
            title: "Loại tài liệu",
            dataIndex: "documentType",
            key: "documentType",
            width: 150,
            render: (docType: any) => docType?.document_type_name || "-",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 150,
            render: (status: string) => (
                <Tag color={statusColorMap[status] || "default"}>
                    {statusLabelMap[status] || status}
                </Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 180,
            render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updated_at",
            key: "updated_at",
            width: 180,
            render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Ngày phát hành",
            dataIndex: "issued_at",
            key: "issued_at",
            width: 180,
            render: (text: string | null) => (text ? dayjs(text).format("DD/MM/YYYY HH:mm") : "-"),
        },
        {
            title: "Hành động",
            key: "action",
            width: 100,
            render: (_: any, record: DocumentResponse) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        Modal.info({
                            title: "Chi tiết tài liệu",
                            width: 700,
                            content: (
                                <div className="mt-4 space-y-2">
                                    <p><strong>ID:</strong> {record.document_id}</p>
                                    <p><strong>Loại tài liệu:</strong> {record.documentType?.document_type_name || "-"}</p>
                                    <p><strong>Trạng thái:</strong> <Tag color={statusColorMap[record.status] || "default"}>{statusLabelMap[record.status] || record.status}</Tag></p>
                                    <p><strong>Hợp lệ:</strong> {record.is_valid ? "Có" : "Không"}</p>
                                    {record.issued_at && (
                                        <p><strong>Ngày phát hành:</strong> {dayjs(record.issued_at).format("DD/MM/YYYY HH:mm")}</p>
                                    )}
                                    {record.verified_at && (
                                        <p><strong>Ngày xác thực:</strong> {dayjs(record.verified_at).format("DD/MM/YYYY HH:mm")}</p>
                                    )}
                                    {record.token_id && (
                                        <p><strong>Token ID:</strong> <span className="font-mono text-xs">{record.token_id}</span></p>
                                    )}
                                    {record.tx_hash && (
                                        <p><strong>Transaction Hash:</strong> <span className="font-mono text-xs">{record.tx_hash.substring(0, 20)}...</span></p>
                                    )}
                                    {record.ipfs_hash && (
                                        <p><strong>IPFS Hash:</strong> <span className="font-mono text-xs">{record.ipfs_hash.substring(0, 20)}...</span></p>
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
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lịch sử yêu cầu giấy tờ</h1>
                        <p className="text-gray-600">Xem lịch sử các lần bạn yêu cầu giấy tờ</p>
                    </div>

                    <div className="mb-4 flex gap-4">
                        <Select
                            value={statusFilter || "all"}
                            options={statusOptions}
                            onChange={(value) => {
                                setStatusFilter(value === "all" ? undefined : (value as DocumentStatus));
                            }}
                            style={{ width: 200 }}
                            placeholder="Lọc theo trạng thái"
                        />
                        <Select
                            value={sortField}
                            options={sortFieldOptions}
                            onChange={(value) => {
                                setSortField(value as "created_at" | "updated_at" | "issued_at");
                            }}
                            style={{ width: 150 }}
                            placeholder="Sắp xếp theo"
                        />
                        <Select
                            value={sortOrder}
                            options={sortOrderOptions}
                            onChange={(value) => {
                                setSortOrder(value as "ASC" | "DESC");
                            }}
                            style={{ width: 150 }}
                            placeholder="Thứ tự"
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={documents}
                        rowKey="document_id"
                        loading={loadingDocuments}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} tài liệu`,
                            onChange: (page, pageSize) => {
                                setPage(page);
                                setPageSize(pageSize);
                            },
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </div>
        </div>
    );
}

