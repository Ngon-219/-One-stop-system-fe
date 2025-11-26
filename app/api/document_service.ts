import axios from "axios";
import { GetDocumentsRequest } from "./interface/request/get_documents";
import { RequestDocumentRequest } from "./interface/request/request_document";
import { DocumentResponse, PaginatedDocumentsResponse } from "./interface/response/get_documents";
import { CertificateResponse } from "./interface/response/certificates";
import { getCookie, handleUnauthorized } from "./helper";

export const getDocumentsApi = async (
    params: GetDocumentsRequest = {}
): Promise<PaginatedDocumentsResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL("/api/v1/documents/all", baseUrl);
    console.log("documents service url: ", url);

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (params.status) {
        searchParams.set("status", params.status);
    }

    if (params.sort) {
        searchParams.set("sort", params.sort);
    }

    if (params.order) {
        searchParams.set("order", params.order);
    }

    url.search = searchParams.toString();

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const getDocumentByIdApi = async (
    documentId: string
): Promise<DocumentResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL(`/api/v1/documents/${documentId}`, baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const rejectDocumentApi = async (
    documentId: string,
    reason: string
): Promise<DocumentResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL(`/api/v1/documents/${documentId}/reject`, baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.put(
            url.toString(),
            { reason },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const approveDocumentApi = async (
    documentId: string,
    authenticatorCode: string,
    jsonTemplate: string
): Promise<DocumentResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL(`/api/v1/documents/${documentId}/approve`, baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.post(
            url.toString(),
            {
                authenticator_code: authenticatorCode,
                json_template: jsonTemplate,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            console.log("error", error);
            handleUnauthorized();
        }
        throw error;
    }
};

export const revokeDocumentApi = async (
    documentId: string
): Promise<DocumentResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL(`/api/v1/documents/${documentId}/revoke`, baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.put(
            url.toString(),
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const requestDocumentApi = async (
    payload: RequestDocumentRequest
): Promise<DocumentResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL("/api/v1/documents/request", baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.post(
            url.toString(),
            {
                document_type_id: payload.document_type_id,
                authenticator_code: payload.authenticator_code,
                metadata: payload.metadata,
                certificate_id: payload.certificate_id,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const getMyDocumentsApi = async (
    params: GetDocumentsRequest = {}
): Promise<PaginatedDocumentsResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL("/api/v1/documents/my", baseUrl);

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (params.status) {
        searchParams.set("status", params.status);
    }

    if (params.sort) {
        searchParams.set("sort", params.sort);
    }

    if (params.order) {
        searchParams.set("order", params.order);
    }

    url.search = searchParams.toString();

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error: any) {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

export const getPublicDocumentInfoApi = async (
    documentId: string
): Promise<any> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    const url = new URL(`/api/v1/documents/public/${documentId}`, baseUrl);

    try {
        const response = await axios.get(url.toString());
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const getCertificatesApi = async (
    documentTypeId?: string
): Promise<CertificateResponse[]> => {
    const baseUrl = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "";
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_DOCUMENT_SERVICE_URL is not set");
    }
    
    const url = new URL("/api/v1/documents/certificates", baseUrl);

    if (documentTypeId) {
        url.searchParams.set("document_type_id", documentTypeId);
    }

    console.log("getCertificatesApi - URL:", url.toString());
    console.log("getCertificatesApi - baseUrl:", baseUrl);

    const accessToken = getCookie("huce_access_token");

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error: any) {
        console.error("getCertificatesApi error:", {
            url: url.toString(),
            baseUrl,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.response?.data?.message || error.message,
        });
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === "Unauthorized"
        ) {
            handleUnauthorized();
        }
        throw error;
    }
};

