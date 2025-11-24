const quickLinks = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Tin tức & Sự kiện", href: "/news" },
  { label: "Hợp tác quốc tế", href: "/international" },
  { label: "Liên hệ", href: "/contact" }
];

const academicLinks = [
  { label: "Tuyển sinh", href: "/admission" },
  { label: "Đào tạo đại học", href: "/programs/undergraduate" },
  { label: "Đào tạo sau đại học", href: "/programs/postgraduate" },
  { label: "Thư viện số", href: "/library" }
];

const contactInfo = [
  "Số 55 Giải Phóng, Quận Hai Bà Trưng, Hà Nội, Việt Nam",
  "Tel: (024) 3869 2008",
  "Email: contact@huce.edu.vn"
];

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/dhxdhn", short: "f" },
  { label: "YouTube", href: "https://www.youtube.com/@dhxdhn", short: "yt" },
  { label: "LinkedIn", href: "https://www.linkedin.com/school/hanoi-university-of-civil-engineering/", short: "in" },
  { label: "Zalo", href: "https://zalo.me/huce", short: "z" }
];

const FooterLinkGroup = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold tracking-[0.2em] text-black-400 uppercase">{title}</p>
    <ul className="space-y-2 text-sm">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            className="transition-colors duration-200 text-black-300 hover:text-white"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#fff] text-black-200 px-6 py-12 md:px-12 border-t-2 border-gray-200 mt-[2vh]">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="space-y-4 lg:w-1/3">
            <div>
              <p className="text-2xl font-semibold tracking-[0.4em] uppercase">HUCE</p>
              <p className="text-sm tracking-[0.3em] text-black-400 uppercase">
                Hanoi University of Civil Engineering
              </p>
            </div>
            <div className="space-y-2 text-sm text-black-300">
              {contactInfo.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2">
            <FooterLinkGroup title="Liên kết nhanh" links={quickLinks} />
            <FooterLinkGroup title="Đào tạo & dịch vụ" links={academicLinks} />
          </div>

          <div className="space-y-3 lg:w-1/4">
            <p className="text-sm font-semibold tracking-[0.2em] text-black-400 uppercase">Tổng đài hỗ trợ</p>
            <p className="text-2xl font-semibold text-white">(024) 3869 2008</p>
            <p className="text-black-400 text-sm">
              Thứ Hai - Thứ Sáu: 8h00 - 17h00
              <br />
              Thứ Bảy: 8h00 - 12h00
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-6">
          <div className="flex items-center justify-center gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-full border border-gray-600 flex items-center justify-center text-xs font-semibold uppercase hover:border-white hover:text-white transition-colors duration-200"
                aria-label={social.label}
              >
                {social.short}
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-black-500">
            © {currentYear} Trường Đại học Xây dựng Hà Nội. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </footer>
  );
};