import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/assets/images/logo.png";

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-6 sm:flex-row sm:items-center sm:justify-left sm:gap-6">
        <div className="flex shrink-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <Link href="/verify">
            <Image
              src={logo}
              alt="Hanoi University of Civil Engineering"
              className="h-20 w-auto cursor-pointer"
              priority
            />
          </Link>

          <div className="space-y-1">
            <p className="text-xl font-semibold uppercase leading-tight tracking-wide text-[#2A46A1] sm:text-2xl lg:text-[32px]">
              Trường Đại Học Xây Dựng Hà Nội
            </p>
            <p className="text-lg font-medium text-[#25428F]">
              Hanoi University of Civil Engineering
            </p>
            <p className="text-sm font-medium text-[#C5402E]">
              — Cơ sở giáo dục đại học đạt chuẩn kiểm định quốc tế
            </p>
          </div>
        </div>

        <div className="flex flex-row gap-6 sm:flex-wrap sm:items-center sm:justify-end sm:gap-8">
          <div className="flex w-full items-center gap-3 text-left sm:w-auto">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C243] sm:h-11 sm:w-11">
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="h-6 w-6 text-white"
              >
                <path
                  fill="currentColor"
                  d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1v3.54a1 1 0 01-.91 1 17 17 0 01-7.45-2.4 16.92 16.92 0 01-5.22-5.22A17 17 0 014 6.92a1 1 0 011-1h3.54a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.24 1.01z"
                />
              </svg>
            </span>
            <div className="flex flex-col">
              <p className="text-base font-semibold text-[#2A46A1]">Hotline</p>
              <p className="text-lg font-semibold text-[#4A4A4A]">
                02438697004
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 text-left sm:w-auto">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5C243] sm:h-11 sm:w-11">
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="h-6 w-6 text-white"
              >
                <path
                  fill="currentColor"
                  d="M20.5 4h-17A1.5 1.5 0 002 5.5v13A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0020.5 4zm-.25 2l-8.12 5.32a1 1 0 01-1.16 0L2.84 6h17.41zM4 18v-9.2l6.44 4.22a3 3 0 003.12 0L20 8.8V18H4z"
                />
              </svg>
            </span>
            <div className="flex flex-col">
              <p className="text-base font-semibold text-[#2A46A1]">Email</p>
              <p className="text-lg font-semibold text-[#4A4A4A]">
                huce@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;