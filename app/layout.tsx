import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison Didier",
  description: "CRM Maison Didier pour la gestion des clients",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}

