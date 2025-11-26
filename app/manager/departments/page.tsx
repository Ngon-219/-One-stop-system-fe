"use client";

import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { useEffect, useState } from "react";
import {
    getDepartmentsApi,
    createDepartmentApi,
    updateDepartmentApi,
    deleteDepartmentApi,
} from "@/app/api/auth_service";
import { DepartmentResponse } from "@/app/api/interface/response/departments";
import { Button, DatePicker, Form, Input, Modal, Spin, Table, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import dayjs, { Dayjs } from "dayjs";

interface DepartmentTableItem {
    key: string;
    department_id: string;
    name: string;
    founding_date: string;
    dean: string;
}

export default function DepartmentManagerPage() {
    const [dataSource, setDataSource] = useState<DepartmentTableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);
    const [form] = Form.useForm();

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await getDepartmentsApi();
            const mapped = res.departments.map((d) => ({
                key: d.department_id,
                department_id: d.department_id,
                name: d.name,
                founding_date: d.founding_date,
                dean: d.dean,
            }));
            setDataSource(mapped);
        } catch (err) {
            console.error("Failed to load departments", err);
            Swal.fire("Lỗi", "Không thể tải danh sách khoa/phòng ban", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpenCreate = () => {
        setEditingDepartment(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOpenEdit = (record: DepartmentTableItem) => {
        const dept: DepartmentResponse = {
            department_id: record.department_id,
            name: record.name,
            founding_date: record.founding_date,
            dean: record.dean,
            create_at: "",
            update_at: "",
        };
        setEditingDepartment(dept);
        form.setFieldsValue({
            name: dept.name,
            dean: dept.dean,
            founding_date: dept.founding_date ? dayjs(dept.founding_date) : null,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (record: DepartmentTableItem) => {
        const result = await Swal.fire({
            title: "Xác nhận xoá",
            text: `Xoá khoa/phòng ban "${record.name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xoá",
            cancelButtonText: "Huỷ",
        });
        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            await deleteDepartmentApi(record.department_id);
            Swal.fire("Thành công", "Đã xoá khoa/phòng ban", "success");
            fetchDepartments();
        } catch (err: any) {
            console.error("Failed to delete department", err);
            Swal.fire(
                "Lỗi",
                err?.response?.data ?? "Không thể xoá khoa/phòng ban",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: { name: string; dean: string; founding_date: Dayjs }) => {
        try {
            setLoading(true);
            const foundingDateStr = values.founding_date
                ? values.founding_date.format("YYYY-MM-DDTHH:mm:ss")
                : "";
            if (editingDepartment) {
                await updateDepartmentApi(editingDepartment.department_id, {
                    name: values.name,
                    dean: values.dean,
                    founding_date: foundingDateStr,
                });
                Swal.fire("Thành công", "Đã cập nhật khoa/phòng ban", "success");
            } else {
                await createDepartmentApi({
                    name: values.name,
                    dean: values.dean,
                    founding_date: foundingDateStr,
                } as any);
                Swal.fire("Thành công", "Đã tạo khoa/phòng ban mới", "success");
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchDepartments();
        } catch (err: any) {
            console.error("Failed to save department", err);
            Swal.fire(
                "Lỗi",
                err?.response?.data ?? "Không thể lưu khoa/phòng ban",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<DepartmentTableItem> = [
        {
            title: "Tên khoa/phòng ban",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Trưởng khoa",
            dataIndex: "dean",
            key: "dean",
        },
        {
            title: "Ngày thành lập",
            dataIndex: "founding_date",
            key: "founding_date",
            render: (value: string) =>
                value ? new Date(value).toLocaleString("vi-VN") : "N/A",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <div className="flex gap-2">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#1890ff" }} />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xoá">
                        <Button
                            type="text"
                            icon={<DeleteOutlined style={{ color: "#eb4f34" }} />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div className="h-full w-full flex flex-col items-center justify-center">
            <NavBar />
            <ManagerNavBar />
            <div className="w-[90vw] py-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Quản lý khoa/phòng ban
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Tạo, chỉnh sửa và xoá khoa/phòng ban trong hệ thống.
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreate}
                    >
                        Thêm khoa/phòng ban
                    </Button>
                </div>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    loading={loading}
                    className="bg-white rounded-3xl shadow-xl"
                    scroll={{ x: 800 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} khoa/phòng ban`,
                    }}
                />
            </div>

            <Modal
                title={editingDepartment ? "Chỉnh sửa khoa/phòng ban" : "Thêm khoa/phòng ban"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnHidden
            >
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="mt-4"
                    >
                        <Form.Item
                            label="Tên khoa/phòng ban"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                        >
                            <Input placeholder="Ví dụ: Khoa Công nghệ thông tin" />
                        </Form.Item>
                        <Form.Item
                            label="Trưởng khoa"
                            name="dean"
                            rules={[{ required: true, message: "Vui lòng nhập trưởng khoa" }]}
                        >
                            <Input placeholder="Họ và tên trưởng khoa" />
                        </Form.Item>
                        <Form.Item
                            label="Ngày thành lập"
                            name="founding_date"
                            rules={[
                                { required: true, message: "Vui lòng chọn ngày thành lập" },
                            ]}
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                className="w-full"
                            />
                        </Form.Item>
                        <Form.Item className="mb-0 mt-4">
                            <div className="flex justify-end gap-2">
                                <Button onClick={() => setIsModalVisible(false)}>
                                    Huỷ
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Lưu
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
}


