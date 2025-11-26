export interface DocumentType {
    document_type_id: string;
    document_type_name: string;
    description: string;
    template_pdf: string | null; // JSON template của pdfme
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface GetDocumentTypesResponse {
    documentTypes: DocumentType[];
}

