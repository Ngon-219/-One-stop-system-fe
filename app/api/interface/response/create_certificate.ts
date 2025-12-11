export interface CertificateItem {
    certificate_name: string;
    document_type_name: string;
    issued_date: string;
    expiry_date?: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface CreateCertificateResponse {
    success: boolean;
    message: string;
    certificate?: CertificateItem;
}

