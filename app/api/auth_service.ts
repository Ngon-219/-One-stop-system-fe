import axios from "axios";
import { LoginRequest } from "./interface/request/login";
import { LoginResponse } from "./interface/response/login";
import { parseAndFormatMessage } from "../utils/messageParser";
import { ProfileResponse } from "./interface/response/profile";
import { getCookie } from "./helper";
import { LogoutResponse } from "./interface/response/logout";

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