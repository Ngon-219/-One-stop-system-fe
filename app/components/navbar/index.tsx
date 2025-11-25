import Image from "next/image";
import ProfileImg from "../../../public/assets/images/profile.png";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { logoutApi, profileApi } from "@/app/api/auth_service";
import { ProfileResponse } from "@/app/api/interface/response/profile";
import { LogoutResponse } from "@/app/api/interface/response/logout";
import Swal from "sweetalert2";

export const NavBar = () => {
  let {logout, user} = useAuth();
  let [userResponse, setUserResponse] = useState<ProfileResponse>();

  const handleLogout = async () => {
    let response: LogoutResponse = await logoutApi();
    if (response.status_code == 200) {
      Swal.fire({
        title: "Logout Successful",
        text: response.message,
        icon: "success"
      });
      logout();
    } else {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: response.message + "!",
      });
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      let response = await profileApi();
      setUserResponse(response);
    };

    fetchProfile();
  }, [])

  return (
    <div className="w-full bg-[#f7f7f7] py-8 mb-[2vh]">
      <div className="w-[90vw] px-4 mx-auto space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-linear-to-r from-[#192441]/90 via-[#1f2e52]/70 to-transparent z-10" />
          <Image
            src="/assets/images/navbar-bg.png"
            alt="Service background"
            fill
            priority
            className="object-cover"
          />

          <div className="relative z-20 px-8 py-12 text-white space-y-3">
            <p className="tracking-[0.5em] uppercase text-sm text-gray-200">
              Hệ thống đăng ký thủ tục hành chính một cửa
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">DỊCH VỤ</h1>
          </div>
        </div>

        {/* Profile strip */}
        <div className="flex flex-col gap-4 px-6 py-5 bg-white rounded-3xl shadow-sm border border-gray-100 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <Image
                src={ProfileImg}
                alt="Profile"
                fill
                className="rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">
                {user?.role}
              </p>
              <p className="text-xl font-semibold text-[#0f3f78]">{userResponse?.last_name + " " + userResponse?.first_name}</p>
              <p className="text-sm text-gray-500 hover:cursor-pointer flex gap-1 items-center" onClick={handleLogout}>
                <span>ID: {user?.user_id}</span>
                <span>·</span>
                <span className="underline">Log out</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              Xem hồ sơ
            </button>
            <button className="px-5 py-3 text-sm font-semibold text-white bg-[#17a24a] rounded-xl hover:bg-[#12813a] transition-colors">
              Cập nhật hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;