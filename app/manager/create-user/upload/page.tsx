"use client" 
import { getUploadHistoryApi, uploadChunkApi, syncDBApi, getBulkCreateProgressApi } from "@/app/api/auth_service";
import { gettUploadHistoryReq } from "@/app/api/interface/request/upload_history";
import { GetUploadHistoryResponse, FileUploadHistoryItem } from "@/app/api/interface/response/get_upload_history";
import { BulkCreateProgressResponse } from "@/app/api/interface/response/bulk_create_progress";
import NavBar from "@/app/components/navbar"
import { Table, Button, Tooltip, Input, Select, Tag, Upload, Progress, message, Modal } from 'antd';
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
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
    const [syncProgressMap, setSyncProgressMap] = useState<Record<string, BulkCreateProgressResponse>>({});
    const progressIntervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
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
            
            // Batch update để tránh multiple re-renders
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

    const handleSyncDB = async (item: TableUploadHistory) => {
        const historyId = item.fileUploadHistoryId;
        
        try {
            // Gọi API sync DB
            await syncDBApi(historyId);
            message.info("Đã bắt đầu đồng bộ DB...");
        } catch (error: any) {
            // Nếu status code là 409, có thể đang sync rồi, vẫn hiển thị progress
            if (error.response?.status === 409) {
                message.info("Đang kiểm tra tiến trình đồng bộ DB...");
            } else {
                console.error("Failed to sync DB:", error);
                message.error(`Đồng bộ DB thất bại: ${error.response?.data?.message || error.message}`);
                return; // Thoát nếu không phải 409
            }
        }
        
        // Bắt đầu poll progress (kể cả khi 409)
        let lastUpdateTime = 0;
        const UPDATE_THROTTLE = 1000; // Chỉ update UI mỗi 1 giây
        let isPolling = true;
            
            const pollProgress = async () => {
                if (!isPolling) return;
                
                try {
                    const progress = await getBulkCreateProgressApi(historyId);
                    const now = Date.now();
                    
                    // Throttle update để tránh update quá nhanh
                    if (now - lastUpdateTime < UPDATE_THROTTLE && 
                        progress.status !== "completed" && 
                        progress.status !== "failed") {
                        // Schedule next poll
                        if (isPolling) {
                            progressIntervalRefs.current[historyId] = setTimeout(pollProgress, 2000);
                        }
                        return;
                    }
                    lastUpdateTime = now;
                    
                    // Sử dụng requestAnimationFrame để update mượt mà và batch updates
                    requestAnimationFrame(() => {
                        setSyncProgressMap(prev => {
                            const current = prev[historyId];
                            // So sánh để chỉ update khi có thay đổi
                            if (current && 
                                current.processed === progress.processed && 
                                current.status === progress.status &&
                                current.success === progress.success &&
                                current.failed === progress.failed &&
                                current.progress_percentage === progress.progress_percentage) {
                                return prev; // Không thay đổi, tránh re-render
                            }
                            // Tạo object mới chỉ khi cần thiết
                            return {
                                ...prev,
                                [historyId]: { ...progress }
                            };
                        });
                    });
                    
                    // Nếu đã hoàn thành hoặc thất bại, dừng polling
                    if (progress.status === "completed" || progress.status === "failed") {
                        isPolling = false;
                        if (progressIntervalRefs.current[historyId]) {
                            clearTimeout(progressIntervalRefs.current[historyId]);
                            delete progressIntervalRefs.current[historyId];
                        }
                        
                        if (progress.status === "completed") {
                            message.success("Đồng bộ DB thành công!");
                        } else {
                            message.error("Đồng bộ DB thất bại!");
                        }
                        
                        // Refresh danh sách sau 2 giây
                        setTimeout(() => {
                            setSyncProgressMap(prev => {
                                const newMap = { ...prev };
                                delete newMap[historyId];
                                return newMap;
                            });
                            fetchUploadHistory();
                        }, 2000);
                    } else {
                        // Schedule next poll
                        if (isPolling) {
                            progressIntervalRefs.current[historyId] = setTimeout(pollProgress, 3000);
                        }
                    }
                } catch (error) {
                    console.error("Failed to get progress:", error);
                    // Retry sau 3 giây nếu có lỗi
                    if (isPolling) {
                        progressIntervalRefs.current[historyId] = setTimeout(pollProgress, 3000);
                    }
                }
            };
            
            // Bắt đầu poll
            pollProgress();
    };

    // Cleanup intervals khi component unmount
    useEffect(() => {
        return () => {
            Object.values(progressIntervalRefs.current).forEach(timeout => {
                clearTimeout(timeout);
            });
        };
    }, []);

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
            case "failed":
                return "red";
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
            case "failed":
                return "Thất bại";
            default:
                return status;
        }
    };

    // Component Progress riêng với memo để tránh re-render không cần thiết
    const ProgressCell = memo(({ progress }: { progress: BulkCreateProgressResponse }) => {
        const processed = progress.processed ?? 0;
        const total = progress.total ?? 0;
        const success = progress.success ?? 0;
        const failed = progress.failed ?? 0;
        
        const progressPercent = useMemo(() => {
            return progress.progress_percentage || 
                (total > 0 ? Math.round((processed / total) * 100) : 0);
        }, [progress.progress_percentage, processed, total]);

        const formatText = useMemo(() => `${processed}/${total}`, [processed, total]);
        const statusText = useMemo(() => `✓ ${success} | ✗ ${failed}`, [success, failed]);

        return (
            <div className="w-full min-w-[250px]">
                <Progress 
                    percent={progressPercent}
                    status={progress.status === "failed" ? "exception" : "active"}
                    format={() => formatText}
                />
                <div className="mt-1 text-xs text-gray-500 whitespace-nowrap">
                    {statusText}
                </div>
            </div>
        );
    }, (prevProps, nextProps) => {
        // Custom comparison để chỉ re-render khi thực sự thay đổi
        return (
            prevProps.progress.processed === nextProps.progress.processed &&
            prevProps.progress.status === nextProps.progress.status &&
            prevProps.progress.success === nextProps.progress.success &&
            prevProps.progress.failed === nextProps.progress.failed &&
            prevProps.progress.total === nextProps.progress.total
        );
    });
    ProgressCell.displayName = 'ProgressCell';

    // Memoize columns để tránh re-create mỗi lần render
    const columns = useMemo(() => [
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
            title: 'Tiến trình',
            key: 'progress',
            width: 300,
            render: (_: any, record: TableUploadHistory) => {
                const progress = syncProgressMap[record.fileUploadHistoryId];
                if (!progress) {
                    return null;
                }
                return <ProgressCell progress={progress} />;
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableUploadHistory) => {
                const isPending = record.status === "pending";
                const isSyncDB = record.status === "sync_db";
                const isSyncBlockchain = record.status === "sync_blockchain";
                const isFailed = record.status === "failed";
                
                // Disable "Sync DB" khi đã sync DB, đã sync blockchain, hoặc failed
                const isSyncDBDisabled = isSyncDB || isSyncBlockchain || isFailed;
                // Disable "Sync Blockchain" khi đã sync blockchain hoặc failed
                const isSyncBlockchainDisabled = isSyncBlockchain || isFailed;

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
    ], [syncProgressMap]);

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
                        { value: "failed", label: "Đồng bộ failed" },
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
                rowKey="fileUploadHistoryId"
            />
        </div>
    )
}
