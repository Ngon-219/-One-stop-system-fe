"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button, Form, Input, Select, Tabs, Typography, Spin } from "antd";
import { createNewUserApi, getAllMajor } from "@/app/api/auth_service";
import { major } from "@/app/api/interface/response/get_all_major";
import { createNewUserReq } from "@/app/api/interface/request/create_new_user";
import { createNewUserRes } from "@/app/api/interface/response/create_new_user";
import Swal from "sweetalert2";
import { notification } from "antd";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/hooks/useSocket";

interface RegisterResult {
    status: string;
    email: string;
    student_code?: string;
    message?: string;
}

const roleOptions = ["Admin", "Manager", "Student"];

export function extractDataFromRaw(rawData: any): RegisterResult | null {
    console.log("extractDataFromRaw called with:", rawData);
    console.log("rawData type:", typeof rawData);
    
    try {
      const stringData = rawData.toString();
      console.log("stringData:", stringData);
      
      const jsonMatch = stringData.match(/\[.*\]/);
      console.log("jsonMatch:", jsonMatch);
      
      if (!jsonMatch) {
        console.log("No JSON match found");
        return null;
      }
      
      const outerArray = JSON.parse(jsonMatch[0]);
      console.log("outerArray:", outerArray);

      if (!outerArray[1]) {
        console.log("outerArray[1] is missing");
        return null;
      }
      
      const innerObject = JSON.parse(outerArray[1]);
      console.log("innerObject:", innerObject);
      console.log("Status:", innerObject.status, "Email:", innerObject.email);
      
      return {
        status: innerObject.status,
        email: innerObject.email,
      };
  
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

export default function CreateUserPage() {
    const [form] = Form.useForm();
    const [majors, setMajors] = useState<major[]>([]);
    const [loadingMajors, setLoadingMajors] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const router = useRouter();

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
            
            form.resetFields();
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

    const handleTabChange = (key: string) => {
        if (key === "upload") {
            router.push("/manager/create-user/upload");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-8 px-4">
            {contextHolder}
            <Typography.Title level={2}>Tạo người dùng</Typography.Title>
            <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow">
                <Tabs
                    defaultActiveKey="manual"
                    onChange={handleTabChange}
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
                        },
                    ]}
                />
            </div>
        </div>
    );
}