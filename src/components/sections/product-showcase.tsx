"use client";

import Image from 'next/image';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import { Button } from '../ui/button';
import FlipCard from '@/components/ui/flip-card';
import GalleryLightbox from '@/components/ui/gallery-lightbox';

// Real Unsplash photos for each gallery. Each entry includes a cover image
// and several related slides from the same theme.
const galleries = [
  {
    title: 'Portraits in the City',
    category: 'Portrait',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80',
        title: 'City Portrait 1',
        aiHint: 'city portrait',
      },
      {
        src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1600&q=80',
        title: 'City Portrait 2',
        aiHint: 'city portrait',
      },
      {
        src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1600&q=80',
        title: 'City Portrait 3',
        aiHint: 'city portrait',
      },
    ],
    aiHint: 'city portrait',
    year: 2023,
  },
  {
    title: 'Coastal Landscapes',
    category: 'Landscape',
    image:
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80',
        title: 'Coast 1',
        aiHint: 'coastal',
      },
      {
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        title: 'Coast 2',
        aiHint: 'coastal',
      },
      {
        src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1600&q=80',
        title: 'Coast 3',
        aiHint: 'coastal',
      },
    ],
    aiHint: 'coastal landscape',
    year: 2022,
  },
  {
    title: 'Urban Life',
    category: 'Street',
    image:
      'https://images.unsplash.com/photo-1499914485622-0000e8b0dc95?auto=format&fit=crop&w=800&q=80',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1499914485622-0000e8b0dc95?auto=format&fit=crop&w=1600&q=80',
        title: 'Urban 1',
        aiHint: 'street',
      },
      {
        src: 'https://images.unsplash.com/photo-1485872299829-6cfb59651d3d?auto=format&fit=crop&w=1600&q=80',
        title: 'Urban 2',
        aiHint: 'street',
      },
      {
        src: 'https://images.unsplash.com/photo-1505150892987-424388e0267b?auto=format&fit=crop&w=1600&q=80',
        title: 'Urban 3',
        aiHint: 'street',
      },
    ],
    aiHint: 'street photography',
    year: 2024,
  },
];

import React, { useState, useEffect } from 'react';
import { getDominantColorFromUrl, rgbaFromRgb } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

