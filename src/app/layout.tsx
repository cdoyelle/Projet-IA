import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDU IA Mobile",
  description: "Application mobile GDU IA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
