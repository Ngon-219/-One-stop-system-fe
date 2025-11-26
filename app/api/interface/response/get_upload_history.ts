export interface FileUploadHistoryItem {
    fileUploadHistoryId: string;
    userId: string;
    fileName: string;
    status: string;
    createdAt: string;
}

export interface GetUploadHistoryResponse {
    fileUploads: FileUploadHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

