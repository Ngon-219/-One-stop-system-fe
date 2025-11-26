import { RequestResponse } from "./request";

export interface ScheduleRequestResponse {
    success: boolean;
    message: string;
    request: RequestResponse;
}

