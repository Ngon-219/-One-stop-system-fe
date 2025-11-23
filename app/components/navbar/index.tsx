import ProfileImg from "../../../public/assets/images/profile.png";
import Image from "next/image";

export const NavBar = () => {
    return (
        <div className="flex flex-row justify-center items-center bg-[url('/assets/images/navbar-bg.png')] bg-cover bg-center">
            
            <div className="flex flex-row justify-start items-center w-1/2">
            <Image src={ProfileImg} alt="Profile" width={100} height={100} className="rounded-full"/>
            </div>
        </div>
    )
}

export default NavBar;