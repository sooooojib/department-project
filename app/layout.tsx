import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Providers from './Providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Department Portal",
  description: "University department management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const payload = await getServerSession(authOptions);
  const role = payload?.user?.role || null;

  // Exclude sidebar margin on public pages
  const isAuth = !!role;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f4f7f6] min-h-screen text-slate-800`}>
        <Providers>
          <Sidebar role={role as any} />
          <main className={`transition-all duration-300 ${isAuth ? 'ml-0 md:ml-[72px]' : ''}`}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
