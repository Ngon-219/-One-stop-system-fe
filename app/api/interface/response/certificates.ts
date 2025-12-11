export interface CertificateResponse {
    certificate_id: string;
    document_type_id: string;
    document_type_name: string;
    certificate_name: string;
    issued_date: string;
    expiry_date?: string;
    description?: string;
    metadata?: Record<string, any>;
}