// Left panel component (moved outside to satisfy lint rule)
const PhotoLeftPanel: React.FC = () => {
  const [item, setItem] = useState<any>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [fadeKey, setFadeKey] = useState<string>('');

  useEffect(() => {
    const handler = (e: any) => {
      const newItem = e.detail?.item || null;
      const newIdx = typeof e.detail?.index === 'number' ? e.detail.index : null;
      const newTotal = typeof e.detail?.total === 'number' ? e.detail.total : 0;
      setTotal(newTotal);
      setFadeKey(`${newIdx}-${newItem?.src || newItem?.video?.src || 'none'}`);
  setItem(newItem);
  setIdx(newIdx);
  // always reset to front when slide changes
  setIsFlipped(false);
    };
    window.addEventListener('pswp-slide-change', handler);
    try {
      const gItem = (window as any).__photoSwipeCurrentItem || null;
      const gIdx = (window as any).__photoSwipeCurrentIndex ?? null;
      const gTotal = (window as any).__photoSwipeTotal ?? 0;
      setItem(gItem);
      setIdx(gIdx);
      setTotal(gTotal);
      setFadeKey(`${gIdx}-${gItem?.src || gItem?.video?.src || 'none'}`);
    } catch {}
    return () => window.removeEventListener('pswp-slide-change', handler);
  }, []);

  // Allow the global "Info" control inside the panel to flip the card
  useEffect(() => {
    const onToggleInfo = () => setIsFlipped(s => !s);
    window.addEventListener('pswp-toggle-info', onToggleInfo as any);
    return () => window.removeEventListener('pswp-toggle-info', onToggleInfo as any);
  }, []);

  // do not auto-flip based on item presence anymore

  const isVideo = !!item?.video;
  const progress = idx !== null && total > 0 ? (idx + 1) / total : 0;
  const items: any[] = (typeof window !== 'undefined' && (window as any).__photoSwipeItems) || [];
  const thumbContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({});
  const formatTime = (sec: number) => {
    if (!isFinite(sec)) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  // helper to register a video's duration (reduces nesting depth)
  const registerVideoDuration = React.useCallback((src: string) => {
    if (videoDurations[src]) return;
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = src;
    v.onloadedmetadata = () => {
      setVideoDurations(prev => ({ ...prev, [src]: formatTime(v.duration) }));
    };
  }, [videoDurations]);
  React.useEffect(() => {
    items.filter(it => it.video).forEach(it => registerVideoDuration(it.video.src));
  }, [items, registerVideoDuration]);
  React.useEffect(() => {
    if (!thumbContainerRef.current) return;
    const els = Array.from(thumbContainerRef.current.querySelectorAll('img[data-src]'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(img => { (img as HTMLImageElement).src = (img as HTMLImageElement).dataset.src || ''; });
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
        io.unobserve(entry.target);
      });
    }, { root: thumbContainerRef.current, threshold: 0.1 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [items, fadeKey]);
  const onThumbKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!thumbContainerRef.current) return;
    const buttons = Array.from(thumbContainerRef.current.querySelectorAll<HTMLButtonElement>('button[data-thumb]'));
    const currentIndex = buttons.findIndex(b => b === document.activeElement);
    if (currentIndex === -1) return;
    const cols = 5;
    let t: number | null = null;
    switch (e.key) {
      case 'ArrowRight': t = Math.min(buttons.length - 1, currentIndex + 1); break;
      case 'ArrowLeft': t = Math.max(0, currentIndex - 1); break;
      case 'ArrowDown': t = Math.min(buttons.length - 1, currentIndex + cols); break;
      case 'ArrowUp': t = Math.max(0, currentIndex - cols); break;
      case 'Home': t = 0; break;
      case 'End': t = buttons.length - 1; break;
      case 'Enter': case ' ': buttons[currentIndex]?.click(); e.preventDefault(); return;
      default: return;
    }
    if (t !== null) {
      buttons[t]?.focus();
      e.preventDefault();
    }
  };
  if (!item) return <div />;
  const gotoSlide = (i: number) => {
    try {
      const api = (window as any)?.__photoSwipeInstance || (window as any)?.pswpRef?.current?.pswp;
      api?.goTo?.(i);
    } catch {}
  };
  return (
    <div className="relative h-full flex flex-col">
      <div className="text-xs tracking-wide uppercase text-muted-foreground mb-2">{idx !== null && total ? `Slide ${idx + 1} / ${total}` : ''}</div>
      <div className="h-1 w-full bg-muted/30 rounded overflow-hidden mb-4"><div className="h-full bg-foreground transition-all duration-500" style={{ width: `${progress * 100}%` }} /></div>
      {items.length > 1 && (
        <div ref={thumbContainerRef} className="grid grid-cols-5 gap-1 mb-3 pr-2 overflow-y-auto max-h-32" role="grid" tabIndex={0} onKeyDown={onThumbKey} aria-label="Gallery thumbnails">
          {items.map((it, i) => {
            const k = it.src || it.video?.src || it.video?.poster || `item-${i}`;
            return (
            <button
              key={k}
              onClick={() => gotoSlide(i)}
              className={`relative group border ${i === idx ? 'border-foreground' : 'border-transparent'} focus:outline-none focus:ring-1 focus:ring-foreground`}
              style={{ aspectRatio: '1/1' }}
              aria-label={`Go to slide ${i + 1}`}
              data-thumb
            >
              {it.video ? (
                <img data-src={it.video.poster || it.video.src} alt={it.title || ''} className="object-cover w-full h-full opacity-80 group-hover:opacity-100" />
              ) : (
                <img data-src={it.src} alt={it.title || ''} className="object-cover w-full h-full opacity-80 group-hover:opacity-100" />
              )}
              {it.video && videoDurations[it.video.src] && (
                <span className="absolute bottom-0 right-0 m-0.5 px-1 py-0.5 text-[10px] leading-none rounded bg-black/70 text-white font-medium">{videoDurations[it.video.src]}</span>
              )}
              <span className="absolute inset-0 ring-2 ring-offset-1 ring-foreground/0 group-hover:ring-foreground/40 transition" />
            </button>
          );})}
        </div>
      )}
  <FlipCard isFlipped={isFlipped} onToggle={() => setIsFlipped(s => !s)} disableOverlay frontClassName="p-2" backClassName="p-2 bg-background space-y-3">
        <div
          key={fadeKey + '-front'}
          className="p-2 animate-fade fade-enter"
          onClick={(e) => { e.stopPropagation(); if (idx !== null) gotoSlide(idx); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (idx !== null) gotoSlide(idx); } }}
          aria-label="Show this image on the right"
        >
          {isVideo ? (
            <div className="relative">
              <video id="pswp-active-video" src={item.video.src} poster={item.video.poster} controls playsInline className="w-full max-h-64 object-contain rounded peer">
                <track kind="captions" label="Captions" />
              </video>
              <button
                type="button"
                onClick={() => {
                  const v = document.getElementById('pswp-active-video') as HTMLVideoElement | null;
                  if (!v) return;
                  if (v.paused) { v.play(); } else { v.pause(); }
                }}
                className="absolute inset-0 flex items-center justify-center text-white/80 opacity-0 peer-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition bg-black/0 hover:bg-black/20"
                aria-label="Toggle video playback"
              >
                <span className="px-2 py-1 text-xs rounded bg-black/60 backdrop-blur-sm">Play / Pause</span>
              </button>
            </div>
          ) : (
            <img src={item.src} alt={item.title} className="w-full object-cover rounded" />
          )}
          <div className="mt-2 font-semibold">{item.title}</div>
        </div>
        <div key={fadeKey + '-back'} className="space-y-3 animate-fade fade-enter">
          <h3 className="text-lg font-bold">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.caption}</p>
          <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{idx !== null ? `Item ${idx + 1}` : ''}</div>
          {isVideo && <div className="text-xs text-muted-foreground">Video • Tap play to watch</div>}
        </div>
      </FlipCard>
    </div>
  );
};

