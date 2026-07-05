import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
});

const cooper = localFont({
  src: "../../public/font/COOPBL.ttf",
  variable: "--font-cooper-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SSF Alparamba - Digital Varisankhya",
  description: "Digital Varisankhya Collection Portal for SSF Alparamba Unit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoMalayalam.variable} ${cooper.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
