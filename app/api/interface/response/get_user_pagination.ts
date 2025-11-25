export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  cccd: string;
  phone_number: string;
  role: string;
  is_priority: boolean;
  is_first_login: boolean;
  wallet_address: string;
  major_ids: string[];
  created_at: string;
  updated_at: string;
  major_names: string[];
  student_code: string;
}

export interface GetUserPaginationResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

