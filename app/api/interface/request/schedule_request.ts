export interface ScheduleRequestRequest {
    scheduled_at: string; // Format: YYYY-MM-DDTHH:MM:SS
    message?: string;
    authenticator_code?: string;
}

