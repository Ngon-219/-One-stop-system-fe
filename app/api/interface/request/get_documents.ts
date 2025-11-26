import { DocumentStatus } from "../response/get_documents";

export interface GetDocumentsRequest {
    page?: number;
    limit?: number;
    status?: DocumentStatus;
    sort?: "created_at" | "updated_at" | "issued_at";
    order?: "ASC" | "DESC";
}

