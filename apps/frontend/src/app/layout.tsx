import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { AppNav, ApiStatusBanner } from '@/components';

export const metadata: Metadata = {
  title: 'AI Toolkit',
  description: 'Fullstack AI Toolkit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppNav />
          <ApiStatusBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
