"use client" 
import { getUploadHistoryApi, uploadChunkApi } from "@/app/api/auth_service";
import { gettUploadHistoryReq } from "@/app/api/interface/request/upload_history";
import { GetUploadHistoryResponse, FileUploadHistoryItem } from "@/app/api/interface/response/get_upload_history";
import NavBar from "@/app/components/navbar"
import { Table, Button, Tooltip, Input, Select, Tag, Upload, Progress, message } from 'antd';
import { useEffect, useState } from "react";
import { EyeOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import type { UploadFile } from 'antd';
import { useLoading } from "@/app/context/LoadingContext";

interface TableUploadHistory {
    key: string;
    fileUploadHistoryId: string;
    fileName: string;
    status: string;
    createdAt: string;
}

export default function UploadPageManager() {
    let [dataSource, setDataSource] = useState<TableUploadHistory[]>([]);
    let [currentPage, setCurrentPage] = useState<number>(1);
    let [pageSize, setPageSize] = useState<number>(10);
    let [total, setTotal] = useState<number>(0);
    let [searchValue, setSearchValue] = useState<string>("");
    let [loading, setLoading] = useState<boolean>(false);
    let [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadFileName, setUploadFileName] = useState<string>("");
    const router = useRouter();

    const fetchUploadHistory = async (params?: { limit?: number; page?: number; search?: string; status?: string }) => {
        const {
            limit = pageSize,
            page = currentPage,
            search = searchValue,
            status = selectedStatus,
        } = params ?? {};
        let req: gettUploadHistoryReq = {
            limit: limit,
            page: page,
        };

        if (search.trim()) {
            // Có thể thêm search nếu API hỗ trợ
        }

        if (status && status !== "ALL") {
            req.status = status;
        }

        if (!uploading) {
            setLoading(true);
        }
        try {
            let response: GetUploadHistoryResponse = await getUploadHistoryApi(req);
        
            const formatted_uploads = response.fileUploads.map((upload: FileUploadHistoryItem) => {
                return {
                    key: upload.fileUploadHistoryId,
                    fileUploadHistoryId: upload.fileUploadHistoryId,
                    fileName: upload.fileName,
                    status: upload.status,
                    createdAt: upload.createdAt,
                }
            });

            setTotal(response.total);
            setCurrentPage(response.page);
            setPageSize(response.pageSize);
            
            setDataSource(formatted_uploads);
        } catch (err) {
            console.error("Failed to fetch upload history", err);
        } finally {
            if (!uploading) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        fetchUploadHistory();
    }, [])

    const handleView = (item: TableUploadHistory) => {
        console.log("View upload:", item.fileUploadHistoryId); 
    };

    const handleDownload = (item: TableUploadHistory) => {
        console.log("Download file:", item.fileName);
    };

    const handleSyncDB = (item: TableUploadHistory) => {
        console.log("Sync DB for:", item.fileUploadHistoryId);
        fetchUploadHistory();
    };

    const handleSyncBlockchain = (item: TableUploadHistory) => {
        console.log("Sync Blockchain for:", item.fileUploadHistoryId);
        // Implement sync blockchain logic
        // Sau khi sync thành công, refresh lại data
        fetchUploadHistory();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "orange";
            case "sync_db":
                return "blue";
            case "sync_blockchain":
                return "green";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "Đang chờ";
            case "sync_db":
                return "Đồng bộ DB";
            case "sync_blockchain":
                return "Đồng bộ Blockchain";
            default:
                return status;
        }
    };

    const columns = [
        {
            title: 'Tên file',
            dataIndex: 'fileName',
            key: 'fileName',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusLabel(status)}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => {
                const dateObj = new Date(date);
                return dateObj.toLocaleString('vi-VN');
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableUploadHistory) => {
                const isPending = record.status === "pending";
                const isSyncDB = record.status === "sync_db";
                const isSyncBlockchain = record.status === "sync_blockchain";
                
                // Disable "Sync DB" khi đã sync DB hoặc đã sync blockchain
                const isSyncDBDisabled = isSyncDB || isSyncBlockchain;
                // Disable "Sync Blockchain" khi đã sync blockchain
                const isSyncBlockchainDisabled = isSyncBlockchain;

                return (
                    <div className="flex gap-2">
                        <Tooltip title="Đồng bộ DB">
                            <Button 
                                type="primary"
                                size="small"
                                disabled={isSyncDBDisabled}
                                onClick={() => handleSyncDB(record)}
                            >
                                Sync DB
                            </Button>
                        </Tooltip>
                        <Tooltip title="Đồng bộ Blockchain">
                            <Button 
                                type="primary"
                                size="small"
                                disabled={isSyncBlockchainDisabled}
                                onClick={() => handleSyncBlockchain(record)}
                            >
                                Sync Blockchain
                            </Button>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];

    const handleSearch = (value: string) => {
        const sanitizedValue = value.trim();
        setSearchValue(value);
        fetchUploadHistory({ page: 1, search: sanitizedValue, limit: pageSize, status: selectedStatus });
    };

    const handleSearchInputChange = (value: string) => {
        setSearchValue(value);
        if (!value.trim()) {
            fetchUploadHistory({ page: 1, search: "", limit: pageSize, status: selectedStatus });
        }
    };

    const handleStatusChange = (value: string) => {
        const statusValue = value === "ALL" ? undefined : value;
        setSelectedStatus(statusValue);
        fetchUploadHistory({ page: 1, search: searchValue.trim(), status: statusValue, limit: pageSize });
    };

    const handleBack = () => {
        router.push("/manager/create-user");
    };

    const uploadFile = async (file: File, chunkSizeMB: number = 1) => {
        const chunkSizeBytes = chunkSizeMB * 1024 * 1024;
        const fileSize = file.size;
        const fileName = file.name;
        const totalChunks = Math.ceil(fileSize / chunkSizeBytes);

        setUploading(true);
        setUploadProgress(0);
        setUploadFileName(fileName);

        try {
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSizeBytes;
                const end = Math.min(start + chunkSizeBytes, fileSize);
                const chunk = file.slice(start, end);

                const data = await uploadChunkApi(fileName, chunkIndex, totalChunks, chunk);
                
                const progress = Math.min(100, Math.round(((chunkIndex + 1) / totalChunks) * 100));
                setUploadProgress(progress);

                if (data.complete) {
                    message.success(`Upload hoàn tất! File: ${fileName}`);
                    setUploading(false);
                    setUploadProgress(0);
                    setUploadFileName("");
                    fetchUploadHistory();
                    return;
                }
            }

            message.success("Tất cả chunks đã được upload thành công!");
            setUploading(false);
            setUploadProgress(0);
            setUploadFileName("");
            fetchUploadHistory();
        } catch (error: any) {
            console.error("Upload failed:", error);
            message.error(`Upload thất bại: ${error.response?.data?.message || error.message}`);
            setUploading(false);
            setUploadProgress(0);
            setUploadFileName("");
        }
    };

    const handleFileUpload = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            message.error("Chỉ chấp nhận file CSV!");
            return false;
        }

        uploadFile(file, 1);
        return false;
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <div className="w-[90vw] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <Select
                    placeholder="Lọc theo trạng thái"
                    className="w-full sm:w-60"
                    value={selectedStatus ?? "ALL"}
                    onChange={handleStatusChange}
                    options={[
                        { value: "", label: "Tất cả" },
                        { value: "pending", label: "Đang chờ" },
                        { value: "sync_db", label: "Đồng bộ DB" },
                        { value: "sync_blockchain", label: "Đồng bộ Blockchain" },
                    ]}
                />
            </div>
            <div className="w-[90vw] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex gap-2">
                    <Upload
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        accept=".csv"
                        disabled={uploading}
                    >
                        <Button 
                            type="primary" 
                            icon={<UploadOutlined />}
                            disabled={uploading}
                            className="w-full sm:w-auto"
                        >
                            Upload CSV
                        </Button>
                    </Upload>
                    <Button type="default" onClick={handleBack} className="w-full sm:w-auto">
                        Quay lại
                    </Button>
                </div>
            </div>
            {uploading && (
                <div className="w-[90vw] mb-4">
                    <div className="mb-2">
                        <span>Đang upload: {uploadFileName}</span>
                    </div>
                    <Progress percent={uploadProgress} status="active" />
                </div>
            )}
            <Table 
                dataSource={dataSource}
                columns={columns}
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: (page: number, newPageSize: number) => {
                        fetchUploadHistory({ limit: newPageSize, page, search: searchValue.trim(), status: selectedStatus });
                    },
                }}
                className="w-[90vw] rounded-3xl shadow-xl"
                scroll={{ x: 1000 }}
            />
        </div>
    )
}
