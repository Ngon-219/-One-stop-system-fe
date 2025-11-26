"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu } from "antd";
import {
    HomeOutlined,
    FileTextOutlined,
    InboxOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const menuItems: MenuProps["items"] = [
    {
        key: "/home",
        icon: <HomeOutlined />,
        label: "Trang chủ",
    },
    {
        key: "/my-documents",
        icon: <FileTextOutlined />,
        label: "Lịch sử yêu cầu giấy tờ",
    },
    {
        key: "/my-requests",
        icon: <InboxOutlined />,
        label: "Yêu cầu của tôi",
    },
    {
        key: "/profile",
        icon: <UserOutlined />,
        label: "Hồ sơ",
    },
];

export const StudentNavBar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleMenuClick = (e: { key: string }) => {
        router.push(e.key);
    };

    // Xác định selected key dựa trên pathname
    const selectedKey = pathname || "/home";

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

export default StudentNavBar;

