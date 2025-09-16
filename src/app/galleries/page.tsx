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

