const fs = require('fs');
const path = require('path');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function isoDateFromYear(y) {
  if (!y) return new Date().toISOString();
  try { return new Date(`${y}-01-01`).toISOString(); } catch { return new Date().toISOString(); }
}

function urlJoin(base, p) {
  if (!base.endsWith('/')) base += '/';
  if (p.startsWith('/')) p = p.slice(1);
  return base + p;
}

async function generate() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lincmedia.example.com';
  const pages = [ '/', '/galleries', '/about', '/contact' ];

  // read galleries JSON (safer than evaluating TS files)
  let galleries = [];
  try {
    const j = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'galleries.json'), 'utf8');
    galleries = JSON.parse(j);
  } catch (e) {
    console.warn('Could not read galleries.json:', e.message);
  }

  const parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'];

  // add static pages
  for (const p of pages) {
    parts.push('  <url>');
    parts.push(`    <loc>${urlJoin(siteUrl, p)}</loc>`);
    parts.push(`    <lastmod>${new Date().toISOString()}</lastmod>`);
    parts.push('  </url>');
  }

  // add gallery pages with image entries and lastmod from gallery.year
  for (const g of galleries) {
    const slug = slugify(g.title || 'gallery');
    const pageUrl = urlJoin(siteUrl, `galleries/${slug}`);
    parts.push('  <url>');
    parts.push(`    <loc>${pageUrl}</loc>`);
    parts.push(`    <lastmod>${isoDateFromYear(g.year)}</lastmod>`);
    // include the gallery cover as an image, and include each gallery image as image entries
    const images = [];
    if (g.image) images.push({ url: g.image, title: g.title });
    if (Array.isArray(g.images)) {
      for (const im of g.images) images.push({ url: im.src, title: im.title });
    }
    for (const im of images.slice(0, 50)) { // sitemap limits may vary; cap to 50 to be safe
      parts.push('    <image:image>');
      parts.push(`      <image:loc>${im.url}</image:loc>`);
      if (im.title) parts.push(`      <image:caption>${escapeXml(im.title)}</image:caption>`);
      parts.push('    </image:image>');
    }
    parts.push('  </url>');
  }

  parts.push('</urlset>');
  ensureDir(path.join(process.cwd(), 'public'));
  const dest = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(dest, parts.join('\n'));
  console.log('Wrote', dest);
}

function escapeXml(s) { return String(s).replace(/[<>&"']/g, function (c) { return { '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":"&apos;" }[c]; }); }

generate().catch(e => { console.error(e); process.exit(1); });
