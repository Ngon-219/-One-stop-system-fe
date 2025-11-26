"use client"

import { useEffect, useRef, useState } from "react";
import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { Table, Tag, Button, Tooltip, Modal, Descriptions, Spin, Select, Empty, Alert, Input } from "antd";
import { EyeOutlined, ReloadOutlined, FileDoneOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import { approveDocumentApi, getDocumentByIdApi, getDocumentsApi, rejectDocumentApi } from "@/app/api/document_service";
import { getUserDetailApi } from "@/app/api/auth_service";
import { DocumentResponse, DocumentStatus, PdfSchemaPayload } from "@/app/api/interface/response/get_documents";
import { GetUserDetailResponse } from "@/app/api/interface/response/get_user_detail";
import { Form as PdfForm } from "@pdfme/ui";
import { barcodes, text, multiVariableText, image, svg, table as tablePlugin, line, rectangle, ellipse } from "@pdfme/schemas";
import { useMemo } from "react";

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

export default function HandleDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>("draft");
    const [sortField, setSortField] = useState<"created_at" | "updated_at" | "issued_at">("created_at");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
    const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
    const [selectedUserDetail, setSelectedUserDetail] = useState<GetUserDetailResponse | null>(null);
    const [userDetailLoading, setUserDetailLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [signModalVisible, setSignModalVisible] = useState<boolean>(false);
    const [signDocument, setSignDocument] = useState<DocumentResponse | null>(null);
    const [signLoading, setSignLoading] = useState<boolean>(false);
    const [signUserDetail, setSignUserDetail] = useState<GetUserDetailResponse | null>(null);
    const [signUserDetailLoading, setSignUserDetailLoading] = useState<boolean>(false);
    const [signFormLoading, setSignFormLoading] = useState<boolean>(false);
    const [signFormError, setSignFormError] = useState<string | null>(null);
    const [formReloadKey, setFormReloadKey] = useState(0);
    const [mfaCode, setMfaCode] = useState<string>("");
    const formContainerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<PdfForm | null>(null);
    const originalSchemaRef = useRef<PdfSchemaPayload | null>(null);
    const formInputsRef = useRef<Record<string, any>[]>([]);

    const pdfPlugins = useMemo(() => {
        const basePlugins: Record<string, any> = {
            text,
            multiVariableText,
            image,
            svg,
            table: tablePlugin,
            line,
            rectangle,
            ellipse,
        };
        if (barcodes?.qrcode) {
            basePlugins.qrcode = barcodes.qrcode;
        }
        return basePlugins;
    }, []);

    const fetchDocuments = async (currentPage: number, currentLimit: number) => {
        setLoading(true);
        try {
            const response = await getDocumentsApi({
                page: currentPage,
                limit: currentLimit,
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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments(page, pageSize);
    }, [page, pageSize, statusFilter, sortField, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, sortField, sortOrder]);

    const handleTableChange = (pagination: any) => {
        if (pagination.current && pagination.current !== page) {
            setPage(pagination.current);
        }

        if (pagination.pageSize && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize);
            setPage(1);
        }
    };

    const handleView = async (record: DocumentResponse) => {
        setSelectedDocument(record);
        setIsModalVisible(true);
        setSelectedUserDetail(null);
        setUserDetailLoading(true);
        try {
            const userDetail = await getUserDetailApi(record.user_id);
            setSelectedUserDetail(userDetail);
        } catch (error: any) {
            console.error("Failed to fetch user detail:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tải thông tin người dùng!",
            });
        } finally {
            setUserDetailLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedDocument(null);
        setSelectedUserDetail(null);
        setUserDetailLoading(false);
    };

    const handleRefresh = () => {
        fetchDocuments(page, pageSize);
    };

    const renderStatusTag = (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
            {statusLabelMap[status] || status}
        </Tag>
    );

    const handleSign = async (record: DocumentResponse) => {
        setSignModalVisible(true);
        setSignLoading(true);
        setSignDocument(null);
        setSignUserDetail(null);
        setSignUserDetailLoading(true);

        try {
            const detail = await getDocumentByIdApi(record.document_id);
            originalSchemaRef.current = detail.pdf_schema
                ? JSON.parse(JSON.stringify(detail.pdf_schema))
                : null;
            formInputsRef.current = detail.pdf_schema?.inputs
                ? JSON.parse(JSON.stringify(detail.pdf_schema.inputs))
                : [];
            setSignDocument(detail);

            try {
                const userDetail = await getUserDetailApi(record.user_id);
                setSignUserDetail(userDetail);
            } catch (userError: any) {
                console.error("Failed to fetch user detail:", userError);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: userError.response?.data?.message || "Không thể tải thông tin người dùng!",
                });
            } finally {
                setSignUserDetailLoading(false);
            }
        } catch (error: any) {
            console.error("Failed to get document detail:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tải chi tiết tài liệu!",
            }).then(() => {
                setSignModalVisible(false);
            });
            setSignUserDetailLoading(false);
        } finally {
            setSignLoading(false);
        }
    };

    const closeSignModal = () => {
        setSignModalVisible(false);
        setSignDocument(null);
        originalSchemaRef.current = null;
        formInputsRef.current = [];
        setSignUserDetail(null);
        setSignUserDetailLoading(false);
        setMfaCode("");
        setSignFormError(null);
        setFormReloadKey((prev) => prev + 1);
        if (formRef.current) {
            formRef.current.destroy();
            formRef.current = null;
        }
    };

    const handleRejectDocument = async () => {
        if (!signDocument) {
            return;
        }

        const { value: reason, isConfirmed } = await Swal.fire({
            title: "Lý do từ chối",
            input: "textarea",
            inputLabel: "Nhập lý do từ chối tài liệu",
            inputPlaceholder: "Ví dụ: Hồ sơ thiếu minh chứng...",
            inputValidator: (value) => (!value || !value.trim() ? "Vui lòng nhập lý do" : undefined),
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        });

        if (!isConfirmed || !reason) {
            return;
        }

        setSignLoading(true);
        try {
            await rejectDocumentApi(signDocument.document_id, reason.trim());
            Swal.fire({
                icon: "success",
                title: "Từ chối thành công",
                text: "Tài liệu đã được cập nhật trạng thái rejected.",
            });
            closeSignModal();
            await fetchDocuments(page, pageSize);
        } catch (error: any) {
            console.error("Failed to reject document:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể từ chối tài liệu!",
            });
        } finally {
            setSignLoading(false);
        }
    };

    const handleSignDocument = async () => {
        if (!signDocument) {
            return;
        }

        if (!mfaCode || mfaCode.trim().length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Thiếu MFA",
                text: "Vui lòng nhập mã xác thực MFA 6 chữ số trước khi ký.",
            });
            return;
        }

        const originalSchema = originalSchemaRef.current || signDocument.pdf_schema;
        if (!originalSchema?.template) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không tìm thấy template gốc của tài liệu.",
            });
            return;
        }

        const updatedTemplate = originalSchema.template;
        const payloadInputs =
            formInputsRef.current.length > 0
                ? formInputsRef.current
                : originalSchema?.inputs ?? [];

        const jsonTemplate = JSON.stringify({
            template: updatedTemplate,
            inputs: payloadInputs,
        });

        setSignLoading(true);
        try {
            await approveDocumentApi(signDocument.document_id, mfaCode.trim(), jsonTemplate);
            Swal.fire({
                icon: "success",
                title: "Ký thành công",
                text: "Đã gửi yêu cầu ký với dữ liệu hiện tại của form.",
            });
            closeSignModal();
            await fetchDocuments(page, pageSize);
        } catch (error: any) {
            if (
                error.response?.status === 401 &&
                error.response?.data?.message?.includes("MFA verification failed")
            ) {
                Swal.fire({
                    icon: "warning",
                    title: "Yêu cầu bật MFA",
                    text: "MFA chưa được kích hoạt hoặc mã sai. Vui lòng bật MFA và thử lại.",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.response?.data?.message || "Không thể ký tài liệu!",
                });
            }
        } finally {
            setSignLoading(false);
        }
    };

    useEffect(() => {
        if (!signModalVisible) {
            return;
        }

        const template = signDocument?.pdf_schema?.template;
        if (!template || !formContainerRef.current) {
            return;
        }

        if (formRef.current) {
            formRef.current.destroy();
            formRef.current = null;
        }

        setSignFormError(null);
        setSignFormLoading(true);

        const frameId = requestAnimationFrame(() => {
            try {
                const form = new PdfForm({
                    domContainer: formContainerRef.current!,
                    template,
                    inputs:
                        formInputsRef.current.length > 0
                            ? formInputsRef.current
                            : signDocument?.pdf_schema?.inputs || [],
                    plugins: pdfPlugins,
                });

                form.onChangeInput(() => {
                    const updatedInputs = form.getInputs();
                    formInputsRef.current = updatedInputs;
                });

                formRef.current = form;
                formInputsRef.current = form.getInputs();
                setSignFormLoading(false);
            } catch (error: any) {
                console.error("Failed to render form:", error);
                setSignFormError("Không thể hiển thị form ký. Vui lòng thử lại hoặc kiểm tra template.");
                setSignFormLoading(false);
            }
        });

        return () => {
            if (formRef.current) {
                formRef.current.destroy();
                formRef.current = null;
            }
            cancelAnimationFrame(frameId);
            setSignFormLoading(false);
        };
    }, [signModalVisible, signDocument?.pdf_schema?.template, pdfPlugins, formReloadKey]);


    const columns = [
        {
            title: "Mã tài liệu",
            dataIndex: "document_id",
            key: "document_id",
            width: 220,
            ellipsis: true,
        },
        {
            title: "Người yêu cầu",
            dataIndex: "user_id",
            key: "user_id",
            width: 220,
            ellipsis: true,
        },
        {
            title: "Loại tài liệu",
            key: "documentType",
            render: (_: any, record: DocumentResponse) =>
                record.documentType?.document_type_name || "Không xác định",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => renderStatusTag(status),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            render: (value: string) =>
                value ? new Date(value).toLocaleString("vi-VN") : "N/A",
        },
        {
            title: "Cập nhật",
            dataIndex: "updated_at",
            key: "updated_at",
            render: (value: string) =>
                value ? new Date(value).toLocaleString("vi-VN") : "N/A",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: DocumentResponse) => (
                <div className="flex gap-2">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: "#1890ff" }} />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Ký tài liệu">
                        <Button
                            type="text"
                            icon={<FileDoneOutlined style={{ color: "#52c41a" }} />}
                            onClick={() => handleSign(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <ManagerNavBar />
            <div className="w-[90vw] py-8">
                <div className="mb-6 flex flex-wrap gap-4 justify-between">
        <div>
                        <h1 className="text-3xl font-bold text-gray-800">Xử lý tài liệu</h1>
                        <p className="text-gray-600 mt-2">
                            Theo dõi và phê duyệt các yêu cầu tài liệu của sinh viên
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={statusFilter ?? "all"}
                            options={statusOptions}
                            onChange={(value) =>
                                setStatusFilter(value === "all" ? undefined : (value as DocumentStatus))
                            }
                            style={{ width: 180 }}
                        />
                        <Select
                            value={sortField}
                            options={sortFieldOptions}
                            onChange={(value) =>
                                setSortField(value as "created_at" | "updated_at" | "issued_at")
                            }
                            style={{ width: 160 }}
                        />
                        <Select
                            value={sortOrder}
                            options={sortOrderOptions}
                            onChange={(value) => setSortOrder(value as "ASC" | "DESC")}
                            style={{ width: 140 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>

                <Table
                    rowKey="document_id"
                    dataSource={documents}
                    columns={columns}
                    loading={loading}
                    className="bg-white rounded-3xl shadow-xl"
                    scroll={{ x: 1000 }}
                    locale={{
                        emptyText: loading ? <Spin /> : <Empty description="Không có dữ liệu" />,
                    }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20", "50"],
                        showTotal: (total) => `Tổng ${total} tài liệu`,
                    }}
                    onChange={handleTableChange}
                />
            </div>

            <Modal
                title="Chi tiết tài liệu"
                open={isModalVisible}
                onCancel={closeModal}
                footer={[
                    <Button key="close" onClick={closeModal}>
                        Đóng
                    </Button>,
                ]}
                width={720}
            >
                {selectedDocument ? (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã tài liệu">
                            {selectedDocument.document_id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người yêu cầu">
                            {selectedDocument.user_id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại tài liệu">
                            {selectedDocument.documentType?.document_type_name ||
                                selectedDocument.document_type_id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {renderStatusTag(selectedDocument.status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hợp lệ">
                            {selectedDocument.is_valid ? "Có" : "Không"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {selectedDocument.created_at
                                ? new Date(selectedDocument.created_at).toLocaleString("vi-VN")
                                : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {selectedDocument.updated_at
                                ? new Date(selectedDocument.updated_at).toLocaleString("vi-VN")
                                : "N/A"}
                        </Descriptions.Item>
                        {selectedDocument.issued_at && (
                            <Descriptions.Item label="Ngày phát hành">
                                {new Date(selectedDocument.issued_at).toLocaleString("vi-VN")}
                            </Descriptions.Item>
                        )}
                        {selectedDocument.metadata && (
                            <Descriptions.Item label="Metadata">
                                <div className="max-h-48 overflow-auto bg-gray-50 p-3 rounded">
                                    <pre className="text-xs">
                                        {JSON.stringify(selectedDocument.metadata, null, 2)}
                                    </pre>
                                </div>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                ) : (
                    <div className="flex justify-center items-center py-8">
                        <Spin />
                    </div>
                )}
                <div className="mt-4">
                    <h3 className="font-semibold mb-2">Thông tin sinh viên</h3>
                    {userDetailLoading ? (
                        <div className="flex justify-center items-center py-4">
                            <Spin size="small" />
                        </div>
                    ) : selectedUserDetail ? (
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Họ và tên">
                                {selectedUserDetail.last_name} {selectedUserDetail.first_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {selectedUserDetail.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {selectedUserDetail.phone_number}
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">
                                {selectedUserDetail.address}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã sinh viên">
                                {selectedUserDetail.student_code || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chuyên ngành">
                                {selectedUserDetail.major_names?.join(", ") || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Wallet address">
                                {selectedUserDetail.wallet_address || "N/A"}
                            </Descriptions.Item>
                        </Descriptions>
                    ) : (
                        <Alert
                            type="warning"
                            message="Không có thông tin sinh viên."
                            showIcon
                        />
                    )}
                </div>
            </Modal>

            <Modal
                title="Ký tài liệu"
                open={signModalVisible}
                onCancel={closeSignModal}
                footer={[
                    <Button
                        key="sign"
                        type="primary"
                        onClick={handleSignDocument}
                        disabled={
                            !signDocument ||
                            !signDocument.pdf_schema?.template ||
                            signLoading ||
                            !mfaCode
                        }
                    >
                        Ký tài liệu
                    </Button>,
                    <Button
                        key="reject"
                        danger
                        onClick={handleRejectDocument}
                        disabled={!signDocument || signLoading}
                    >
                        Từ chối
                    </Button>,
                    <Button key="close" onClick={closeSignModal}>
                        Đóng
                    </Button>,
                ]}
                width={960}
                destroyOnHidden
            >
                {!signDocument ? (
                    <Empty description="Không có dữ liệu tài liệu" />
                ) : (
                    <div className="space-y-4">
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Mã tài liệu">
                                {signDocument.document_id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại tài liệu">
                                {signDocument.documentType?.document_type_name ||
                                    signDocument.document_type_id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {renderStatusTag(signDocument.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người yêu cầu">
                                {signDocument.user_id}
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <h3 className="font-semibold mb-2">Thông tin sinh viên</h3>
                            {signUserDetailLoading ? (
                                <div className="flex justify-center items-center py-4">
                                    <Spin size="small" />
                                </div>
                            ) : signUserDetail ? (
                                <Descriptions bordered column={2}>
                                    <Descriptions.Item label="Họ và tên">
                                        {signUserDetail.last_name} {signUserDetail.first_name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã sinh viên">
                                        {signUserDetail.student_code || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        {signUserDetail.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số điện thoại">
                                        {signUserDetail.phone_number}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Chuyên ngành">
                                        {signUserDetail.major_names?.join(", ") || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Wallet address">
                                        {signUserDetail.wallet_address || "N/A"}
                                    </Descriptions.Item>
                                </Descriptions>
                            ) : (
                                <Alert
                                    type="warning"
                                    message="Không có thông tin sinh viên."
                                    showIcon
                                />
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Mã xác thực (MFA)</h3>
                            <Input
                                placeholder="Nhập mã MFA 6 chữ số"
                                maxLength={6}
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                disabled={signLoading}
                            />
                        </div>

                        {!signDocument.pdf_schema?.template ? (
                            <Alert
                                type="warning"
                                message="Tài liệu chưa có PDF schema để hiển thị."
                                showIcon
                            />
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Điền/điều chỉnh dữ liệu chứng chỉ trước khi ký.
                                </p>
                                <div className="border rounded-lg h-[600px] overflow-hidden relative">
                                    {signFormLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                                            <Spin />
                                        </div>
                                    )}
                                    {signFormError && !signFormLoading ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-white/90">
                                            <Alert type="error" message={signFormError} showIcon />
                                            <Button
                                                size="small"
                                                onClick={() => setFormReloadKey((prev) => prev + 1)}
                                            >
                                                Thử tải lại
                                            </Button>
                                        </div>
                                    ) : null}
                                    <div ref={formContainerRef} className="w-full h-full" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}