import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Studio — Créateur de CV A4",
  description: "Créez, personnalisez, prévisualisez et imprimez votre CV sur une page A4."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
