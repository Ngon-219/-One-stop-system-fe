export interface CreateCertificateRequest {
    user_email: string;
    document_type_id: string;
    certificate_name: string;
    issued_date: string; // Format: YYYY-MM-DD
    expiry_date?: string; // Format: YYYY-MM-DD
    description?: string;
    metadata?: Record<string, any>;
}

