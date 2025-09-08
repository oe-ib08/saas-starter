import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SWRConfig } from 'swr';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="bg-background text-foreground font-sans"
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-background">
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <SessionProvider>
            <SWRConfig
              value={{
                // Remove fallback data that requires authentication
                // Client-side components will fetch this data as needed
              }}
            >
              {children}
            </SWRConfig>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
