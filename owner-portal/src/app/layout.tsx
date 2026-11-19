import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./aura.css";
import "./aura-v3.css";
import "./app-config.css";

const text = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-saxlem",
  weight: "100 900",
  display: "swap",
});
const display = localFont({
  src: "./fonts/Sora-Variable.woff2",
  variable: "--font-display",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Saxlem Owner Portal",
    template: "%s | Saxlem Owner Portal",
  },
  description: "Secure platform administration for Saxlem.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${text.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
