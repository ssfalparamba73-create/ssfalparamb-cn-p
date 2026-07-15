import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Sans_Malayalam, Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SessionProvider } from "@/lib/auth/SessionContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  display: "swap",
  preload: false,
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
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
      <body className={`${inter.variable} ${notoMalayalam.variable} ${cooper.variable} ${quicksand.variable} antialiased transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
