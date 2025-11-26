import { Pagination } from "./pagination";

export interface gettUploadHistoryReq extends Pagination {
    status ?: string,
    userId ?: string,
}