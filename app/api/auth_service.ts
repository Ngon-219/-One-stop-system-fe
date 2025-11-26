import axios from "axios";
import { LoginRequest } from "./interface/request/login";
import { LoginResponse } from "./interface/response/login";
import { parseAndFormatMessage } from "../utils/messageParser";
import { ProfileResponse } from "./interface/response/profile";
import { getCookie } from "./helper";
import { LogoutResponse } from "./interface/response/logout";
import { getUserPaginationReq } from "./interface/request/get_user";
import { GetUserPaginationResponse } from "./interface/response/get_user_pagination";
import { error } from "console";
import { DeleteUserResponse } from "./interface/response/delete_user";
import { majorsResponse } from "./interface/response/get_all_major";
import { createNewUserReq } from "./interface/request/create_new_user";
import { createNewUserRes } from "./interface/response/create_new_user";
import { gettUploadHistoryReq } from "./interface/request/upload_history";
import { GetUploadHistoryResponse } from "./interface/response/get_upload_history";

export const loginNotMfaApi = async (request: LoginRequest) => {
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let auth_url = `${baseUrl}/api/v1/auth/login`;
    console.log("Auth URL:", auth_url);
    const requestBody: any = {
        email: request.email,
        password: request.password,
    };
    
    if (request.authenticatorCode && request.authenticatorCode.trim() !== "") {
        requestBody.authenticatorCode = request.authenticatorCode;
    }
    
    let response = await axios.post(auth_url, requestBody)
    .then(response => {
        let res: LoginResponse = {
            status_code: 200,
            access_token: response.data.access_token,
            email: response.data.email,
            expires_in: response.data.expires_in,
            role: response.data.role,
            user_id: response.data.user_id,
            message: "Login successfull",
        };
        return res;
    })
    .catch(error => {
        console.log("Error login message: ", error);
        if (error.response.data == "MFA is enabled. Please provide authenticator_code") {
            let res: LoginResponse = {
                status_code: 400,
                message: "MFA is enabled. Please provide authenticator code",
            }
            return res;
        }

        const formattedMessage = parseAndFormatMessage(error.response.data);
        console.log("formated message: ", formattedMessage);
        
        let res: LoginResponse = {
            status_code: 401,
            message: formattedMessage,   
        };
        return res;
    })

    return response;
}

export const profileApi = async () => {
    let access_token = getCookie("huce_access_token")
    console.log("Access token: ", access_token);
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + "/api/v1/profile";

    console.log("base url: ", url);

    let response = await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(response => {
        let res: ProfileResponse = {
            user_id: response.data.user_id,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            email: response.data.email,
            role: response.data.role,
            wallet_address: response.data.wallet_address,
            blockchain_role: response.data.blockchain_role,
            is_active: response.data.is_active
        }
        return res;
    })
    .catch(error => {
        console.log("Error login message: ", error);
        throw error;
    })

    return response;
}

export const logoutApi = async () => {
    let accessToken = getCookie("huce_access_token");
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + "/api/v1/auth/logout";

    let response = axios.post(url, {}, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        let res: LogoutResponse = {
            status_code: response.status,
            message: "Log out successully"
        };
        return res;
    })
    .catch(err => {
        let res: LogoutResponse = {
            status_code: err.response.status,
            message: err.response.data
        };
        return res;
    })

    return response;
}

export const getUserPagination = async (req: getUserPaginationReq) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + `/api/v1/users?page=${req.page}&page_size=${req.limit}`;
    let access_token = getCookie("huce_access_token");
    
    if (req.role) {
        url += `&role=${req.role}`;
    }

    if (req.search) {
        url += `&search=${req.search}`;
    }
    
    let response = await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(response => {
        let res: GetUserPaginationResponse = {
            users: response.data.users,
            total: response.data.total,
            page: response.data.page,
            page_size: response.data.page_size
        }
        return res;
    })
    .catch(error => {
        console.error(error);
        let res: GetUserPaginationResponse = {
            users: [],
            total: 0,
            page: 0,
            page_size: 0
        }
        return res;
    });

    return response;
}

export const deleteUserApi = async (user_id: string) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + `/api/v1/users/${user_id}`;
    let access_token = getCookie("huce_access_token");

    let response = await axios.delete(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(response => {
        let res: DeleteUserResponse = {
            status_code: response.status,
            message: "User deleted successfully"
        }
        return res;
    })
    .catch(error => {
        console.error(error);
        let res: DeleteUserResponse = {
            status_code: error.response.status,
            message: error.response.data
        }
        return res;
    })

    return response;
}

export const getAllMajor = async () => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + `/api/v1/majors`;
    let access_token = getCookie("huce_access_token");

    let response = await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(res => {
        let response: majorsResponse = {
            majors: res.data.majors
        }
        return response;
    })
    .catch(error => {
        console.error(error);
        let response: majorsResponse = {
            majors: []
        } 
        return response;
    })
    
    return response;
}

