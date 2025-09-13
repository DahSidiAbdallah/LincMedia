import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'LINC MEDIA',
  description: 'Capturing Moments, Telling Stories',
  // Explicitly declare icons to avoid relying on auto-discovery (helps invalidate cache when updated)
  icons: {
    icon: [{ url: '/favicon.ico?v=2', rel: 'icon', type: 'image/x-icon' }],
    shortcut: ['/favicon.ico?v=2'],
    apple: ['/favicon.ico?v=2'], // Replace with dedicated apple-touch-icon if you add one later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Fallback explicit link for browsers that ignore metadata API edge cases */}
        <link rel="icon" href="/favicon.ico?v=2" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
