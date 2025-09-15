import { galleries } from '@/data/galleries';
import Image from 'next/image';
import type { Metadata } from 'next';

type Props = { params: { slug: string } };

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export async function generateStaticParams() {
  return galleries.map(g => ({ slug: slugify(g.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata | undefined> {
  const gallery = galleries.find(g => slugify(g.title) === params.slug);
  if (!gallery) return { title: 'Gallery' };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lincmedia.example.com';
  const url = `${siteUrl}/galleries/${params.slug}`;
  return {
    title: `${gallery.title} — LINC MEDIA`,
    description: `${gallery.title} — ${gallery.category}. Browse the gallery of ${gallery.images.length} images.`,
    openGraph: {
      title: `${gallery.title} — LINC MEDIA`,
      description: `${gallery.title} — ${gallery.category}. Browse the gallery of ${gallery.images.length} images.`,
      url,
      images: gallery.images.length ? [{ url: gallery.images[0].src, width: 1200, height: 630, alt: gallery.title }] : undefined,
    },
  // lastmod is handled in sitemap generation; keep metadata fields standard for Next
  };
}

export default function GalleryPage({ params }: Readonly<Props>) {
  const gallery = galleries.find(g => slugify(g.title) === params.slug);
  if (!gallery) return (<div className="container mx-auto p-6">Gallery not found</div>);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: gallery.title,
    description: gallery.aiHint || gallery.title,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lincmedia.example.com'}/galleries/${slugify(gallery.title)}`,
    hasPart: gallery.images.map(img => ({ '@type': 'ImageObject', 'contentUrl': img.src, 'name': img.title, 'caption': img.title })),
  } as const;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold mb-4">{gallery.title}</h1>
      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm text-muted-foreground">{gallery.category}</p>
        <p className="text-xs text-muted-foreground">•</p>
        <p className="text-sm text-muted-foreground">{gallery.year}</p>
      </div>
      <h2 className="text-xl font-semibold mb-4">About this gallery</h2>
      <p className="mb-8 text-muted-foreground">{gallery.aiHint || `A curated set of ${gallery.images.length} images showcasing ${gallery.category.toLowerCase()}.`}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {gallery.images.map((img) => (
          <figure key={img.src} className="rounded overflow-hidden">
            <Image src={img.src} alt={img.title || `${gallery.title} image`} width={800} height={600} className="w-full h-auto object-cover" />
            <figcaption className="text-xs text-muted-foreground p-2">{img.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
