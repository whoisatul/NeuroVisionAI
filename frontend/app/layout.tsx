import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NeuroVisionAI — AI-Powered Brain Tumor Detection",
  description:
    "NeuroVisionAI uses a deep U-Net model trained on BraTS 2021 to detect and segment brain tumors from FLAIR MRI scans with 93.57% Dice accuracy.",
  keywords:
    "brain tumor detection, MRI segmentation, U-Net, BraTS 2021, AI radiology, FLAIR MRI",
  openGraph: {
    title: "NeuroVisionAI — AI-Powered Brain Tumor Detection",
    description:
      "Detect and segment brain tumors from MRI scans in seconds with our AI-powered U-Net model.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
