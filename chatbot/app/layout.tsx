import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NavDisha Healthcare Assistant',
  description: 'AI-powered healthcare practitioner search and information assistant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
