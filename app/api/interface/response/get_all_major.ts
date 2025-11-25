export interface major {
    major_id: string,
    name: string,
    founding_date: string,
    department_id: string,
    create_at: string,
    update_at: string,
}

export interface majorsResponse {
    majors: major[],
}