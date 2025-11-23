import axios from "axios";
import { LoginRequest } from "./interface/request/login";
import { LoginResponse } from "./interface/response/login";
import { parseAndFormatMessage } from "../utils/messageParser";

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
            token_type: response.data.token_type,
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