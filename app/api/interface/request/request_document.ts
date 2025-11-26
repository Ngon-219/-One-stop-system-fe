export interface RequestDocumentRequest {
    document_type_id: string;
    authenticator_code: string;
    metadata?: Record<string, any>;
    certificate_id?: string;
}

