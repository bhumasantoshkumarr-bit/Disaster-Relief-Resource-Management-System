import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";

export const metadata: Metadata = {
  title: "Disaster Relief Resource Management System",
  description: "Next-generation disaster response, warehouse inventory, resource allocation, emergency logistics, and volunteer coordination system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
        <SidebarWrapper>
          <Navbar />
          {children}
        </SidebarWrapper>
      </body>
    </html>
  );
}
