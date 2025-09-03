// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import "prismjs/themes/prism-tomorrow.css";
import SessionProviderClient from "@/components/SessionProviderClient";
import Navbar from "@/components/Navbar";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <title>Simplet</title>
      </Head>
  <body className={`${inter.className} language-javascript`}>
        <SessionProviderClient>
          <Navbar />
          {children}
        </SessionProviderClient>
      </body>
    </html>
  );
}
