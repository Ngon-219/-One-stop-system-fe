export interface DepartmentResponse {
    department_id: string;
    name: string;
    founding_date: string;
    dean: string;
    create_at: string;
    update_at: string;
}

export interface DepartmentListResponse {
    departments: DepartmentResponse[];
    total: number;
}


