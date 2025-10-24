// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import "prismjs/themes/prism-tomorrow.css";
import SessionProviderClient from "@/components/SessionProviderClient";
import Navbar from "@/components/Navbar";
import MountainBackground from "@/components/MountainBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Simplet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} language-javascript`}>
        {/* Global animated background */}
        <MountainBackground isLoading={false} isSuccess={false} />
        <SessionProviderClient>
          <Navbar />
          <div className="relative z-10">
            {children}
          </div>
        </SessionProviderClient>
      </body>
    </html>
  );
}
