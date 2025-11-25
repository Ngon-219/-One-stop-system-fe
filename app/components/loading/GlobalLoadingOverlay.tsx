"use client";

import { Spin } from "antd";
import { useLoading } from "@/app/context/LoadingContext";

export const GlobalLoadingOverlay = () => {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur">
      <Spin size="large" />
      <span className="text-base text-gray-700">Đang tải dữ liệu...</span>
    </div>
  );
};

