import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Manager",
  description: "Personal kanban board with drag & drop",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Project Manager",
  },
  applicationName: "Project Manager",
  themeColor: "#0a0a0a",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: 'dark', backgroundColor: '#0a0a0a', color: '#ededed' }}>
      <head>
        <meta name="color-scheme" content="dark" />
        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Project Manager" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.style.backgroundColor = '#0a0a0a';
                  document.documentElement.style.color = '#ededed';
                } catch (e) {}
              })();

              // Global error handler for browser extension errors
              window.addEventListener('error', function(event) {
                // Suppress errors from browser extensions (ethereum, crypto wallets, etc.)
                if (event.message && (
                  event.message.includes('ethereum') ||
                  event.message.includes('crypto') ||
                  event.message.includes('wallet') ||
                  event.message.includes('selectedAddress')
                )) {
                  event.preventDefault();
                  console.warn('Browser extension error suppressed:', event.message);
                  return true;
                }
              });

              // Suppress unhandledrejection errors from extensions
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && (
                  event.reason.message.includes('ethereum') ||
                  event.reason.message.includes('crypto') ||
                  event.reason.message.includes('wallet')
                )) {
                  event.preventDefault();
                  console.warn('Browser extension promise rejection suppressed:', event.reason);
                  return true;
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-background text-foreground transition-colors`} style={{ backgroundColor: '#0a0a0a', color: '#ededed' }}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <AuthProvider>
            <div className="relative min-h-dvh">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
