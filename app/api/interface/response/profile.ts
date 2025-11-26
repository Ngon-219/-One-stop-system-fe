export interface ProfileUser {
    user_id: string;
    first_name: string;
    last_name: string;
    address: string;
    email: string;
    phone_number: string;
    cccd: string;
    is_priority: boolean;
    is_first_login: boolean;
    role: string;
    status: string;
    student_code: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileWallet {
    wallet_id: string;
    address: string;
    chain_type: string;
    public_key: string;
    status: string;
    network_id: string;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileMajor {
    major_id: string;
    name: string;
    department_id: string;
    founding_date: string;
    created_at: string;
    updated_at: string;
}

export interface ProfileDepartment {
    department_id: string;
    name: string;
    dean: string;
    founding_date: string;
    created_at: string;
    updated_at: string;
}

export interface ProfileResponse {
    user: ProfileUser;
    wallet: ProfileWallet | null;
    majors: ProfileMajor[];
    departments: ProfileDepartment[];
    blockchain_role: number;
    is_active: boolean;
}