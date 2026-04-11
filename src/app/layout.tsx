import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#050B14" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('civic-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}
