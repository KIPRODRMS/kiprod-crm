import type {
  Metadata,
  Viewport,
} from "next";
import { Archivo } from "next/font/google";
import AppFrame from "./components/AppFrame";
import PwaRegistration from "./components/PwaRegistration";
import "./globals.css";
import "./crm-refinements.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://kiprod-crm.vercel.app"
  ),

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
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],

    shortcut: "/icon-192.png",

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "KIPROD CRM",
    statusBarStyle:
      "black-translucent",
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
  viewportFit: "cover",
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
        <PwaRegistration />
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
