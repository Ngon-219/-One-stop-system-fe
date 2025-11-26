"use client";

import { useState } from "react";
import { Card, Upload, Button, Descriptions, Tag, Spin, Alert, Image, Input, Space } from "antd";
import { UploadOutlined, QrcodeOutlined, SearchOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { getPublicDocumentInfoApi } from "@/app/api/document_service";
import Swal from "sweetalert2";
import dayjs from "dayjs";
// @ts-ignore - jsqr doesn't have types
import jsQR from "jsqr";

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

export default function VerifyPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [documentInfo, setDocumentInfo] = useState<any>(null);
    const [documentId, setDocumentId] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");

    const decodeQRFromImage = (file: File): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement("img");
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        resolve(code.data);
                    } else {
                        reject(new Error("No QR code found in image"));
                    }
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                if (e.target?.result) {
                    img.src = e.target.result as string;
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (info: any) => {
        const file = info.file.originFileObj || info.file;
        if (!file) return;

        try {
            setLoading(true);
            
            // Show preview first
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Decode QR code from image (client-side only)
            const qrData = await decodeQRFromImage(file);
            
            if (!qrData) {
                throw new Error("Không tìm thấy QR code trong ảnh");
            }

            // QR code chứa document_id
            const extractedDocumentId = qrData.trim();
            setDocumentId(extractedDocumentId);
            
            // Fetch document info using document_id
            await fetchDocumentInfo(extractedDocumentId);
        } catch (error: any) {
            console.error("Failed to decode QR code:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.message || "Không thể đọc QR code từ ảnh!",
            });
            setImageUrl("");
            setDocumentInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocumentInfo = async (docId: string) => {
        setLoading(true);
        try {
            const info = await getPublicDocumentInfoApi(docId);
            setDocumentInfo(info);
        } catch (error: any) {
            console.error("Failed to fetch document info:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể tải thông tin tài liệu!",
            });
            setDocumentInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!documentId.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Vui lòng nhập Document ID hoặc upload ảnh QR code!",
            });
            return;
        }
        fetchDocumentInfo(documentId.trim());
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8">
            <div className="w-[90vw] mx-auto">
                <Card className="mb-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Xác thực tài liệu</h1>
                        <p className="text-gray-600">Upload ảnh QR code hoặc nhập Document ID để xem thông tin tài liệu</p>
                    </div>

                    <Space direction="vertical" size="large" className="w-full">
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[300px]">
                                <Input
                                    placeholder="Nhập Document ID (từ QR code)"
                                    value={documentId}
                                    onChange={(e) => setDocumentId(e.target.value)}
                                    onPressEnter={handleSearch}
                                    prefix={<QrcodeOutlined />}
                                    size="large"
                                />
                            </div>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={loading}
                                size="large"
                            >
                                Tìm kiếm
                            </Button>
                        </div>

                        <div>
                            <Upload
                                beforeUpload={() => false} // Prevent actual upload
                                onChange={handleFileChange}
                                showUploadList={false}
                                accept="image/*"
                                maxCount={1}
                            >
                                <Button icon={<UploadOutlined />} loading={loading} size="large">
                                    Upload ảnh QR code
                                </Button>
                            </Upload>
                            {imageUrl && (
                                <div className="mt-4">
                                    <Image
                                        src={imageUrl}
                                        alt="QR Code"
                                        width={200}
                                        className="rounded"
                                    />
                                </div>
                            )}
                        </div>
                    </Space>
                </Card>

                {loading && (
                    <Card>
                        <div className="flex justify-center py-8">
                            <Spin size="large" />
                        </div>
                    </Card>
                )}

                {documentInfo && !loading && (
                    <Card>
                        <div className="space-y-6">
                            {/* Document Info */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">Thông tin tài liệu</h2>
                                <Descriptions bordered column={2}>
                                    <Descriptions.Item label="Document ID" span={2}>
                                        <span className="font-mono text-xs">{documentInfo.document?.document_id}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại tài liệu">
                                        {documentInfo.document?.document_type_name || "-"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        <Tag color={statusColorMap[documentInfo.document?.status] || "default"}>
                                            {statusLabelMap[documentInfo.document?.status] || documentInfo.document?.status}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Hợp lệ">
                                        {documentInfo.document?.is_valid ? (
                                            <Tag color="green">Có</Tag>
                                        ) : (
                                            <Tag color="red">Không</Tag>
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">
                                        {documentInfo.document?.created_at
                                            ? dayjs(documentInfo.document.created_at).format("DD/MM/YYYY HH:mm")
                                            : "-"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày phát hành">
                                        {documentInfo.document?.issued_at
                                            ? dayjs(documentInfo.document.issued_at).format("DD/MM/YYYY HH:mm")
                                            : "-"}
                                    </Descriptions.Item>
                                    {documentInfo.document?.token_id && (
                                        <Descriptions.Item label="Token ID">
                                            <span className="font-mono text-xs">{documentInfo.document.token_id}</span>
                                        </Descriptions.Item>
                                    )}
                                    {documentInfo.document?.tx_hash && (
                                        <Descriptions.Item label="Transaction Hash">
                                            <span className="font-mono text-xs break-all">{documentInfo.document.tx_hash}</span>
                                        </Descriptions.Item>
                                    )}
                                    {documentInfo.document?.ipfs_hash && (
                                        <Descriptions.Item label="IPFS Hash">
                                            <span className="font-mono text-xs break-all">{documentInfo.document.ipfs_hash}</span>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>

                            {/* Student Info */}
                            {documentInfo.student && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Thông tin sinh viên</h2>
                                    <Descriptions bordered column={2}>
                                        <Descriptions.Item label="Họ và tên">
                                            {documentInfo.student.last_name} {documentInfo.student.first_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Mã sinh viên">
                                            {documentInfo.student.student_code || "-"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Email">
                                            {documentInfo.student.email}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Số điện thoại">
                                            {documentInfo.student.phone_number}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="CCCD">
                                            {documentInfo.student.cccd}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Địa chỉ">
                                            {documentInfo.student.address}
                                        </Descriptions.Item>
                                        {documentInfo.student.wallet_address && (
                                            <Descriptions.Item label="Địa chỉ ví" span={2}>
                                                <span className="font-mono text-xs break-all">{documentInfo.student.wallet_address}</span>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            )}

                            {/* Issuer Info */}
                            {documentInfo.issuer && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Thông tin người phát hành</h2>
                                    <Descriptions bordered column={2}>
                                        <Descriptions.Item label="Họ và tên">
                                            {documentInfo.issuer.last_name} {documentInfo.issuer.first_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Email">
                                            {documentInfo.issuer.email}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Vai trò">
                                            {documentInfo.issuer.role}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </div>
                            )}

                            {/* Blockchain Verification */}
                            {documentInfo.blockchain && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Xác thực Blockchain</h2>
                                    <Alert
                                        title={documentInfo.blockchain.isValid ? "Tài liệu hợp lệ trên Blockchain" : "Tài liệu không hợp lệ trên Blockchain"}
                                        type={documentInfo.blockchain.isValid ? "success" : "error"}
                                        showIcon
                                        className="mb-4"
                                    />
                                    <Descriptions bordered column={1}>
                                        <Descriptions.Item label="Chủ sở hữu">
                                            <span className="font-mono text-xs break-all">{documentInfo.blockchain.owner}</span>
                                        </Descriptions.Item>
                                        {documentInfo.blockchain.metadata && (
                                            <>
                                                <Descriptions.Item label="Loại tài liệu">
                                                    {documentInfo.blockchain.metadata.documentType}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Document Hash">
                                                    <span className="font-mono text-xs break-all">{documentInfo.blockchain.metadata.documentHash}</span>
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Ngày phát hành">
                                                    {documentInfo.blockchain.metadata.issuedAt
                                                        ? dayjs(documentInfo.blockchain.metadata.issuedAt).format("DD/MM/YYYY HH:mm")
                                                        : "-"}
                                                </Descriptions.Item>
                                            </>
                                        )}
                                    </Descriptions>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