const ProductShowcase = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const [manifestMap, setManifestMap] = useState<Record<string, any>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams?.get('category') || '';

  const categories = Array.from(new Set(galleries.map(g => g.category)));

  const setCategoryFilter = (cat: string) => {
    const url = new URL(window.location.href);
    if (!cat) url.searchParams.delete('category'); else url.searchParams.set('category', cat);
    // push state so filter persists
    window.history.pushState({}, '', url.toString());
    // trigger a navigation to update search params hook
    router.replace(url.pathname + url.search);
  };

  // dominant colors per index
  const [dominantMap, setDominantMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/image-manifest.json');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const map: Record<string, any> = {};
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
  const galleryItemsFor = (idx: number) => {
    const g = galleries[idx];
    if (!g) return [];
    return (g.images || [{ src: g.image, title: g.title }]).map((it: any) => {
      const m = manifestMap[it.src] || manifestMap[g.image] || {};
      return {
        src: it.src,
        video: it.video,
        w: m?.w || 1600,
        h: m?.h || 1200,
        title: it.title || g.title,
        caption: it.title || g.title,
        exif: m?.parsedExif || null,
        blurDataURL: m?.blurDataURL || null,
      };
    });
  };

  // leftPanelNode removed; leftPanel is created inline when opening the lightbox

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedWrapper>
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              FEATURED
              <br />
              GALLERIES
            </h2>
            <p className="text-6xl md:text-8xl font-bold text-muted-foreground/30">(06)</p>
          </div>
        </AnimatedWrapper>

        <div className="mb-6">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <button className={`px-2 py-1 rounded ${!categoryFilter ? 'bg-foreground text-background' : 'bg-muted-foreground/10'}`} onClick={() => setCategoryFilter('')}>All</button>
            {categories.map(cat => (
              <button key={cat} className={`px-2 py-1 rounded ${categoryFilter === cat ? 'bg-foreground text-background' : 'bg-muted-foreground/10'}`} onClick={() => setCategoryFilter(cat)}>{cat}</button>
            ))}
          </div>
        </div>
        {/* shared GalleryLightbox for the selected gallery */}
        <GalleryLightbox
          items={activeGallery !== null ? galleryItemsFor(activeGallery) : []}
          index={photoIndex}
          open={activeGallery !== null}
          onClose={() => { setActiveGallery(null); setPhotoIndex(0); }}
          leftPanel={activeGallery !== null ? <PhotoLeftPanel /> : null}
        />

        <div className="grid md:grid-cols-2 gap-8">
      {galleries.filter(g => !categoryFilter || g.category === categoryFilter).map((gallery, index) => (
            <AnimatedWrapper key={gallery.title} delay={`${index * 100}ms`}>
  <FlipCard disableOverlay isFlipped={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} className="group">
                <div className="group">
                  <div className="overflow-hidden mb-4">
        <a
      href={gallery.image}
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveGallery(index); setPhotoIndex(0); }}
  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); setActiveGallery(index); setPhotoIndex(0); } }}
            tabIndex={0}
            aria-label={`Open ${gallery.title}`}
                    > 
                      <div className="relative">
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
                          className="w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105 relative"
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
                  <h3 className="text-xl font-semibold">{gallery.title}</h3>
                  <p className="text-muted-foreground">{gallery.category}</p>
                </div>

                <div className="p-6 bg-background h-full">
                  <h2 className="text-2xl font-bold mb-2">{gallery.title}</h2>
                  <p className="mb-4 text-muted-foreground">{gallery.category} &middot; {gallery.year}</p>
                  <p className="text-muted-foreground">Brief description of the gallery and highlights. (Replace with real content.)</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => window.open('#', '_blank')}>View Gallery</Button>
                  </div>
                </div>
              </FlipCard>
            </AnimatedWrapper>
          ))}
        </div>
        <AnimatedWrapper className="text-center mt-16">
          <FlipCard disableOverlay isFlipped={openIndex === -1} onToggle={() => setOpenIndex(openIndex === -1 ? null : -1)}>
            <div className="p-6">
              <Button variant="outline">View All Galleries</Button>
            </div>
            <div className="p-6 bg-background">
              <h2 className="text-3xl font-bold mb-4">All Galleries</h2>
              <p>Here you can display a list or grid of all galleries, or link to a dedicated galleries page.</p>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => setOpenIndex(null)}>Close</Button>
              </div>
            </div>
          </FlipCard>
        </AnimatedWrapper>
      </div>
    </section>
  );
};

export default ProductShowcase;
