import { Template } from "@pdfme/common";
import { DocumentType } from "./get_document_types";

export type DocumentStatus =
    | "draft"
    | "pending_approval"
    | "approved"
    | "pending_blockchain"
    | "minted"
    | "rejected"
    | "revoked"
    | "failed";

export interface DocumentResponse {
    document_id: string;
    user_id: string;
    issuer_id: string | null;
    document_type_id: string;
    blockchain_doc_id?: string | null;
    token_id?: string | null;
    tx_hash?: string | null;
    contract_address: string;
    ipfs_hash?: string | null;
    document_hash?: string | null;
    metadata?: Record<string, any> | null;
    status: DocumentStatus | string;
    is_valid: boolean;
    issued_at?: string | null;
    verified_at?: string | null;
    created_at: string;
    updated_at: string;
    documentType?: DocumentType;
    pdf_schema?: PdfSchemaPayload | null;

    // Optional extra fields from backend
    pdf_ipfs_hash?: string | null;
}

export interface PaginatedDocumentsResponse {
    data: DocumentResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PdfSchemaPayload {
    template: Template;
    inputs: Array<Record<string, any>>;
}

