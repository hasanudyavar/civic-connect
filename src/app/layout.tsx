import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bhatkal Civic Connect — Smart Civic Grievance Platform',
  description: 'Report civic issues in Bhatkal Taluk. Submit complaints directly to the right department, track real-time progress, and hold officials accountable.',
  keywords: ['civic complaints', 'Bhatkal', 'grievance', 'municipal', 'Karnataka', 'Bhatkal Taluk'],
  authors: [{ name: 'Bhatkal Civic Connect' }],
  openGraph: {
    title: 'Bhatkal Civic Connect — Report Civic Issues in 30 Seconds',
    description: 'Smart government complaint management platform for Bhatkal Taluk, Karnataka.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f8f9ff" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