export const createNewUserApi = async (req: createNewUserReq) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let url = baseUrl + "/api/v1/users";
    let access_token = getCookie("huce_access_token");

    let response = await axios.post(url, {
        address: req.address,
        cccd: req.cccd,
        email: req.email,
        first_name: req.first_name,
        last_name: req.last_name,
        major_ids: req.major_ids,
        password: req.password,
        phone_number: req.phone_number,
        role: req.role,
    }, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(res => {
        let response: createNewUserRes = {
            statusCode: res.status,
            message: "Vui lòng đợi đến khi có thông báo thành công!"
        };
        return response;
    })
    .catch(err => {
        let response: createNewUserRes = {
            statusCode: 500,
            message: err.response.data
        }
        return response;
    })
    return response;
}

export const getUploadHistoryApi = async (req: gettUploadHistoryReq) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let user_id = getCookie("huce_user_id");
    let url = baseUrl + `/api/v1/upload/history?page=${req.page}&pageSize=${req.limit}&userId=${user_id}`;
    
    if (req.status) {
        url += `&status=${req.status}`;
    }

    let response = await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    })
    .then(response => {
        let res: GetUploadHistoryResponse = {
            fileUploads: response.data.fileUploads,
            total: response.data.total,
            page: response.data.page,
            pageSize: response.data.pageSize,
            totalPages: response.data.totalPages,
        };
      return res;  
    })
    .catch(err => {
        console.error("Failed to get upload history api: ", err);
        let res: GetUploadHistoryResponse = {
            fileUploads: [],
            total: 0,
            page: 0,
            pageSize: 0,
            totalPages: 0,
        }
        return res;
    })

    return response;
}

export const uploadChunkApi = async (
    fileName: string,
    chunkNumber: number,
    totalChunks: number,
    chunk: Blob
) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let url = baseUrl + "/api/v1/upload/chunk";

    const formData = new FormData();
    formData.append('fileName', fileName);
    formData.append('chunkNumber', String(chunkNumber));
    formData.append('totalChunks', String(totalChunks));
    formData.append('chunk', chunk, `${fileName}.part${chunkNumber}`);

    try {
        const response = await axios.post(url, formData, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "multipart/form-data",
            },
            
            skipLoadingInterceptor: true,
        } as any);
        return response.data;
    } catch (error: any) {
        console.error("Failed to upload chunk:", error);
        throw error;
    }
}

export const syncDBApi = async (historyFileUploadId: string) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let url = baseUrl + "/api/v1/users/bulk";

    try {
        const response = await axios.post(url, {
            history_file_upload_id: historyFileUploadId,
        }, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            skipLoadingInterceptor: true,
        } as any);
        return response.data;
    } catch (error: any) {
        console.error("Failed to sync DB:", error);
        throw error;
    }
}

export const getBulkCreateProgressApi = async (historyFileUploadId: string) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let url = baseUrl + `/api/v1/users/bulk/create-progress/${historyFileUploadId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
            skipLoadingInterceptor: true,
        } as any);
        
        // Log để debug
        console.log("Progress API response:", response.data);
        
        // Đảm bảo các field có giá trị mặc định nếu undefined
        const data = response.data || {};
        return {
            history_file_upload_id: data.history_file_upload_id || historyFileUploadId,
            status: data.status || "pending",
            total: data.total ?? 0,
            processed: data.processed ?? 0,
            success: data.success ?? 0,
            failed: data.failed ?? 0,
            progress_percentage: data.progress_percentage,
            message: data.message,
        };
    } catch (error: any) {
        console.error("Failed to get bulk create progress:", error);
        throw error;
    }
}

export const syncBlockchainApi = async (historyFileUploadId: string) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let url = baseUrl + "/api/v1/users/bulk/activate-blockchain";

    try {
        const response = await axios.post(url, {
            history_file_upload_id: historyFileUploadId,
        }, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            skipLoadingInterceptor: true,
        } as any);
        return response.data;
    } catch (error: any) {
        // Không log error khi 409 vì đây là trường hợp bình thường (đã sync rồi)
        if (error.response?.status !== 409) {
            console.error("Failed to sync blockchain:", error);
        }
        throw error;
    }
}

export const getBlockchainProgressApi = async (historyFileUploadId: string) => {
    let baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    let access_token = getCookie("huce_access_token");
    let url = baseUrl + `/api/v1/users/bulk/blockchain-progress/${historyFileUploadId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
            skipLoadingInterceptor: true,
        } as any);
        
        // Log để debug
        console.log("Blockchain Progress API response:", response.data);
        
        // Đảm bảo các field có giá trị mặc định nếu undefined
        const data = response.data || {};
        return {
            history_file_upload_id: data.history_file_upload_id || historyFileUploadId,
            status: data.status || "pending",
            total: data.total ?? 0,
            processed: data.processed ?? 0,
            success: data.success ?? 0,
            failed: data.failed ?? 0,
            progress_percentage: data.progress_percentage,
            message: data.message,
        };
    } catch (error: any) {
        console.error("Failed to get blockchain progress:", error);
        throw error;
    }
}