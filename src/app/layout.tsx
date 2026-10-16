import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppQueryProvider } from "@/components/providers/AppQueryProvider";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import { getAppVersion } from "@/lib/appVersion";

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

const cooper = localFont({
  src: '../../public/font/COOPBL.ttf',
  variable: '--font-cooper-next',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  applicationName: "Atiyya",
  title: {
    default: 'Centers of Excellence',
    template: '%s | Centers of Excellence',
  },
  description: "Digital Support Portal for Atiyya Group",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Atiyya",
    title: "Atiyya - Centers of Excellence",
    description: "Secure and transparent Digital Support Portal for Atiyya Group",
    images: [
      {
        url: "/social/ssf-alparamba-share.png",
        width: 1200,
        height: 630,
        alt: "Atiyya Group - Digital Support Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atiyya - Centers of Excellence",
    description: "Secure and transparent Digital Support Portal for Atiyya Group",
    images: ["/social/ssf-alparamba-share.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Atiyya",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appVersion = getAppVersion();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoMalayalam.variable} ${cooper.variable} antialiased transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider>
          <AppQueryProvider>
            {children}
            <PwaRuntime currentVersion={appVersion} />
            <Toaster position="bottom-right" richColors />
          </AppQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



