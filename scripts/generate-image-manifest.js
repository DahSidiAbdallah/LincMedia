const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

// Read galleries list from src/components/sections/product-showcase.tsx by requiring a small JSON
const galleries = [
  { title: 'Portraits in the City', image: 'https://picsum.photos/800/600?random=1', year: 2023, category: 'Portrait' },
  { title: 'Coastal Landscapes', image: 'https://picsum.photos/800/600?random=2', year: 2022, category: 'Landscape' },
  { title: 'Urban Life', image: 'https://picsum.photos/800/600?random=3', year: 2024, category: 'Street' },
  { title: 'Mountain Vistas', image: 'https://picsum.photos/800/600?random=4', year: 2021, category: 'Landscape' },
  { title: 'Lakeside Reflections', image: 'https://picsum.photos/800/600?random=5', year: 2023, category: 'Nature' },
  { title: 'Desert Light', image: 'https://picsum.photos/800/600?random=6', year: 2022, category: 'Landscape' },
];

async function generate() {
  const out = [];
  for (const g of galleries) {
    try {
      const res = await fetch(g.image);
      const buffer = await res.buffer();
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const blur = await image.resize(20).blur(1).toBuffer();
      // try to extract a simple dominant color using stats
      let dominantColor = null;
      try {
        const stats = await image.resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
        const data = stats.data;
        let r = 0, gg = 0, b = 0, count = 0;
        for (let p = 0; p < data.length; p += stats.info.channels) {
          r += data[p]; gg += data[p + 1]; b += data[p + 2]; count++;
        }
        if (count) {
          r = Math.round(r / count); gg = Math.round(gg / count); b = Math.round(b / count);
          dominantColor = `rgb(${r}, ${gg}, ${b})`;
        }
      } catch {
        /* ignore */
      }
      const blurDataURL = `data:image/jpeg;base64,${blur.toString('base64')}`;
      // parse a few useful EXIF fields when available
      let parsedExif = null;
      if (metadata.exif) {
        try {
          const exifParser = require('exif-parser').create(metadata.exif);
          const tags = exifParser.parse();
          parsedExif = {
            aperture: tags.tags && tags.tags.FNumber ? `f/${tags.tags.FNumber}` : undefined,
            focalLength: tags.tags && tags.tags.FocalLength ? `${tags.tags.FocalLength}mm` : undefined,
            iso: tags.tags && tags.tags.ISO ? `${tags.tags.ISO}` : undefined,
            shutter: tags.tags && tags.tags.ExposureTime ? `${tags.tags.ExposureTime}s` : undefined,
          };
        } catch {
          /* ignore */
        }
      }

      out.push({
        title: g.title,
        image: g.image,
        w: metadata.width || 1600,
        h: metadata.height || 1200,
        year: g.year,
        category: g.category,
        exif: metadata.exif ? metadata.exif : null,
        parsedExif,
        blurDataURL,
        dominantColor,
      });
      console.log('Processed', g.title);
    } catch (e) {
      console.error('Failed', g.title, e.message);
      out.push({ title: g.title, image: g.image, w: 1600, h: 1200, blurDataURL: null, exif: null });
    }
  }
  const dest = path.join(process.cwd(), 'public', 'image-manifest.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log('Wrote', dest);
}

generate().catch(e => { console.error(e); process.exit(1); });
