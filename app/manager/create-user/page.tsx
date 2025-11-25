"use client"

import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Select, Tabs, Typography, Spin } from "antd";
import { createNewUserApi, getAllMajor } from "@/app/api/auth_service";
import { major } from "@/app/api/interface/response/get_all_major";
import { createNewUserReq } from "@/app/api/interface/request/create_new_user";
import { createNewUserRes } from "@/app/api/interface/response/create_new_user";
import Swal from "sweetalert2";

const roleOptions = ["Admin", "Manager", "Teacher", "Student"];

export default function CreateUserPage() {
    const [form] = Form.useForm();
    const [majors, setMajors] = useState<major[]>([]);
    const [loadingMajors, setLoadingMajors] = useState<boolean>(false);

    const fetchMajors = async () => {
        setLoadingMajors(true);
        try {
            const response = await getAllMajor();
            if (response?.majors) {
                console.log("majors", response.majors);
                setMajors(response.majors);
            }
        } catch (err) {
            console.error("Failed to load majors", err);
        } finally {
            setLoadingMajors(false);
        }
    };

    useEffect(() => {
        fetchMajors();
    }, []);

    const majorOptions = useMemo(
        () => majors.map((m) => ({ label: m.name, value: m.major_id })),
        [majors]
    );

    const handleSubmit = async (values: createNewUserReq) => {
        console.log("handleCreateUser submit payload", values);
        let response: createNewUserRes = await createNewUserApi(values);
        if (response.statusCode == 201) {
            Swal.fire({
                title: "Create User Success",
                text: response.message,
                icon: "success"
              });
        } else {
            Swal.fire({
                icon: "error",
                title: "Create User Failed",
                text: response.message + "!",
              });
        }
    };

    const manualForm = (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="max-w-3xl"
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
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                >
                    <Input.Password placeholder="password123" />
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
                    rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                >
                    <Select
                        placeholder="Chọn vai trò"
                        options={roleOptions.map((role) => ({
                            label: role,
                            value: role,
                        }))}
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
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Tạo người dùng
                </Button>
            </Form.Item>
        </Form>
    );

    const uploadPlaceholder = (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            Upload placeholder
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col items-center py-8 px-4">
            <Typography.Title level={2}>Tạo người dùng</Typography.Title>
            <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow">
                <Tabs
                    defaultActiveKey="manual"
                    items={[
                        {
                            key: "manual",
                            label: "Nhập thông tin",
                            children: loadingMajors && majorOptions.length === 0 ? (
                                <div className="flex justify-center py-12">
                                    <Spin />
                                </div>
                            ) : (
                                manualForm
                            ),
                        },
                        {
                            key: "upload",
                            label: "Upload",
                            children: uploadPlaceholder,
                        },
                    ]}
                />
            </div>
        </div>
    );
}