"use client" 
import { getUserPagination, deleteUserApi, getUserDetailApi, updateUserApi, getAllMajor } from "@/app/api/auth_service";
import { getUserPaginationReq } from "@/app/api/interface/request/get_user";
import { GetUserPaginationResponse, User } from "@/app/api/interface/response/get_user_pagination";
import { GetUserDetailResponse } from "@/app/api/interface/response/get_user_detail";
import { UpdateUserRequest } from "@/app/api/interface/request/update_user";
import { UpdateUserResponse } from "@/app/api/interface/response/update_user";
import { major } from "@/app/api/interface/response/get_all_major";
import NavBar from "@/app/components/navbar"
import ManagerNavBar from "@/app/components/manager-navbar"
import { Table, Button, Tooltip, Input, Select, Modal, Descriptions, Tag, Spin, Form } from 'antd';
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import { DeleteUserResponse } from "@/app/api/interface/response/delete_user";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/hooks/useSocket";
import { extractDataFromRaw } from "../create-user/page";
import { notification } from "antd";

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
    const [api, contextHolder] = notification.useNotification();
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [userDetail, setUserDetail] = useState<GetUserDetailResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<GetUserDetailResponse | null>(null);
    const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
    const [majors, setMajors] = useState<major[]>([]);
    const [loadingMajors, setLoadingMajors] = useState<boolean>(false);
    const [editForm] = Form.useForm();

    // Lưu api vào ref để tránh stale closure
    const apiRef = useRef(api);
    useEffect(() => {
        apiRef.current = api;
    }, [api]);

    // Sử dụng useCallback để tạo stable callback
    const handleSocketEvent = useCallback((data: any) => {
        console.log("Received event:", data);
        console.log("Event data type:", typeof data);
        console.log("Event data:", JSON.stringify(data));
        
        const formatted_data = extractDataFromRaw(data);
        console.log("Formatted data:", formatted_data);
        
        if (formatted_data) {
            const isSuccess = formatted_data.status === "success";
            const message = isSuccess 
                ? `Người dùng ${formatted_data.email} đã được tạo thành công!`
                : `Tạo người dùng ${formatted_data.email} thất bại!`;
            
            // Sử dụng setTimeout để đưa notification ra khỏi render phase
            setTimeout(() => {
                if (isSuccess) {
                    apiRef.current.success({
                        title: `Thông báo tạo người dùng`,
                        description: message,
                        placement: 'bottomRight',
                    });
                } else {
                    apiRef.current.error({
                        title: `Thông báo tạo người dùng`,
                        description: message,
                        placement: 'bottomRight',
                    });
                }
            }, 0);
        } else {
            console.log("formatted_data is null, cannot show notification");
        }
    }, []);

    useSocket({
        onEvent: handleSocketEvent
    });

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
        fetchMajors();
    }, []);

    const fetchMajors = async () => {
        setLoadingMajors(true);
        try {
            const response = await getAllMajor();
            if (response?.majors) {
                setMajors(response.majors);
            }
        } catch (err) {
            console.error("Failed to load majors", err);
        } finally {
            setLoadingMajors(false);
        }
    };

    const majorOptions = useMemo(
        () => majors.map((m) => ({ label: m.name, value: m.major_id })),
        [majors]
    );

    const handleAction = async (item: TableUser) => {
        setIsModalVisible(true);
        setLoadingDetail(true);
        setUserDetail(null);
        
        try {
            const detail = await getUserDetailApi(item.userID);
            setUserDetail(detail);
        } catch (error) {
            console.error("Failed to fetch user detail:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải thông tin chi tiết người dùng!",
            });
            setIsModalVisible(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setUserDetail(null);
    };

    const handleEdit = async (item: TableUser) => {
        setIsEditModalVisible(true);
        setLoadingEdit(true);
        setEditingUser(null);
        
        try {
            const detail = await getUserDetailApi(item.userID);
            setEditingUser(detail);
            // Pre-fill form
            editForm.setFieldsValue({
                first_name: detail.first_name,
                last_name: detail.last_name,
                email: detail.email,
                phone_number: detail.phone_number,
                cccd: detail.cccd,
                address: detail.address,
                major_ids: detail.major_ids,
                role: detail.role,
            });
        } catch (error) {
            console.error("Failed to fetch user detail:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải thông tin người dùng!",
            });
            setIsEditModalVisible(false);
        } finally {
            setLoadingEdit(false);
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalVisible(false);
        setEditingUser(null);
        editForm.resetFields();
    };

    const handleEditSubmit = async (values: any) => {
        if (!editingUser) return;

        // Xác nhận với Swal
        const result = await Swal.fire({
            title: "Xác nhận chỉnh sửa",
            text: "Bạn có chắc chắn muốn cập nhật thông tin người dùng này?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy"
        });

        if (!result.isConfirmed) {
            return;
        }

        setLoadingEdit(true);
        try {
            const updateData: UpdateUserRequest = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                phone_number: values.phone_number,
                cccd: values.cccd,
                address: values.address,
                major_ids: values.major_ids,
                role: values.role || null,
            };

            // Chỉ gửi password nếu có thay đổi
            if (values.password && values.password.trim() !== "") {
                updateData.password = values.password;
            }

            await updateUserApi(editingUser.user_id, updateData);
            
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Cập nhật thông tin người dùng thành công!",
            });

            handleCloseEditModal();
            fetchUsers(); // Refresh danh sách
        } catch (error: any) {
            console.error("Failed to update user:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.response?.data?.message || "Không thể cập nhật thông tin người dùng!",
            });
        } finally {
            setLoadingEdit(false);
        }
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
                <div>
                    <Tooltip title="Chi tiết">
                    <Button 
                        type="text"
                        icon={<EyeOutlined style={{ color: '#1890ff' }} />} // Đổi màu icon cho nổi
                        onClick={() => handleAction(record)} 
                    />
                </Tooltip>
                 <Tooltip title="Chỉnh sửa">
                     <Button 
                         type="text"
                         icon={<EditOutlined style={{ color: '#1890ff' }} />}
                         onClick={() => handleEdit(record)} 
                     />
                 </Tooltip>
                <Tooltip title="Xóa">
                    <Button 
                        type="text"
                        icon={<DeleteOutlined style={{ color: '#eb4f34' }} />}
                        onClick={() => handleDelete(record)} 
                    />
                </Tooltip>
                </div>
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
            {contextHolder}
            <NavBar />
            <ManagerNavBar />
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
            
            <Modal
                title="Chi tiết người dùng"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {loadingDetail ? (
                    <div className="flex justify-center items-center py-12">
                        <Spin size="large" />
                    </div>
                ) : userDetail ? (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Mã sinh viên" span={1}>
                            {userDetail.student_code || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Họ và tên" span={1}>
                            {userDetail.last_name} {userDetail.first_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email" span={1}>
                            {userDetail.email}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại" span={1}>
                            {userDetail.phone_number}
                        </Descriptions.Item>
                        <Descriptions.Item label="CCCD" span={1}>
                            {userDetail.cccd}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vai trò" span={1}>
                            <Tag color={userDetail.role === "Admin" ? "red" : userDetail.role === "Manager" ? "blue" : "green"}>
                                {userDetail.role}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ" span={2}>
                            {userDetail.address}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chuyên ngành" span={2}>
                            {userDetail.major_names && userDetail.major_names.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {userDetail.major_names.map((major, index) => (
                                        <Tag key={index} color="cyan">{major}</Tag>
                                    ))}
                                </div>
                            ) : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Wallet Address" span={2}>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {userDetail.wallet_address || "N/A"}
                            </code>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ưu tiên" span={1}>
                            <Tag color={userDetail.is_priority ? "orange" : "default"}>
                                {userDetail.is_priority ? "Có" : "Không"}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Lần đầu đăng nhập" span={1}>
                            <Tag color={userDetail.is_first_login ? "purple" : "default"}>
                                {userDetail.is_first_login ? "Có" : "Không"}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo" span={1}>
                            {userDetail.created_at ? new Date(userDetail.created_at).toLocaleString('vi-VN') : "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật" span={1}>
                            {userDetail.updated_at ? new Date(userDetail.updated_at).toLocaleString('vi-VN') : "N/A"}
                        </Descriptions.Item>
                    </Descriptions>
                ) : null}
            </Modal>

            <Modal
                title="Chỉnh sửa người dùng"
                open={isEditModalVisible}
                onCancel={handleCloseEditModal}
                footer={null}
                width={700}
            >
                {loadingEdit && !editingUser ? (
                    <div className="flex justify-center items-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditSubmit}
                        className="mt-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                label="Họ"
                                name="last_name"
                                rules={[{ required: true, message: "Vui lòng nhập họ" }]}
                            >
                                <Input placeholder="Nguyen" />
                            </Form.Item>
                            <Form.Item
                                label="Tên"
                                name="first_name"
                                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                            >
                                <Input placeholder="Van A" />
                            </Form.Item>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email" },
                                    { type: "email", message: "Email không hợp lệ" },
                                ]}
                            >
                                <Input placeholder="nguyenvana@example.com" />
                            </Form.Item>
                            <Form.Item
                                label="Số điện thoại"
                                name="phone_number"
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                            >
                                <Input placeholder="0912345678" />
                            </Form.Item>
                            <Form.Item
                                label="CCCD"
                                name="cccd"
                                rules={[{ required: true, message: "Vui lòng nhập CCCD" }]}
                            >
                                <Input placeholder="0123456789" />
                            </Form.Item>
                            <Form.Item
                                label="Mật khẩu mới (để trống nếu không đổi)"
                                name="password"
                            >
                                <Input.Password placeholder="Để trống nếu không đổi" />
                            </Form.Item>
                        </div>
                        <Form.Item
                            label="Địa chỉ"
                            name="address"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                        >
                            <Input.TextArea rows={3} placeholder="123 Main St, Hanoi" />
                        </Form.Item>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                label="Vai trò"
                                name="role"
                            >
                                <Select
                                    placeholder="Chọn vai trò (để trống nếu không đổi)"
                                    allowClear
                                    options={[
                                        { label: "Admin", value: "Admin" },
                                        { label: "Manager", value: "Manager" },
                                        { label: "Student", value: "Student" },
                                        { label: "Teacher", value: "Teacher" },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item
                                label="Chuyên ngành"
                                name="major_ids"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn ít nhất một chuyên ngành",
                                    },
                                ]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Chọn chuyên ngành"
                                    loading={loadingMajors}
                                    options={majorOptions}
                                />
                            </Form.Item>
                        </div>
                        <Form.Item className="mb-0 mt-4">
                            <div className="flex justify-end gap-2">
                                <Button onClick={handleCloseEditModal}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit" loading={loadingEdit}>
                                    Cập nhật
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    )
}