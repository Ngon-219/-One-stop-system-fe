export interface LoginResponse {
    status_code: number,
    access_token?: string,
    email?: string,
    expires_in?: string,
    role?: string,
    token_type?: string
    user_id?: string,
    message: string,
}