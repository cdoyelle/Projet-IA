import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDU TaskFlow",
  description: "Application mobile GDU TaskFlow",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
