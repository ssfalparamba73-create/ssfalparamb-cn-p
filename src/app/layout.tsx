import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Sans_Malayalam, Quicksand, League_Spartan } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppQueryProvider } from "@/components/providers/AppQueryProvider";

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
  variable: '--font-quicksand',
  subsets: ['latin'],
  display: 'swap',
});

const leagueSpartan = League_Spartan({
  variable: '--font-league-spartan',
  subsets: ['latin'],
  display: 'swap',
});

const cooper = localFont({
  src: '../../public/font/COOPBL.ttf',
  variable: '--font-cooper-next',
  display: 'swap',
});

const barabara = localFont({
  src: '../../public/font/BARABARA-final.otf',
  variable: '--font-barabara',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  applicationName: "Atiyya",
  title: {
    default: 'Centers of Excellence',
    template: '%s | Centers of Excellence',
  },
  description: "Digital Support Portal for SSF Alparamba Unit",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Atiyya",
    title: "Atiyya - Centers of Excellence",
    description: "Secure and transparent Digital Support Portal for SSF Alparamba Unit",
    images: [
      {
        url: "/social/ssf-alparamba-share.png",
        width: 1200,
        height: 630,
        alt: "SSF Alparamba Unit - Digital Support Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atiyya - Centers of Excellence",
    description: "Secure and transparent Digital Support Portal for SSF Alparamba Unit",
    images: ["/social/ssf-alparamba-share.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Atiyya",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoMalayalam.variable} ${cooper.variable} ${quicksand.variable} ${leagueSpartan.variable} ${barabara.variable} antialiased transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider>
          <AppQueryProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </AppQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



