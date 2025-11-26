"use client"

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDocumentTypeByIdApi, updateDocumentTypeApi } from "@/app/api/auth_service";
import { DocumentType } from "@/app/api/interface/response/get_document_types";
import { UpdateDocumentTypeRequest } from "@/app/api/interface/request/update_document_type";
import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { Button, Spin, message } from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import type { Template } from "@pdfme/common";
import { BLANK_PDF } from "@pdfme/common";
import { Designer } from "@pdfme/ui";

export default function EditDocumentTemplatePage() {
    const params = useParams();
    const router = useRouter();
    const documentTypeId = params.id as string;
    const containerRef = useRef<HTMLDivElement>(null);
    const designerRef = useRef<Designer | null>(null);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [documentType, setDocumentType] = useState<DocumentType | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);

    useEffect(() => {
        const fetchDocumentType = async () => {
            try {
                const doc = await getDocumentTypeByIdApi(documentTypeId);
                setDocumentType(doc);
                
                // Parse template nếu có, nếu không tạo template mới
                let initialTemplate: Template;
                if (doc.template_pdf) {
                    try {
                        initialTemplate = JSON.parse(doc.template_pdf);
                    } catch (e) {
                        console.error("Failed to parse template, using blank template:", e);
                        initialTemplate = {
                            basePdf: BLANK_PDF,
                            schemas: [[]],
                        };
                    }
                } else {
                    initialTemplate = {
                        basePdf: BLANK_PDF,
                        schemas: [[]],
                    };
                }
                
                setTemplate(initialTemplate);
            } catch (error) {
                console.error("Failed to fetch document type:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải thông tin loại tài liệu!",
                }).then(() => {
                    router.push("/manager/documents");
                });
            } finally {
                setLoading(false);
            }
        };

        if (documentTypeId) {
            fetchDocumentType();
        }
    }, [documentTypeId, router]);

    useEffect(() => {
        if (!containerRef.current || !template || loading) {
            return;
        }

        if (designerRef.current) {
            return;
        }

        // Khởi tạo Designer
        const designer = new Designer({
            domContainer: containerRef.current,
            template,
            options: {
                zoomLevel: 1,
                sidebarOpen: true,
            },
        });

        designerRef.current = designer;

        // KHÔNG update state khi onChangeTemplate để tránh recreate Designer
        // Template sẽ được lấy từ designer.getTemplate() khi save
        designer.onChangeTemplate(() => {
            // Không làm gì cả - chỉ để Designer track changes nội bộ
        });

        // Cleanup
        return () => {
            if (designerRef.current) {
                designerRef.current.destroy();
                designerRef.current = null;
            }
        };
    }, [template, loading]);

    const handleSave = async () => {
        if (!designerRef.current || !documentType) {
            return;
        }

        // Xác nhận với Swal
        const result = await Swal.fire({
            title: "Xác nhận lưu",
            text: "Bạn có chắc chắn muốn lưu template này?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy"
        });

        if (!result.isConfirmed) {
            return;
        }

        setSaving(true);
        try {
            const currentTemplate = designerRef.current.getTemplate();
            const templateJson = JSON.stringify(currentTemplate);

            const updateData: UpdateDocumentTypeRequest = {
                templatePdf: templateJson,
            };

            await updateDocumentTypeApi(documentTypeId, updateData);

            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Template đã được lưu thành công!",
            });

            // Refresh document type data
            const updatedDoc = await getDocumentTypeByIdApi(documentTypeId);
            setDocumentType(updatedDoc);
        } catch (error: any) {
            console.error("Failed to save template:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể lưu template!",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center">
                <NavBar />
                <ManagerNavBar />
                <div className="flex justify-center items-center py-12">
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <NavBar />
            <ManagerNavBar />
            <div className="w-full flex-1 flex flex-col">
                {/* Header */}
                <div className="w-[90vw] mx-auto py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push("/manager/documents")}
                        >
                            Quay lại
                        </Button>
                        <h1 className="text-2xl font-bold mt-2">
                            Chỉnh sửa template: {documentType?.document_type_name}
                        </h1>
                        <p className="text-gray-600 mt-1">{documentType?.description}</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={saving}
                        size="large"
                    >
                        Lưu template
                    </Button>
                </div>

                {/* PDF Designer Container */}
                <div className="flex-1 w-full overflow-hidden">
                    <div ref={containerRef} className="w-full h-full" />
                </div>
            </div>
        </div>
    );
}

