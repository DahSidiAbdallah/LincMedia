import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sample a center pixel from an image data URL to approximate a dominant color.
 * This is a light-weight client-side fallback for display while the full image loads.
 */
export async function getDominantColorFromUrl(src: string): Promise<string | null> {
  try {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = () => res(true);
      img.onerror = () => rej(new Error('Image load error'));
    });
    const canvas = document.createElement('canvas');
    const size = 8; // downscale to small sample
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    // average color
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    if (!count) return null;
    r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

export function rgbaFromRgb(rgb: string, alpha = 1) {
  const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgb);
  if (!m) return rgb;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}
