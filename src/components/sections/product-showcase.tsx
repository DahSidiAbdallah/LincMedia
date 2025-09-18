"use client";

import Image from 'next/image';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import Breadcrumb from '@/components/ui/breadcrumb';
import { Button } from '../ui/button';
const FlipCard = dynamic(() => import('@/components/ui/flip-card'), { ssr: false });
import dynamic from 'next/dynamic';
// Dynamically load the heavy lightbox component on the client only
const GalleryLightbox = dynamic(() => import('@/components/ui/gallery-lightbox'), { ssr: false });
// types used by this module (import types only during build-time)
import type { GalleryLightboxItem, ExifData } from '@/components/ui/gallery-lightbox';
import { galleries } from '@/data/galleries';


import React, { useState, useEffect, Suspense } from 'react';
import { getDominantColorFromUrl, rgbaFromRgb } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

const ProductShowcaseInner = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  interface ManifestEntry { image: string; w?: number; h?: number; blurDataURL?: string; parsedExif?: ExifData | (Record<string, unknown> & Partial<ExifData>); dominantColor?: string }
  const [manifestMap, setManifestMap] = useState<Record<string, ManifestEntry>>({});
  const searchParams = useSearchParams();
  const initialCats = (() => {
    const raw = searchParams?.get('cats');
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  })();
  const [categoryFilters, setCategoryFilters] = useState<string[]>(initialCats);

  const categories = Array.from(new Set(galleries.map(g => g.category)));

  const toggleCategory = (cat: string) => {
    setCategoryFilters(prev => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter(c => c !== cat) : [...prev, cat];
      try {
        const url = new URL(window.location.href);
        if (next.length === 0) url.searchParams.delete('cats'); else url.searchParams.set('cats', next.join(','));
        window.history.replaceState({}, '', url.toString());
      } catch {}
      return next;
    });
  };

  const clearAllCategories = () => {
    setCategoryFilters([]);
    try { const url = new URL(window.location.href); url.searchParams.delete('cats'); window.history.replaceState({}, '', url.toString()); } catch {}
  };

  // (legacy single-category filter function removed in favor of multi-select)

  // dominant colors per index
  const [dominantMap, setDominantMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/image-manifest.json');
        if (!res.ok) return;
        const data: ManifestEntry[] = await res.json();
        if (!mounted) return;
        const map: Record<string, ManifestEntry> = {};
        for (const entry of data) {
          if (entry.image) map[entry.image] = entry;
        }
        setManifestMap(map);
      } catch {
        // ignore manifest errors and keep fallback behavior
      }
    })();
    return () => { mounted = false; };
  }, []);

  // removed unused lightboxOpen/lightboxIndex state (handled by activeGallery + photoIndex)
  const [activeGallery, setActiveGallery] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});

  // build items for the currently selected gallery (selected by index)
  interface LightboxBuildItem extends GalleryLightboxItem { w: number; h: number; title: string; caption: string; exif: ExifData | null; blurDataURL: string | null }
  const galleryItemsFor = (idx: number): LightboxBuildItem[] => {
    const g = galleries[idx];
    if (!g) return [];
    return (g.images || [{ src: g.image, title: g.title }]).map((it) => {
      const m = manifestMap[it.src] || manifestMap[g.image] || ({} as ManifestEntry);
      return {
        src: it.src,
        video: it.video,
        w: m?.w || 1600,
        h: m?.h || 1200,
        title: it.title || g.title,
        caption: it.title || g.title,
  exif: (m?.parsedExif as ExifData | undefined) || null,
        blurDataURL: m?.blurDataURL || null,
      };
    });
  };

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedWrapper>
          <Breadcrumb className="mb-6" items={[{ label: 'Home', href: '/' }, { label: 'Featured Galleries' }]} />
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              FEATURED
              <br />
              GALLERIES
            </h2>
            <p className="text-6xl md:text-8xl font-bold text-muted-foreground/30">({galleries.length.toString().padStart(2,'0')})</p>
          </div>
        </AnimatedWrapper>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <button
              className={`px-2 py-1 rounded ${categoryFilters.length === 0 ? 'bg-foreground text-background' : 'bg-muted-foreground/10 hover:bg-muted-foreground/20'}`}
              onClick={clearAllCategories}
            >All</button>
            {categories.map(cat => {
              const active = categoryFilters.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2 py-1 rounded border transition ${active ? 'bg-foreground text-background border-foreground' : 'bg-muted-foreground/10 hover:bg-muted-foreground/20 border-transparent'}`}
                  aria-pressed={active}
                >{cat}</button>
              );
            })}
            {categoryFilters.length > 0 && (
              <button onClick={clearAllCategories} className="text-xs ml-2 underline text-muted-foreground hover:text-foreground">Clear</button>
            )}
          </div>
          {categoryFilters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categoryFilters.map(cat => (
                <span key={cat} className="flex items-center gap-1 bg-foreground/5 border border-foreground/20 rounded-full px-3 py-1 text-xs anim-filter-enter">
                  {cat}
                  <button
                    aria-label={`Remove ${cat}`}
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-destructive focus:outline-none"
                  >×</button>
                </span>
              ))}
              <button onClick={clearAllCategories} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
            </div>
          )}
        </div>
        {/* shared GalleryLightbox for the selected gallery */}
        <GalleryLightbox
          items={(activeGallery !== null ? galleryItemsFor(activeGallery) : [])}
          index={photoIndex}
          open={activeGallery !== null}
          onClose={() => { setActiveGallery(null); setPhotoIndex(0); }}
          hidePanelBelow={600}
        />

  <div className="grid md:grid-cols-2 gap-8 items-stretch filter-anim-container">
      {galleries.filter(g => (categoryFilters.length === 0 || categoryFilters.includes(g.category))).map((gallery, index) => (
            <AnimatedWrapper key={gallery.title} delay={`${index * 60}ms`} className="anim-filter-enter">
  <FlipCard disableOverlay isFlipped={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} className="group h-full flex flex-col">
                <div className="group flex flex-col h-full">
                  <div className="overflow-hidden mb-4">
        <a
      href={gallery.image}
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveGallery(index); setPhotoIndex(0); }}
  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); setActiveGallery(index); setPhotoIndex(0); } }}
            tabIndex={0}
            aria-label={`Open ${gallery.title}`}
                    > 
                      <div className="relative rounded-md overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        {/** compute placeholder URL to avoid nested template strings */}
                        {/** eslint-disable-next-line @typescript-eslint/no-shadow */}
                        {/* placeholderUrl */}
                        {/**/}
                        
                        {/* placeholderUrl calculation */}
                        {(() => {
                          const placeholderUrl = manifestMap[gallery.image]?.blurDataURL || `https://picsum.photos/seed/${index}/40/30`;
                          const dominant = dominantMap[index] || manifestMap[gallery.image]?.dominantColor || null;
                          const frameStyle: React.CSSProperties = dominant ? { background: rgbaFromRgb(dominant, 0.12) } : {};
                          return (
                            <>
                              <div
                                className={"absolute inset-0 bg-center bg-cover filter blur-sm transition-opacity duration-500" + (loadedMap[index] ? ' opacity-0' : ' opacity-100')}
                                style={{ backgroundImage: `url(${placeholderUrl})` }}
                                aria-hidden
                              />
                              <div className="absolute inset-0 rounded-md" style={frameStyle} aria-hidden />
                            </>
                          );
                        })()}
                        <Image
                          src={gallery.image}
                          alt={gallery.title}
                          data-ai-hint={gallery.aiHint}
                          width={800}
                          height={600}
                          sizes="(max-width: 640px) 100vw, 50vw"
                          placeholder={manifestMap[gallery.image]?.blurDataURL ? 'blur' : undefined}
                          blurDataURL={manifestMap[gallery.image]?.blurDataURL}
                          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                          onLoad={async () => {
                            setLoadedMap(prev => ({ ...prev, [index]: true }));
                            // compute dominant color lazily if missing
                            if (!dominantMap[index]) {
                              const src = manifestMap[gallery.image]?.blurDataURL || gallery.image;
                              const color = await getDominantColorFromUrl(src).catch(() => null);
                              if (color) setDominantMap(prev => ({ ...prev, [index]: color }));
                            }
                          }}
                          loading="lazy"
                        />
                      </div>
                    </a>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mt-2">{gallery.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{gallery.category}</p>
                </div>

                <div className="p-6 bg-background h-full flex flex-col">
                  <h2 className="text-2xl font-bold mb-2">{gallery.title}</h2>
                  <p className="mb-4 text-muted-foreground">{gallery.category} &middot; {gallery.year}</p>
                  <p className="text-muted-foreground">A curated selection from {gallery.title} exploring {gallery.category.toLowerCase()} themes through six cohesive visuals.</p>
                  <div className="mt-4 flex gap-2 mt-auto">
                    <Button variant="outline" onClick={() => window.open('#', '_blank')}>View Gallery</Button>
                  </div>
                </div>
              </FlipCard>
            </AnimatedWrapper>
          ))}
        </div>
        <AnimatedWrapper className="text-center mt-16">
          <Button variant="outline" onClick={() => { window.location.href = '/galleries'; }}>
            View All Galleries
          </Button>
        </AnimatedWrapper>
      </div>
    </section>
  );
};

// Export wrapped in Suspense to allow useSearchParams inside client component per Next.js requirement
const ProductShowcase = () => {
  return (
    <Suspense fallback={<section className="py-20 md:py-32"><div className="container mx-auto text-sm opacity-60">Loading gallery...</div></section>}>
      <ProductShowcaseInner />
    </Suspense>
  );
};

export default ProductShowcase;
