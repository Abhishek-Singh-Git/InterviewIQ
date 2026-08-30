import type { Metadata, Viewport } from 'next';
import './globals.css';

const metadataOrigin = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin),
  title: 'InterviewIQ | Adaptive interview intelligence',
  description:
    'Run rigorous AI-adaptive voice interviews with live skill evidence, reliability gates, and an auditable decision trail.',
  openGraph: {
    title: 'InterviewIQ | Adaptive interview intelligence',
    description: 'Every answer becomes evidence. Run auditable AI-adaptive voice interviews.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'InterviewIQ evidence stack' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InterviewIQ | Adaptive interview intelligence',
    description: 'Every answer becomes evidence. Run auditable AI-adaptive voice interviews.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
