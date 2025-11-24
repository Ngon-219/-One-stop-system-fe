"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Item } from "../components/item";
import ProfileImg from "../../public/assets/images/profile.png";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { NavBar } from "../components/navbar";

const HomePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || (!loading && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <NavBar />
      <Item image={ProfileImg} title="Item 1" />
    </div>
  );
};

export default HomePage;