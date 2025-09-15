import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lincmedia.example.com';

export const metadata: Metadata = {
  title: {
    default: 'LINC MEDIA',
    template: '%s | LINC MEDIA',
  },
  description: 'Capturing Moments, Telling Stories — professional photography, galleries, and visual storytelling services.',
  metadataBase: new URL(siteUrl),
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  icons: {
    icon: [{ url: '/favicon.ico?v=2', rel: 'icon', type: 'image/x-icon' }],
    shortcut: ['/favicon.ico?v=2'],
    apple: ['/favicon.ico?v=2'],
  },
  openGraph: {
    title: 'LINC MEDIA',
    description: 'Capturing Moments, Telling Stories — professional photography, galleries, and visual storytelling services.',
    url: siteUrl,
    siteName: 'LINC MEDIA',
    images: [
      {
        url: `${siteUrl}/social-preview-1200x630.png`,
        width: 1200,
        height: 630,
        alt: 'LINC MEDIA preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LINC MEDIA',
    description: 'Capturing Moments, Telling Stories — professional photography, galleries, and visual storytelling services.',
    images: [`${siteUrl}/social-preview-1200x630.png`],
    creator: '@lincmedia',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LINC MEDIA",
    "url": siteUrl,
    "logo": `${siteUrl}/LINC.png`,
    "sameAs": [
      "https://www.instagram.com/lincmedia",
      "https://www.facebook.com/lincmedia"
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Fallback explicit link for browsers that ignore metadata API edge cases */}
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="canonical" href={siteUrl} />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
