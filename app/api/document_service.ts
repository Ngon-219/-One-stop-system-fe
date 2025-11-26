import axios from "axios";
import { GetDocumentsRequest } from "./interface/request/get_documents";
import { DocumentResponse, PaginatedDocumentsResponse } from "./interface/response/get_documents";
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

