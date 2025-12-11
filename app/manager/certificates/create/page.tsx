"use client"

import { useEffect, useState } from "react";
import { Button, Form, Input, Select, DatePicker, Spin } from "antd";
import { createCertificateApi, getDocumentTypesApi } from "@/app/api/auth_service";
import { CreateCertificateRequest } from "@/app/api/interface/request/create_certificate";
import { GetDocumentTypesResponse, DocumentType } from "@/app/api/interface/response/get_document_types";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import ManagerNavBar from "@/app/components/manager-navbar";
import NavBar from "@/app/components/navbar";

const { TextArea } = Input;

export default function CreateCertificatePage() {
    const [form] = Form.useForm();
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingDocumentTypes, setLoadingDocumentTypes] = useState<boolean>(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    const fetchDocumentTypes = async () => {
        setLoadingDocumentTypes(true);
        try {
            const response: GetDocumentTypesResponse = await getDocumentTypesApi();
            setDocumentTypes(response.documentTypes);
        } catch (err) {
            console.error("Failed to load document types", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải danh sách loại tài liệu!",
            });
        } finally {
            setLoadingDocumentTypes(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const request: CreateCertificateRequest = {
                user_email: values.user_email,
                document_type_id: values.document_type_id,
                certificate_name: values.certificate_name,
                issued_date: values.issued_date.format("YYYY-MM-DD"),
                expiry_date: values.expiry_date ? values.expiry_date.format("YYYY-MM-DD") : undefined,
                description: values.description || undefined,
                metadata: values.metadata ? JSON.parse(values.metadata) : undefined,
            };

            const response = await createCertificateApi(request);
            
            if (response.success) {
                Swal.fire({
                    title: "Thành công",
                    text: response.message,
                    icon: "success",
                });
                form.resetFields();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: response.message || "Không thể tạo chứng chỉ!",
                });
            }
        } catch (error: any) {
            console.error("Failed to create certificate:", error);
            const errorMessage = error?.response?.data || error?.message || "Không thể tạo chứng chỉ!";
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage),
            });
        } finally {
            setLoading(false);
        }
    };

    const documentTypeOptions = documentTypes.map((type) => ({
        label: type.document_type_name,
        value: type.document_type_id,
    }));

    const handleDocumentTypeChange = (value: string) => {
        const selectedType = documentTypes.find((type) => type.document_type_id === value);
        setSelectedDocumentType(selectedType || null);
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <ManagerNavBar />
            <div className="w-[90vw] py-8 flex flex-col items-center">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Tạo chứng chỉ</h1>
                    <p className="text-gray-600 mt-2">Thêm chứng chỉ mới cho người dùng</p>
                </div>
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl w-full mx-auto">
                    {loadingDocumentTypes ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            className="max-w-3xl mx-auto"
                        >
                            <Form.Item
                                label="Email người dùng"
                                name="user_email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email người dùng" },
                                    { type: "email", message: "Email không hợp lệ" },
                                ]}
                            >
                                <Input placeholder="user@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="Loại tài liệu"
                                name="document_type_id"
                                rules={[{ required: true, message: "Vui lòng chọn loại tài liệu" }]}
                            >
                                <Select
                                    placeholder="Chọn loại tài liệu"
                                    loading={loadingDocumentTypes}
                                    options={documentTypeOptions}
                                    onChange={handleDocumentTypeChange}
                                />
                            </Form.Item>
                            {selectedDocumentType && selectedDocumentType.description && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-800 mb-1">Mô tả loại tài liệu:</p>
                                    <p className="text-sm text-blue-700">{selectedDocumentType.description}</p>
                                </div>
                            )}

                            <Form.Item
                                label="Tên chứng chỉ"
                                name="certificate_name"
                                rules={[{ required: true, message: "Vui lòng nhập tên chứng chỉ" }]}
                            >
                                <Input placeholder="Nhập tên chứng chỉ" />
                            </Form.Item>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Form.Item
                                    label="Ngày cấp"
                                    name="issued_date"
                                    rules={[{ required: true, message: "Vui lòng chọn ngày cấp" }]}
                                >
                                    <DatePicker
                                        className="w-full"
                                        format="YYYY-MM-DD"
                                        placeholder="Chọn ngày cấp"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Ngày hết hạn"
                                    name="expiry_date"
                                >
                                    <DatePicker
                                        className="w-full"
                                        format="YYYY-MM-DD"
                                        placeholder="Chọn ngày hết hạn (tùy chọn)"
                                    />
                                </Form.Item>
                            </div>

                            <Form.Item
                                label="Mô tả"
                                name="description"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Nhập mô tả chứng chỉ (tùy chọn)"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Metadata (JSON)"
                                name="metadata"
                                help="Nhập dữ liệu JSON bổ sung (tùy chọn)"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder='{"key": "value"}'
                                />
                            </Form.Item>

                            <Form.Item>
                                <div className="flex gap-4">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        size="large"
                                    >
                                        Tạo chứng chỉ
                                    </Button>
                                    <Button
                                        onClick={() => form.resetFields()}
                                        size="large"
                                    >
                                        Làm mới
                                    </Button>
                                    <Button
                                        onClick={() => router.back()}
                                        size="large"
                                    >
                                        Quay lại
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    )}
                </div>
            </div>
        </div>
    );
}

