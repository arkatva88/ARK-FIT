import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/shared/query-provider";
import { PwaRegister } from "@/components/shared/pwa-register";
import { PwaInstallBanner } from "@/components/shared/pwa-install-banner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ARK FIT — Gym Operating System",
  description: "High-performance fitness & personal training management platform designed for modern Indian gyms.",
  applicationName: "ARK FIT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ARK FIT",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1E40AF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <QueryProvider>
          <PwaRegister />
          {children}
          <PwaInstallBanner />
        </QueryProvider>
      </body>
    </html>
  );
}
