import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import AppFrame from "./components/AppFrame";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kiprod-crm.vercel.app"),

  title: {
    default: "KIPROD CRM",
    template: "%s | KIPROD CRM",
  },

  applicationName: "KIPROD CRM",

  description:
    "KIPROD Institutional Growth Hub for institutional engagement, partnerships, acquisition, reporting and staff capability development.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/icon.svg",
  },

  openGraph: {
    title: "KIPROD CRM",
    description:
      "KIPROD Institutional Growth Hub for institutional engagement, partnerships and acquisition.",
    url: "https://kiprod-crm.vercel.app",
    siteName: "KIPROD CRM",
    type: "website",
  },

  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#071426",
  colorScheme: "light",
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
