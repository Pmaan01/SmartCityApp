import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ChatBot from "@/components/chat/ChatBot";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart City Service Platform",
  description: "Report and track city issues in real time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
