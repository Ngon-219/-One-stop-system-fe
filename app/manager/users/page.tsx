"use client" 
import { getUserPagination } from "@/app/api/auth_service";
import { getUserPaginationReq } from "@/app/api/interface/request/get_user";
import { GetUserPaginationResponse, User } from "@/app/api/interface/response/get_user_pagination";
import NavBar from "@/app/components/navbar"
import { Table, Button, Tooltip } from 'antd';
import { useEffect, useState } from "react";
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import { deleteUserApi } from "@/app/api/auth_service";
import { DeleteUserResponse } from "@/app/api/interface/response/delete_user";

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

    const fetchUsers = async (limit: number = 10, page: number = 1) => {
        let req: getUserPaginationReq = {
            limit: limit,
            page: page
        };
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

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <Table 
                dataSource={dataSource}
                columns={columns}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: (page: number, pageSize: number) => {
                        fetchUsers(pageSize, page);
                    },
                }}
                className="w-[90vw] rounded-3xl shadow-xl"/>
        </div>
    )
}