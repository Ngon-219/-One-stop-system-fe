export interface TimeSeriesPoint {
    date: string;
    count: number;
}

export interface UserStatsResponse {
    total_users: number;
    total_students: number;
    total_managers: number;
    total_teachers: number;
    total_admins: number;
    users_per_day: TimeSeriesPoint[];
}

export interface DocumentStatsResponse {
    total_documents: number;
    signed_documents: number;
    failed_documents: number;
    documents_per_day: TimeSeriesPoint[];
}


