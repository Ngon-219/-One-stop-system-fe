"use client"

import { usePathname, useRouter } from "next/navigation";
import { Menu } from "antd";
import {
    DashboardOutlined,
    UserOutlined,
    UserAddOutlined,
    FileTextOutlined,
    FileDoneOutlined,
    ApartmentOutlined,
    ClusterOutlined,
    InboxOutlined,
    FileAddOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const menuItems: MenuProps["items"] = [
    {
        key: "/manager/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
    },
    {
        key: "/manager/users",
        icon: <UserOutlined />,
        label: "Quản lý người dùng",
    },
    {
        key: "/manager/create-user",
        icon: <UserAddOutlined />,
        label: "Tạo người dùng",
    },
    {
        key: "/manager/documents",
        icon: <FileTextOutlined />,
        label: "Quản lý tài liệu",
    },
    {
        key: "/manager/documents/handle-documents",
        icon: <FileDoneOutlined />,
        label: "Xử lý tài liệu",
    },
    {
        key: "/manager/certificates/create",
        icon: <FileAddOutlined />,
        label: "Tạo chứng chỉ",
    },
    {
        key: "/manager/departments",
        icon: <ApartmentOutlined />,
        label: "Khoa/Phòng ban",
    },
    {
        key: "/manager/majors",
        icon: <ClusterOutlined />,
        label: "Chuyên ngành",
    },
    {
        key: "/manager/requests",
        icon: <InboxOutlined />,
        label: "Quản lý yêu cầu",
    },
];

export const ManagerNavBar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleMenuClick = (e: { key: string }) => {
        router.push(e.key);
    };

    // Xác định selected key dựa trên pathname
    const selectedKey = pathname?.startsWith("/manager/create-user") 
        ? "/manager/create-user" 
        : pathname?.startsWith("/manager/certificates/create")
        ? "/manager/certificates/create"
        : pathname || "/manager/dashboard";

    return (
        <div className="w-full bg-white border-b border-gray-200 shadow-sm mb-4">
            <div className="w-[90vw] mx-auto">
                <Menu
                    mode="horizontal"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    className="border-b-0"
                />
            </div>
        </div>
    );
};

export default ManagerNavBar;

