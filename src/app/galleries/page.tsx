"use client";
import React, { useState, useMemo } from 'react';
import { allGalleryImages, galleries } from '@/data/galleries';
import GalleryLightbox from '@/components/ui/gallery-lightbox';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import Image from 'next/image';

// Build unified items for the lightbox referencing the flattened index.
const allImages = allGalleryImages();

export default function GalleriesPage() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const categories = useMemo(() => Array.from(new Set(galleries.map(g => g.category))), []);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setIndex(0);
  };
  const clearCats = () => { setSelectedCats([]); setIndex(0); };
  const filteredImages = selectedCats.length ? allImages.filter(i => selectedCats.includes(i.category)) : allImages;

  // items for lightbox (map to shape expected by GalleryLightbox)
  const items = filteredImages.map(img => ({
    src: img.src,
    title: `${img.gallery} — ${img.title}`,
    caption: `${img.gallery} • ${img.category}`,
    w: 1600,
    h: 1200,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <a href="/" className="hover:text-foreground focus:outline-none focus:underline">Home</a>
            </li>
            <li className="select-none" aria-hidden>/</li>
            <li className="text-foreground font-medium" aria-current="page">Galleries</li>
          </ol>
        </nav>
        <AnimatedWrapper>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">All Galleries</h1>
          <p className="text-muted-foreground max-w-2xl mb-12">A consolidated view of every featured gallery. Click any thumbnail to open the immersive lightbox experience and navigate through all images seamlessly.</p>
        </AnimatedWrapper>
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <button onClick={clearCats} className={`px-3 py-1 rounded-md text-sm transition ${selectedCats.length === 0 ? 'bg-foreground text-background' : 'bg-muted-foreground/10 hover:bg-muted-foreground/20'}`}>All</button>
            {categories.map(cat => {
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  aria-pressed={active}
                  className={`px-3 py-1 rounded-md text-sm border transition ${active ? 'bg-foreground text-background border-foreground' : 'bg-muted-foreground/10 hover:bg-muted-foreground/20 border-transparent'}`}
                >{cat}</button>
              );
            })}
            {selectedCats.length > 0 && (
              <button onClick={clearCats} className="text-xs ml-2 underline text-muted-foreground hover:text-foreground">Clear</button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{filteredImages.length} images</span>
          </div>
          {selectedCats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedCats.map(cat => (
                <span key={cat} className="flex items-center gap-1 bg-foreground/5 border border-foreground/20 rounded-full px-3 py-1 text-xs anim-filter-enter">
                  {cat}
                  <button aria-label={`Remove ${cat}`} onClick={() => toggleCat(cat)} className="hover:text-destructive focus:outline-none">×</button>
                </span>
              ))}
              <button onClick={clearCats} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 filter-anim-container">
          {filteredImages.map((img, i) => (
            <GalleryThumb
              key={img.src + i}
              img={img}
              index={i}
              onOpen={(idx) => { setIndex(idx); setOpen(true); }}
            />
          ))}
        </div>
      </div>

      <GalleryLightbox
        items={items}
        open={open}
        index={index}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

interface ThumbProps {
  img: (typeof allImages)[number];
  index: number;
  onOpen: (i: number) => void;
}

const GalleryThumb: React.FC<ThumbProps> = ({ img, index, onOpen }) => {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <button
      onClick={() => onOpen(index)}
      className="group relative overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
      style={{ aspectRatio: '4/3' }}
      aria-label={`Open ${img.gallery} image ${img.title}`}
    >
      <div className={`absolute inset-0 transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'} bg-muted animate-pulse`} />
      <Image
        src={img.src}
        alt={img.title}
        fill={false as any}
        width={600}
        height={450}
        sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 15vw"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        onLoadingComplete={() => setLoaded(true)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
      <div className="absolute bottom-0 left-0 right-0 p-2 text-xs font-medium text-white/0 group-hover:text-white group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100 transition-all">
        {img.gallery}
        <span className="block text-[10px] font-normal opacity-80">{img.title}</span>
      </div>
    </button>
  );
};
