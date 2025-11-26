export type RequestStatus = 
    | "Pending"
    | "Scheduled";

export interface RequestResponse {
    request_id: string;
    user_id: string;
    content: string;
    status: RequestStatus;
    scheduled_at?: string;
    created_at: string;
    updated_at: string;
}

export interface RequestListResponse {
    requests: RequestResponse[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

