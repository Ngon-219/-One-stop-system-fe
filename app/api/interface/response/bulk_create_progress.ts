export interface BulkCreateProgressResponse {
    history_file_upload_id: string;
    status: string;
    total: number;
    processed: number;
    success: number;
    failed: number;
    progress_percentage?: number;
    message?: string;
}

