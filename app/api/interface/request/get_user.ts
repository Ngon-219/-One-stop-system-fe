import { Pagination } from "./pagination";

export interface getUserPaginationReq extends Pagination {
    role?: string,
    search?: string,
}