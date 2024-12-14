import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Answer Engine",
  description: "AI Answer Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
