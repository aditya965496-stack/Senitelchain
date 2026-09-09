import './globals.css';
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { Providers } from './providers';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SentinelChain | Zero-Trust Access Control & Audit Verification',
  description: 'Enterprise client-side encryption gateway and decentralized immutable audit trail on Polygon Amoy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={openSans.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
