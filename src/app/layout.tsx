import type { Metadata } from "next";
import "./globals.css";
import SidebarWrapper from "@/components/layout/SidebarWrapper";

export const metadata: Metadata = {
  title: "Disaster Relief Resource Management System",
  description:
    "Next-generation disaster response, warehouse inventory, resource allocation, emergency logistics, and volunteer coordination system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
