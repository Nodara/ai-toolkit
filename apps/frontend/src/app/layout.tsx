import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { AppNav } from '@/components';

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
          {children}
        </Providers>
      </body>
    </html>
  );
}
