// Central galleries data so multiple components/pages can reuse it.
// If adding local images later, move remote URLs to /public and update domains.
export interface GalleryImage {
  src: string;
  title: string;
  aiHint?: string;
  video?: { src: string; poster?: string; type?: string };
}
export interface GalleryDef {
  title: string;
  category: string;
  image: string; // cover image
  images: GalleryImage[];
  aiHint?: string;
  year?: number;
}

export const galleries: GalleryDef[] = [
  {
    title: 'Portraits in the City',
    category: 'Portrait',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80', title: 'City Portrait 1', aiHint: 'portrait city female' },
      { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1600&q=80', title: 'City Portrait 2', aiHint: 'portrait smile city' },
      { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1600&q=80', title: 'City Portrait 3', aiHint: 'portrait natural light' },
      { src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1600&q=80', title: 'City Portrait 4', aiHint: 'portrait casual' },
      { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1600&q=60&sat=-50', title: 'City Portrait 5', aiHint: 'portrait creative edit' },
      { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1600&q=60&blur=5', title: 'City Portrait 6', aiHint: 'portrait soft focus' },
    ],
    aiHint: 'city portrait',
    year: 2023,
  },
  {
    title: 'Coastal Landscapes',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80', title: 'Coast 1', aiHint: 'coastal sunrise' },
      { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', title: 'Coast 2', aiHint: 'coastal wave' },
      { src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1600&q=80', title: 'Coast 3', aiHint: 'coastal cliffs' },
      { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80', title: 'Coast 4', aiHint: 'coastal golden hour' },
      { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=60&sat=-25', title: 'Coast 5', aiHint: 'coastal moody sea' },
      { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80', title: 'Coast 6', aiHint: 'coastal long exposure' },
    ],
    aiHint: 'coastal landscape',
    year: 2022,
  },
  {
    title: 'Urban Life',
    category: 'Street',
    image: 'https://images.unsplash.com/photo-1499914485622-0000e8b0dc95?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1499914485622-0000e8b0dc95?auto=format&fit=crop&w=1600&q=80', title: 'Urban 1', aiHint: 'street night lights' },
      { src: 'https://images.unsplash.com/photo-1485872299829-6cfb59651d3d?auto=format&fit=crop&w=1600&q=80', title: 'Urban 2', aiHint: 'street candid' },
      { src: 'https://images.unsplash.com/photo-1505150892987-424388e0267b?auto=format&fit=crop&w=1600&q=80', title: 'Urban 3', aiHint: 'street architecture' },
      { src: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1600&q=80', title: 'Urban 4', aiHint: 'street crowd motion' },
      { src: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80', title: 'Urban 5', aiHint: 'street crosswalk rain' },
      { src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80', title: 'Urban 6', aiHint: 'street neon night' },
    ],
    aiHint: 'street photography',
    year: 2024,
  },
  {
    title: 'Wilderness & Forests',
    category: 'Nature',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80', title: 'Forest 1', aiHint: 'forest sunrise' },
      { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80', title: 'Forest 2', aiHint: 'forest mist' },
      { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80', title: 'Forest 3', aiHint: 'forest path' },
      { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=60&sat=-30', title: 'Forest 4', aiHint: 'forest moody' },
      { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=60&blur=5', title: 'Forest 5', aiHint: 'forest soft' },
      { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80', title: 'Forest 6', aiHint: 'forest waterfall' },
    ],
    aiHint: 'forest nature',
    year: 2021,
  },
  {
    title: 'Aerial Perspectives',
    category: 'Aerial',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80', title: 'Aerial 1', aiHint: 'aerial waterfall' },
      { src: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1600&q=80', title: 'Aerial 2', aiHint: 'aerial coast' },
      { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80', title: 'Aerial 3', aiHint: 'aerial desert' },
      { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80', title: 'Aerial 4', aiHint: 'aerial ocean' },
      { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=60&sat=-20', title: 'Aerial 5', aiHint: 'aerial forest edit' },
      { src: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1600&q=80', title: 'Aerial 6', aiHint: 'aerial cityscape' },
    ],
    aiHint: 'aerial drone',
    year: 2024,
  },
  {
    title: 'Night & Astro',
    category: 'Astro',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    images: [
      { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80', title: 'Astro 1', aiHint: 'night sky milky way' },
      { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=60&sat=-15', title: 'Astro 2', aiHint: 'night desert stars' },
      { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=60&blur=4', title: 'Astro 3', aiHint: 'night dreamy' },
      { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=60&sat=-50', title: 'Astro 4', aiHint: 'night forest stars' },
      { src: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80', title: 'Astro 5', aiHint: 'night rain city' },
      { src: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1600&q=80&sat=-25', title: 'Astro 6', aiHint: 'night aerial city' },
    ],
    aiHint: 'night sky astro',
    year: 2025,
  },
];

export function allGalleryImages() {
  return galleries.flatMap(g => g.images.map(img => ({ ...img, gallery: g.title, category: g.category })));
}
