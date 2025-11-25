"use client" 
import { getUserPagination } from "@/app/api/auth_service";
import { getUserPaginationReq } from "@/app/api/interface/request/get_user";
import { GetUserPaginationResponse, User } from "@/app/api/interface/response/get_user_pagination";
import NavBar from "@/app/components/navbar"
import { Table, Button, Tooltip, Input, Select } from 'antd';
import { useEffect, useState } from "react";
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import { deleteUserApi } from "@/app/api/auth_service";
import { DeleteUserResponse } from "@/app/api/interface/response/delete_user";
import { useRouter } from "next/navigation";

interface TableUser {
    studentCode: string;
    key: string;
    userID: string;
    fullname: string;
    address: string;
    email: string;
    major: string;
}

export default function UserManagePage() {
    let [dataSource, setDataSource] = useState<TableUser[]>([]);
    let [currentPage, setCurrentPage] = useState<number>(1);
    let [pageSize, setPageSize] = useState<number>(10);
    let [total, setTotal] = useState<number>(0);
    let [searchValue, setSearchValue] = useState<string>("");
    let [loading, setLoading] = useState<boolean>(false);
    let [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
    const router = useRouter();

    const fetchUsers = async (params?: { limit?: number; page?: number; search?: string; role?: string }) => {
        const {
            limit = pageSize,
            page = currentPage,
            search = searchValue,
            role = selectedRole,
        } = params ?? {};
        let req: getUserPaginationReq = {
            limit: limit,
            page: page,
        };

        if (search.trim()) {
            req.search = search.trim();
        }

        if (role && role !== "ALL") {
            req.role = role;
        }

        setLoading(true);
        try {
            let response: GetUserPaginationResponse = await getUserPagination(req);
        
            const formated_users = response.users.map((user: User) => {
                return {
                    key: user.user_id,
                    userID: user.user_id,
                    fullname: `${user.first_name} ${user.last_name}`.trim(),
                    address: user.address,
                    email: user.email,
                    major: user.major_names.join(", ").trim(),
                    studentCode: user.student_code,
                }
            });

            setTotal(response.total);
            setCurrentPage(response.page);
            setPageSize(response.page_size);
            
            setDataSource(formated_users);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [])

    const handleAction = (item: TableUser) => {
        console.log("ID ẩn là:", item.userID); 
    };


    const handleDelete = async (item: TableUser) => {
        Swal.fire({
            title: "Hành động nguy hiểm",
            text: "Sau khi xóa người dùng, bạn không thể revert!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Xác nhận"
        }).then(async (result) => {
            if (result.isConfirmed) {
                let res: DeleteUserResponse = await deleteUserApi(item.userID);
                if (res.status_code == 200) {
                    fetchUsers();
                    Swal.fire({
                        title: "Deleted!",
                        text: res.message,
                        icon: "success"
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Delete Failed",
                        text: res.message + "!",
                    });
                }
            }
        });
    };

    const columns = [
        {
            title: 'MSV',
            dataIndex: 'studentCode',
            key: 'studentCode',
        },
        {
          title: 'Họ và tên',
          dataIndex: 'fullname',
          key: 'fullname',
        },
        {
          title: 'Địa chỉ',
          dataIndex: 'address',
          key: 'address',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Chuyên ngành',
            dataIndex: 'major',
            key: 'major',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableUser) => (
                <Tooltip title="Chi tiết">
                    <Button 
                        type="text"
                        icon={<EyeOutlined style={{ color: '#1890ff' }} />} // Đổi màu icon cho nổi
                        onClick={() => handleAction(record)} 
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableUser) => (
                <Tooltip title="Chi tiết">
                    <Button 
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleAction(record)} 
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: TableUser) => (
                <Tooltip title="Chi tiết">
                    <Button 
                        type="text"
                        icon={<DeleteOutlined style={{ color: '#eb4f34' }} />}
                        onClick={() => handleDelete(record)} 
                    />
                </Tooltip>
            ),
        },
      ];

    const handleSearch = (value: string) => {
        const sanitizedValue = value.trim();
        setSearchValue(value);
        fetchUsers({ page: 1, search: sanitizedValue, limit: pageSize, role: selectedRole });
    };

    const handleSearchInputChange = (value: string) => {
        setSearchValue(value);
        if (!value.trim()) {
            fetchUsers({ page: 1, search: "", limit: pageSize, role: selectedRole });
        }
    };

    const handleRoleChange = (value: string) => {
        const roleValue = value === "ALL" ? undefined : value;
        setSelectedRole(roleValue);
        fetchUsers({ page: 1, search: searchValue.trim(), role: roleValue, limit: pageSize });
    };

    const handleAddUser = () => {
        console.log("handleAddUser called");
        router.push("/manager/create-user");
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <div className="w-[90vw] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <Select
                    placeholder="Lọc theo vai trò"
                    className="w-full sm:w-60"
                    value={selectedRole ?? "ALL"}
                    onChange={handleRoleChange}
                    options={[
                        { value: "ALL", label: "Tất cả" },
                        { value: "Student", label: "Student" },
                        { value: "Admin", label: "Admin" },
                        { value: "Manager", label: "Manager" },
                        { value: "Teacher", label: "Teacher" },
                    ]}
                />
                <Input.Search
                    allowClear
                    placeholder="Tìm kiếm theo tên, email hoặc MSV"
                    enterButton="Tìm"
                    value={searchValue}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onSearch={handleSearch}
                    className="w-full sm:w-auto"
                />
            </div>
            <div className="w-[90vw] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <Button type="primary" onClick={handleAddUser} className="w-full sm:w-auto">
                        Thêm người dùng
                </Button>
            </div>
            <Table 
                dataSource={dataSource}
                columns={columns}
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: (page: number, newPageSize: number) => {
                        fetchUsers({ limit: newPageSize, page, search: searchValue.trim(), role: selectedRole });
                    },
                }}
                className="w-[90vw] rounded-3xl shadow-xl"
                scroll={{ x: 1000 }}
                />
        </div>
    )
}