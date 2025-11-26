"use client"

import { getDocumentTypesApi } from "@/app/api/auth_service";
import { GetDocumentTypesResponse, DocumentType } from "@/app/api/interface/response/get_document_types";
import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { Table, Button, Tooltip, Tag, Modal, Descriptions, Spin } from 'antd';
import { useEffect, useState } from "react";
import { EditOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface TableDocumentType {
    key: string;
    document_type_id: string;
    document_type_name: string;
    description: string;
    template_pdf: string | null;
    created_at: string;
    updated_at: string;
}

export default function DocumentManagerPage() {
    const [dataSource, setDataSource] = useState<TableDocumentType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const router = useRouter();

    const fetchDocumentTypes = async () => {
        setLoading(true);
        try {
            const response: GetDocumentTypesResponse = await getDocumentTypesApi();
            
            const formattedDocuments = response.documentTypes.map((doc: DocumentType) => {
                return {
                    key: doc.document_type_id,
                    document_type_id: doc.document_type_id,
                    document_type_name: doc.document_type_name,
                    description: doc.description,
                    template_pdf: doc.template_pdf,
                    created_at: doc.created_at,
                    updated_at: doc.updated_at,
                };
            });

            setDataSource(formattedDocuments);
        } catch (err) {
            console.error("Failed to fetch document types", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải danh sách loại tài liệu!",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    const handleView = async (item: TableDocumentType) => {
        setIsModalVisible(true);
        setLoadingDetail(true);
        setSelectedDocument(null);
        
        try {
            const response: GetDocumentTypesResponse = await getDocumentTypesApi();
            const doc = response.documentTypes.find(d => d.document_type_id === item.document_type_id);
            if (doc) {
                setSelectedDocument(doc);
            }
        } catch (error) {
            console.error("Failed to fetch document detail:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải thông tin chi tiết!",
            });
            setIsModalVisible(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleEdit = (item: TableDocumentType) => {
        // Navigate to edit page với document type id
        router.push(`/manager/documents/edit/${item.document_type_id}`);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedDocument(null);
    };

    const columns = [
        {
            title: 'Tên loại tài liệu',
            dataIndex: 'document_type_name',
            key: 'document_type_name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Template',
            key: 'template_pdf',
            render: (_: any, record: TableDocumentType) => (
                <Tag color={record.template_pdf ? "green" : "red"}>
                    {record.template_pdf ? "Đã có template" : "Chưa có template"}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text: string) => text ? new Date(text).toLocaleString('vi-VN') : "N/A",
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableDocumentType) => (
                <div className="flex gap-2">
                    <Tooltip title="Xem chi tiết">
                        <Button 
                            type="text"
                            icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => handleView(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa template">
                        <Button 
                            type="text"
                            icon={<EditOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => handleEdit(record)} 
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
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Quản lý tài liệu</h1>
                    <p className="text-gray-600 mt-2">Quản lý các loại tài liệu và template PDF</p>
                </div>
                <Table 
                    dataSource={dataSource}
                    columns={columns}
                    loading={loading}
                    className="bg-white rounded-3xl shadow-xl"
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} loại tài liệu`,
                    }}
                />
            </div>

            <Modal
                title="Chi tiết loại tài liệu"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Đóng
                    </Button>
                ]}
                width={700}
            >
                {loadingDetail ? (
                    <div className="flex justify-center items-center py-12">
                        <Spin size="large" />
                    </div>
                ) : selectedDocument ? (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Tên loại tài liệu">
                            {selectedDocument.document_type_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mô tả">
                            {selectedDocument.description}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái template">
                            <Tag color={selectedDocument.template_pdf ? "green" : "red"}>
                                {selectedDocument.template_pdf ? "Đã có template" : "Chưa có template"}
                            </Tag>
                        </Descriptions.Item>
                        {selectedDocument.template_pdf && (
                            <Descriptions.Item label="Template JSON">
                                <div className="max-h-40 overflow-auto bg-gray-50 p-2 rounded">
                                    <pre className="text-xs">
                                        {JSON.stringify(JSON.parse(selectedDocument.template_pdf), null, 2)}
                                    </pre>
                                </div>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Ngày tạo">
                            {selectedDocument.created_at ? new Date(selectedDocument.created_at).toLocaleString('vi-VN') : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {selectedDocument.updated_at ? new Date(selectedDocument.updated_at).toLocaleString('vi-VN') : "N/A"}
                        </Descriptions.Item>
                    </Descriptions>
                ) : null}
            </Modal>
        </div>
    );
}
