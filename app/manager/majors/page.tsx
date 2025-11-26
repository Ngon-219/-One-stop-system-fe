"use client";

import NavBar from "@/app/components/navbar";
import ManagerNavBar from "@/app/components/manager-navbar";
import { useEffect, useState } from "react";
import {
    getMajorsApi,
    createMajorApi,
    updateMajorApi,
    deleteMajorApi,
    getDepartmentsApi,
} from "@/app/api/auth_service";
import { MajorResponse } from "@/app/api/interface/response/majors";
import { DepartmentResponse } from "@/app/api/interface/response/departments";
import { Button, DatePicker, Form, Input, Modal, Select, Spin, Table, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import dayjs, { Dayjs } from "dayjs";

interface MajorTableItem {
    key: string;
    major_id: string;
    name: string;
    founding_date: string;
    department_id: string | null;
}

export default function MajorManagerPage() {
    const [dataSource, setDataSource] = useState<MajorTableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMajor, setEditingMajor] = useState<MajorResponse | null>(null);
    const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [form] = Form.useForm();

    const fetchMajors = async () => {
        setLoading(true);
        try {
            const res = await getMajorsApi();
            const mapped = res.majors.map((m) => ({
                key: m.major_id,
                major_id: m.major_id,
                name: m.name,
                founding_date: m.founding_date,
                department_id: m.department_id ?? null,
            }));
            setDataSource(mapped);
        } catch (err) {
            console.error("Failed to load majors", err);
            Swal.fire("Lỗi", "Không thể tải danh sách chuyên ngành", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        setLoadingDepartments(true);
        try {
            const res = await getDepartmentsApi();
            setDepartments(res.departments);
        } catch (err) {
            console.error("Failed to load departments", err);
        } finally {
            setLoadingDepartments(false);
        }
    };

    useEffect(() => {
        fetchMajors();
        fetchDepartments();
    }, []);

    const handleOpenCreate = () => {
        setEditingMajor(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOpenEdit = (record: MajorTableItem) => {
        const major: MajorResponse = {
            major_id: record.major_id,
            name: record.name,
            founding_date: record.founding_date,
            department_id: record.department_id,
            create_at: "",
            update_at: "",
        };
        setEditingMajor(major);
        form.setFieldsValue({
            name: major.name,
            founding_date: major.founding_date ? dayjs(major.founding_date) : null,
            department_id: major.department_id ?? undefined,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (record: MajorTableItem) => {
        const result = await Swal.fire({
            title: "Xác nhận xoá",
            text: `Xoá chuyên ngành "${record.name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xoá",
            cancelButtonText: "Huỷ",
        });
        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            await deleteMajorApi(record.major_id);
            Swal.fire("Thành công", "Đã xoá chuyên ngành", "success");
            fetchMajors();
        } catch (err: any) {
            console.error("Failed to delete major", err);
            Swal.fire(
                "Lỗi",
                err?.response?.data ?? "Không thể xoá chuyên ngành",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: { name: string; department_id?: string; founding_date: Dayjs }) => {
        try {
            setLoading(true);
            const foundingDateStr = values.founding_date
                ? values.founding_date.format("YYYY-MM-DDTHH:mm:ss")
                : "";
            if (editingMajor) {
                await updateMajorApi(editingMajor.major_id, {
                    name: values.name,
                    founding_date: foundingDateStr,
                    department_id: values.department_id ?? null,
                });
                Swal.fire("Thành công", "Đã cập nhật chuyên ngành", "success");
            } else {
                await createMajorApi({
                    name: values.name,
                    founding_date: foundingDateStr,
                    department_id: values.department_id ?? null,
                } as any);
                Swal.fire("Thành công", "Đã tạo chuyên ngành mới", "success");
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchMajors();
        } catch (err: any) {
            console.error("Failed to save major", err);
            Swal.fire(
                "Lỗi",
                err?.response?.data ?? "Không thể lưu chuyên ngành",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<MajorTableItem> = [
        {
            title: "Tên chuyên ngành",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Khoa/Phòng ban",
            dataIndex: "department_id",
            key: "department_id",
            render: (id: string | null) => {
                const dept = departments.find((d) => d.department_id === id);
                return dept ? dept.name : "N/A";
            },
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
                            Quản lý chuyên ngành
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Tạo, chỉnh sửa và xoá chuyên ngành trong hệ thống.
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreate}
                    >
                        Thêm chuyên ngành
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
                        showTotal: (total) => `Tổng ${total} chuyên ngành`,
                    }}
                />
            </div>

            <Modal
                title={editingMajor ? "Chỉnh sửa chuyên ngành" : "Thêm chuyên ngành"}
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
                            label="Tên chuyên ngành"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                        >
                            <Input placeholder="Ví dụ: Kỹ thuật phần mềm" />
                        </Form.Item>
                        <Form.Item
                            label="Khoa/Phòng ban"
                            name="department_id"
                        >
                            <Select
                                placeholder="Chọn khoa/phòng ban (tuỳ chọn)"
                                allowClear
                                loading={loadingDepartments}
                                options={departments.map((d) => ({
                                    label: d.name,
                                    value: d.department_id,
                                }))}
                            />
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


