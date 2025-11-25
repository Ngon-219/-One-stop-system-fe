import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { AuthProviderWrapper } from "./providers/AuthProviderWrapper";
import { LoadingProvider } from "./context/LoadingContext";
import { GlobalLoadingOverlay } from "./components/loading/GlobalLoadingOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống hành chính một cửa",
  description: "Đồ án hệ thống hành chính một cửa",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProviderWrapper>
          <LoadingProvider>
            <Header />
            <main className="w-full h-full flex-1 flex items-center justify-center relative bg-white">
              {children}
            </main>
            <Footer />
            <GlobalLoadingOverlay />
          </LoadingProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
