import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import AppFrame from "./components/AppFrame";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
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
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}