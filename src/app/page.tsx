import LandingPageClient from '@/components/landing-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LINC MEDIA — Capturing Moments & Stories',
  description: 'Linc Media creates images and videos that do more than just exist. Professional photography, galleries, and audiovisual communications.',
  openGraph: {
    title: 'LINC MEDIA — Capturing Moments & Stories',
    description: 'Linc Media creates images and videos that do more than just exist. Professional photography, galleries, and audiovisual communications.',
  },
};

export default function Home() {
  return <LandingPageClient />;
}
