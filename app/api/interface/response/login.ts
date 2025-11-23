export interface LoginResponse {
    status_code: number,
    access_token?: string,
    email?: string,
    expires_in?: string,
    role?: string,
    user_id?: string,
    message: string,
}