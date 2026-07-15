import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppFrame from "./components/AppFrame";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KIPROD CRM | Institutional Growth Hub",
    template: "%s | KIPROD CRM",
  },
  description:
    "KIPROD Institutional Growth Hub for partnerships, acquisition, reporting and staff capability development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

