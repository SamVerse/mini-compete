import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/auth-context"; // 1. Import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mini Compete",
  description: "Competition Service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* 2. Wrap */}
          <main className="container mx-auto p-4">
            {children}
          </main>
        </AuthProvider> {/* 3. Close wrap */}
      </body>
    </html>
  );
}