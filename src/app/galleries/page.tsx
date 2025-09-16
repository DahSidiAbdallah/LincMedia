import { allGalleryImages, galleries } from '@/data/galleries';
import GalleriesClient from '@/components/galleries/GalleriesClient';

// Build unified items for the lightbox referencing the flattened index.
const allImages = allGalleryImages();

export default function GalleriesPage() {
  // This is a server component that prepares data for the client component.
  return <GalleriesClient allImages={allImages} galleries={galleries} />;
}

export const metadata = {
  title: 'Galleries — LINC MEDIA',
  description: 'Browse featured galleries from LINC MEDIA — portraits, landscapes, street photography and more.',
};

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
  className="group relative overflow-hidden rounded-md md:rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground shadow-sm hover:shadow-md transition-[box-shadow,transform] aspect-[3/2]"
      aria-label={`Open ${img.gallery} image ${img.title}`}
    >
      <div className={`absolute inset-0 transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'} bg-muted animate-pulse`} />
      <Image
        src={img.src}
        alt={img.title}
        /* Removed incorrect fill any-cast; explicit intrinsic sizing via width/height */
  width={600}
  height={400}
  sizes="(max-width:480px) 50vw,(max-width:768px) 33vw,(max-width:1280px) 25vw,20vw"
  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08] will-change-transform"
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
