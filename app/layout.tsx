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
  title: "Task Manager Kanban",
  description: "Personal kanban board with drag & drop",
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
        <meta name="application-name" content="Taskmanager" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8fafc" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Taskmanager" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
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
