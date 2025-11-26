export interface MajorResponse {
    major_id: string;
    name: string;
    founding_date: string;
    department_id: string | null;
    create_at: string;
    update_at: string;
}

export interface MajorListResponse {
    majors: MajorResponse[];
    total: number;
}


