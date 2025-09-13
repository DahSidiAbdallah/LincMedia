"use client";

import * as React from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import ReactDOM from 'react-dom/client';

type Item = {
  src?: string; // image source (optional if video/html provided)
  w?: number;
  h?: number;
  title?: string;
  caption?: string;
  exif?: Record<string, any> | null;
  blurDataURL?: string | null;
  // simple video support
  video?: {
    src: string;
    poster?: string;
    type?: string; // e.g. 'video/mp4'
  };
  // allow providing raw html (advanced usage)
  html?: string;
};

interface GalleryLightboxProps {
  items: Item[];
  index?: number;
  open?: boolean;
  onClose?: () => void;
  leftPanel?: React.ReactNode;
  category?: string;
  // width (px) below which the left panel is hidden & padding removed
  hidePanelBelow?: number;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({ items, index = 0, open = false, onClose, leftPanel, category, hidePanelBelow = 560 }) => {
  // keep a weakly-typed ref without using raw `any` to satisfy lint
  const pswpRef = React.useRef<unknown>(null);
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!placeholderRef.current) return;

  const dataSource = items.map((it) => {
      // Build title/exif HTML
      const captionHtml = it.caption ? `<div class=\"pswp-caption\"><strong>${it.caption}</strong></div>` : '';
      let exifHtml = '';
      if (it.exif) {
        const parts: string[] = [];
        if (it.exif.aperture) parts.push(`Aperture: ${it.exif.aperture}`);
        if (it.exif.focalLength) parts.push(`Focal: ${it.exif.focalLength}`);
        if (it.exif.iso) parts.push(`ISO: ${it.exif.iso}`);
        if (it.exif.shutter) parts.push(`Shutter: ${it.exif.shutter}`);
        if (parts.length) exifHtml = `<div class=\"pswp-exif\">${parts.join(' &nbsp; | &nbsp; ')}</div>`;
      }
      const titleHtml = `${captionHtml}${exifHtml}`;
      // Video or custom html slide
      if (it.video) {
        const posterAttr = it.video.poster ? `poster=\"${it.video.poster}\"` : '';
        const typeAttr = it.video.type ? `type=\"${it.video.type}\"` : 'type=\"video/mp4\"';
        const html = it.html || `
          <div class=\"pswp-video-wrapper\" style=\"display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#000;\">
            <video class=\"max-h-full max-w-full\" controls playsinline ${posterAttr} preload=\"metadata\"> 
              <source src=\"${it.video.src}\" ${typeAttr} />
              Your browser does not support the video tag.
            </video>
          </div>`;
        return {
          html,
          w: it.w || 1600,
          h: it.h || 900,
          title: titleHtml || it.title || '',
        } as any;
      }
      if (it.html) {
        return {
          html: it.html,
          w: it.w || 1600,
          h: it.h || 1200,
          title: titleHtml || it.title || '',
        } as any;
      }
      return {
        src: it.src!,
        w: it.w || 1600,
        h: it.h || 1200,
        title: titleHtml || it.title || '',
      };
    });

    // Rebuild placeholder anchor children for accessibility / PhotoSwipe binding
    try {
      if (placeholderRef.current) {
        placeholderRef.current.innerHTML = '';
        dataSource.forEach((ds: any, idx: number) => {
          const a = document.createElement('a');
          a.href = ds.src || '#';
          a.setAttribute('data-pswp-width', (ds.w || 1600).toString());
          a.setAttribute('data-pswp-height', (ds.h || 1200).toString());
          a.setAttribute('data-pswp-index', idx.toString());
          a.setAttribute('tabindex', idx === 0 ? '0' : '-1');
          a.setAttribute('aria-label', ds.title ? `Open slide ${idx + 1}: ${ds.title}` : `Open slide ${idx + 1}`);
          const span = document.createElement('span');
          span.className = 'sr-only';
          span.textContent = ds.title || `Slide ${idx + 1}`;
          a.appendChild(span);
          placeholderRef.current!.appendChild(a);
        });
      }
    } catch {}

    const lightbox = new PhotoSwipeLightbox({
      dataSource,
      pswpModule: () => import('photoswipe'),
      gallery: placeholderRef.current as any,
      children: 'a',
      showHideAnimationType: 'zoom',
      paddingFn: () => ({ top: 44, bottom: 44, left: 44, right: 44 }),
    });

    pswpRef.current = lightbox;
    lightbox.init();

    // Wire keyboard shortcuts for accessibility and navigation
    const onKey = (e: KeyboardEvent) => {
      if (!pswpRef.current) return;
      // @ts-ignore - PhotoSwipe instance API
      const api = pswpRef.current.pswp ? pswpRef.current.pswp : null;
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        try { api?.prev?.(); } catch {}
      } else if (e.key === 'ArrowRight') {
        try { api?.next?.(); } catch {}
      } else if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'f') {
        try { window.dispatchEvent(new CustomEvent('pswp-toggle-info')); } catch {}
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        try { toggleHelp(); } catch {}
      } else if (e.key.toLowerCase() === 'c') {
        try {
          const cat = (window as any).__photoSwipeCategory;
          const all: any[] = (window as any).__photoSwipeItems || [];
          const current = (window as any).__photoSwipeCurrentIndex || 0;
          if (cat && all.length > 1) {
            for (let off = 1; off < all.length; off++) {
              const ni = (current + off) % all.length;
              if (all[ni]?.category === cat) { api?.goTo?.(ni); break; }
            }
          }
        } catch {}
      }
    };

    document.addEventListener('keydown', onKey);

    lightbox.on('close', () => onClose?.());

  let overlayEl: HTMLDivElement | null = null;
  let panelRoot: ReactDOM.Root | null = null;
  let panelContainer: HTMLDivElement | null = null;
  let rightThumbStrip: HTMLDivElement | null = null;
  // track the last elements we mutated and their previous inline styles so we can restore them
  let lastContainer: HTMLElement | null = null;
  let lastZoomWrap: HTMLElement | null = null;
  let prevContainerStyles: { left?: string | null; width?: string | null; paddingLeft?: string | null; zoomMaxWidth?: string | null; zoomMarginLeft?: string | null; transform?: string | null; scrollWrapLeft?: string | null; scrollWrapWidth?: string | null } = {};
  let lastScrollWrap: HTMLElement | null = null;
  let lastVideoEl: HTMLVideoElement | null = null;
  // ensure we only apply the panel layout after PhotoSwipe has finished its initial sizing
  let layoutApplied = false;
  // we now always use container padding-left (simpler & more reliable than shifting scroll-wrap)

    const showToast = (text: string) => {
      const t = document.createElement('div');
      t.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    };

  const dispatchSlideChange = (detail: { item: Item | null; index: number | null; total?: number | null; items?: Item[] }) => {
      try {
        window.dispatchEvent(new CustomEvent('pswp-slide-change', { detail }));
      } catch {}
    };

    const computePanelWidth = () => {
      const vw = window.innerWidth;
      if (vw < 480) return 220;
      if (vw < 640) return 240;
      if (vw < 768) return 300;
      if (vw < 1024) return 340;
      return 380;
    };

    const applyPanelLayout = (container: HTMLElement | null) => {
      if (!container || !panelContainer) return;
      const shouldHidePanel = window.innerWidth < hidePanelBelow;
      panelContainer.style.display = shouldHidePanel ? 'none' : 'flex';
      const panelWidth = computePanelWidth();
      panelContainer.style.width = panelWidth + 'px';
      if (!prevContainerStyles.paddingLeft) {
        prevContainerStyles.paddingLeft = container.style.paddingLeft || null;
      }
      // Shift only if not hidden
      container.style.paddingLeft = shouldHidePanel ? '0px' : panelWidth + 'px';
      // compensate for right thumbnail strip if present
      const rightStrip = document.querySelector('.pswp-right-thumbs') as HTMLElement | null;
      const rightW = rightStrip ? rightStrip.getBoundingClientRect().width + 16 : 0; // include margin breathing room
      container.style.paddingRight = rightW ? rightW + 'px' : '0px';
      try { container.style.setProperty('--pswp-right-strip-width', rightW + 'px'); } catch {}
      // expose a CSS var so global styles can position default controls (e.g., prev arrow)
      try { (container as HTMLElement).style.setProperty('--pswp-left-panel-width', panelWidth + 'px'); } catch {}
      // additionally nudge the inner scroll wrap to ensure stage starts after panel (defensive for theme styles)
      try {
        const scrollWrap = container.querySelector('.pswp__scroll-wrap') as HTMLElement | null;
        if (scrollWrap) scrollWrap.style.marginLeft = '0';
        const containerEl = container.querySelector('.pswp__container') as HTMLElement | null;
        if (containerEl) containerEl.style.marginLeft = '0';
      } catch {}
      try { (pswpRef.current as any)?.pswp?.updateSize?.(true); } catch {}
    };

    const createOverlay = (itemIndex: number, container: HTMLElement | null, reuse = false) => {
      const it = items[itemIndex];
  try { (window as any).__photoSwipeCurrentItem = it; (window as any).__photoSwipeCurrentIndex = itemIndex; } catch {}
  try { (window as any).__photoSwipeTotal = items.length; } catch {}
  // expose full items list globally for thumbnail strip usage
  try { (window as any).__photoSwipeItems = items; } catch {}
  dispatchSlideChange({ item: it, index: itemIndex, total: items.length, items });
  const creating = !reuse || !overlayEl;
  if (creating) {
    overlayEl = document.createElement('div');
    // create a fixed, top-level overlay so it reliably stacks above any backdrop-blur
    // keep pointer-events none on the container and enable pointer-events on child controls
    overlayEl.className = 'pswp-extra-overlay flex items-start justify-start';
    overlayEl.style.position = 'fixed';
    overlayEl.style.inset = '0';
  overlayEl.style.zIndex = '2147483000';
    overlayEl.style.pointerEvents = 'none';

    const controls = document.createElement('div');
    controls.className = 'pointer-events-auto bg-black/40 backdrop-blur-sm text-white rounded-md px-2 py-2 flex items-center gap-2';
    controls.style.pointerEvents = 'auto';
    controls.style.position = 'relative';
    controls.style.margin = '0';
      controls.innerHTML = `
        <button data-pswp-meta class="pswp-btn" title="(I/F) Toggle Info">Info</button>
        <button data-pswp-download class="pswp-btn">Download</button>
        <button data-pswp-print class="pswp-btn">Print</button>
        <button data-pswp-share class="pswp-btn">Share</button>
        <button data-pswp-help class="pswp-btn" title="(?) Keyboard Help">?</button>
      `;

      // metadata panel (hosts a React-rendered left panel if provided)
  // create a container that will host a React-rendered left panel (if provided)
  if (!panelContainer) {
    panelContainer = document.createElement('div');
    panelContainer.className = 'pswp-meta-panel-container';
    panelContainer.style.pointerEvents = 'auto';
    panelContainer.style.position = 'fixed';
    panelContainer.style.top = '0';
    panelContainer.style.left = '0';
    panelContainer.style.bottom = '0';
    panelContainer.style.width = computePanelWidth() + 'px';
    panelContainer.style.borderRight = '1px solid rgba(255,255,255,0.15)';
    panelContainer.style.boxSizing = 'border-box';
    panelContainer.style.padding = '20px 16px 12px 20px';
  panelContainer.style.zIndex = '2147483646';
    panelContainer.style.background = 'rgba(15,15,15,0.78)';
    panelContainer.style.backdropFilter = 'blur(12px)';
    panelContainer.style.overflow = 'auto';
    panelContainer.style.display = 'flex';
    panelContainer.style.flexDirection = 'column';
  }
      const short = (it.caption || '').slice(0, 200);
      const more = (it.caption || '').length > 200;
      let exifHtml = '';
      if (it.exif) {
        const parts = Object.entries(it.exif).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`);
        exifHtml = `<div class="text-sm text-muted-foreground mt-2">${parts.join('')}</div>`;
      }
      // If a React leftPanel isn't provided, render a simple HTML fallback into the panel container
      if (!leftPanel && panelContainer) {
        panelContainer.innerHTML = `
          <div class="font-semibold">${it.title || ''}</div>
          <div class="text-sm mt-2">${short}${more ? '...' : ''}</div>
          ${more ? '<button data-pswp-readmore class="mt-2 underline text-sm">Read more</button>' : ''}
          ${exifHtml}
        `;
      }

  // append meta panel and its footer controls to the fixed overlay container
  // if a leftPanel React node is provided, we'll render it into the panelContainer
  if (!reuse || !overlayEl.parentElement) {
    overlayEl.appendChild(panelContainer);
    if (!rightThumbStrip) {
      rightThumbStrip = document.createElement('div');
      rightThumbStrip.className = 'pswp-right-thumbs';
      Object.assign(rightThumbStrip.style, {
        position: 'fixed', top: '56px', right: '8px', width: '260px', maxHeight: '190px',
        overflowY: 'auto', zIndex: '2147483600', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(48px,1fr))', gap: '4px',
        padding: '6px 6px 8px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        borderRadius: '6px'
      } as CSSStyleDeclaration);
      rightThumbStrip.setAttribute('aria-label','Slide thumbnails');
      const buildThumbs = () => {
        rightThumbStrip!.innerHTML = '';
        items.forEach((thumbIt, ti) => {
          const btn = document.createElement('button');
          btn.type = 'button';
            btn.style.position='relative'; btn.style.padding='0'; btn.style.border='1px solid transparent';
            btn.style.aspectRatio='1/1'; btn.style.overflow='hidden'; btn.style.borderRadius='4px'; btn.style.cursor='pointer'; btn.style.background='#111';
          btn.dataset.index = ti.toString();
          btn.setAttribute('aria-label', `Go to slide ${ti+1}`);
          const img = document.createElement('img');
          img.src = thumbIt.video?.poster || thumbIt.src || '';
          img.alt = thumbIt.title || '';
          Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', opacity: '.75', transition: 'opacity 140ms' });
          btn.appendChild(img);
          btn.addEventListener('click', () => {
            try { const api = (window as any)?.__photoSwipeInstance; if (api?.goTo) api.goTo(ti); } catch {}
          });
          btn.addEventListener('mouseenter', () => { img.style.opacity='1'; });
          btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('active')) img.style.opacity='.75'; });
          rightThumbStrip!.appendChild(btn);
        });
      };
      buildThumbs();
      document.body.appendChild(rightThumbStrip);
      const syncActive = (idx: number) => {
        if (!rightThumbStrip) return; const children = Array.from(rightThumbStrip.querySelectorAll('button')) as HTMLButtonElement[];
        children.forEach((c,i)=>{ c.classList.toggle('active', i===idx); c.style.borderColor = i===idx ? 'white' : 'transparent'; const img=c.querySelector('img') as HTMLImageElement|null; if(img) img.style.opacity = i===idx ? '1' : '.55'; });
        const active = children[idx]; if(active){ const r=active.getBoundingClientRect(); const pr=rightThumbStrip.getBoundingClientRect(); if(r.top<pr.top||r.bottom>pr.bottom){ rightThumbStrip.scrollTo({ top: active.offsetTop-20, behavior:'smooth' }); }}
      };
      window.addEventListener('pswp-slide-change', (ev: any) => { const ci = typeof ev.detail?.index === 'number' ? ev.detail.index : 0; syncActive(ci); });
    }
    // controls live inside a sticky footer in the panel
    const footer = document.createElement('div');
    footer.className = 'pswp-panel-footer';
    footer.style.position = 'sticky';
    footer.style.bottom = '0';
    footer.style.left = '0';
    footer.style.right = '0';
    footer.style.marginTop = 'auto';
    footer.style.borderTop = '1px solid rgba(255,255,255,0.15)';
    footer.style.background = 'rgba(10,10,10,0.55)';
    footer.style.backdropFilter = 'blur(6px)';
    footer.style.padding = '8px 8px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';
    footer.appendChild(controls);
    panelContainer.appendChild(footer);
    document.body.appendChild(overlayEl);
  }

  // wire actions
      controls.querySelector('[data-pswp-download]')?.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = it.src || it.video?.src || '';
        a.download = (it.title || 'image').replace(/\s+/g, '_') + '.jpg';
        a.click();
      });
      controls.querySelector('[data-pswp-print]')?.addEventListener('click', () => {
        const w = window.open(it.src, '_blank');
        if (w) w.print();
      });
      controls.querySelector('[data-pswp-share]')?.addEventListener('click', async () => {
        if ((navigator as any).share) {
          try { await (navigator as any).share({ title: it.title, url: it.src || it.video?.src || '' }); } catch {}
        } else {
          try { await navigator.clipboard.writeText(it.src || it.video?.src || ''); } catch {}
          showToast('Image URL copied to clipboard');
        }
      });
      controls.querySelector('[data-pswp-help]')?.addEventListener('click', () => toggleHelp());

      // info button flips the card inside the panel via a custom event
      controls.querySelector('[data-pswp-meta]')?.addEventListener('click', () => {
        try { window.dispatchEvent(new CustomEvent('pswp-toggle-info')); } catch {}
      });

      // read more
  // (read-more will be handled by the React panel if provided)

  // ensure the overlay and its children are visually placed above everything
  overlayEl.style.display = 'block';
  // position the overlay children so the panel is on the left and stretches vertically
  overlayEl.style.alignItems = 'stretch';
  overlayEl.style.justifyContent = 'flex-start';
    } // end creating block

      // shift the PhotoSwipe content area to the right so the left panel does not overlap images (only first time)
      try {
        if (container) {
          prevContainerStyles = { paddingLeft: container.style.paddingLeft || null };
          applyPanelLayout(container);
          lastContainer = container;
          // progress bar removed
        }
      } catch {}
    };

    const mountPanel = (node: React.ReactNode) => {
      if (!panelContainer) return;
      try {
        panelRoot = ReactDOM.createRoot(panelContainer);
        panelRoot.render(React.createElement(React.Fragment, null, node));
      } catch {}
    };

    const unmountPanel = () => {
      try {
        panelRoot?.unmount();
        panelRoot = null;
      } catch {}
    };

    const restoreContainerStyles = () => {
      try {
        // restore zoom wrapper styles if we modified them
        if (lastZoomWrap) {
          lastZoomWrap.style.maxWidth = prevContainerStyles.zoomMaxWidth ?? '';
          lastZoomWrap.style.marginLeft = prevContainerStyles.zoomMarginLeft ?? '';
          lastZoomWrap = null;
        }
        if (lastScrollWrap) {
          lastScrollWrap.style.left = prevContainerStyles.scrollWrapLeft ?? '';
          lastScrollWrap.style.width = prevContainerStyles.scrollWrapWidth ?? '';
          lastScrollWrap = null;
        }
        // we intentionally no longer modify root container left/width; but restore if set earlier
        if (lastContainer) {
          if (prevContainerStyles.left) lastContainer.style.left = prevContainerStyles.left;
          if (prevContainerStyles.width) lastContainer.style.width = prevContainerStyles.width;
          if (prevContainerStyles.paddingLeft) lastContainer.style.paddingLeft = prevContainerStyles.paddingLeft;
          lastContainer = null;
        }
        prevContainerStyles = {};
      } catch {}
    };

    // Debounced resize handling
    let resizeTimer: number | null = null;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        try {
          const container = (pswpRef.current as any)?.pswp?.el || null;
          applyPanelLayout(container);
          try { (pswpRef.current as any)?.pswp?.updateSize?.(true); } catch {}
        } catch {}
      }, 120);
    };
    window.addEventListener('resize', onResize);

    (lightbox as any).on('open', (e: any) => {
      try {
        // signal other UI (flip-cards) that photoswipe is open
        try { (window as any).__photoSwipeOpen = true; } catch {}
        const container = (pswpRef.current as any)?.pswp?.el || null;
        const startIndex = e?.detail?.index ?? index;
        // mount panel BEFORE creating overlay so initial slide-change event is received by React panel
        if (leftPanel) {
          mountPanel(leftPanel);
        }
        createOverlay(startIndex, container);
        try { (window as any).__photoSwipeInstance = (pswpRef.current as any)?.pswp || (pswpRef.current as any); } catch {}
        // defer layout shift so PhotoSwipe can calculate initial bounds first
        if (container) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!layoutApplied) {
                applyPanelLayout(container);
                layoutApplied = true;
              }
            });
          });
        }
        // fade-in first visible media
        if (container) applyPanelLayout(container);
  // progress bar removed
        try {
          const current = container?.querySelector('.pswp__item:not(.pswp__item--hidden) *:is(img,video)') as HTMLElement | null;
          if (current) {
            current.style.opacity = '0';
            current.style.transition = 'opacity 400ms ease';
            requestAnimationFrame(() => { current && (current.style.opacity = '1'); });
            if (current.tagName === 'VIDEO') lastVideoEl = current as HTMLVideoElement;
          }
        } catch {}
      } catch {}
    });

    (lightbox as any).on('change', (e: any) => {
      try {
        const container = (pswpRef.current as any)?.pswp?.el || null;
        // reuse existing overlay/panel; just update global state + event
        // pause any previous video
        try { lastVideoEl?.pause(); } catch {}
        createOverlay(e?.detail?.index ?? 0, container, true);
  // progress bar removed
        if (leftPanel && panelContainer && !panelRoot) {
          // if React panel not mounted yet, mount it once
          mountPanel(leftPanel);
        }
        // fade-in current media
        try {
          const current = container?.querySelector('.pswp__item:not(.pswp__item--hidden) *:is(img,video)') as HTMLElement | null;
          if (current) {
            current.style.opacity = '0';
            current.style.transition = 'opacity 300ms ease';
            requestAnimationFrame(() => { current && (current.style.opacity = '1'); });
            if (current.tagName === 'VIDEO') lastVideoEl = current as HTMLVideoElement;
          }
        } catch {}
        // React left panel will re-read global state / custom event
      } catch {}
    });

    (lightbox as any).on('close', () => {
      try { (window as any).__photoSwipeOpen = false; (window as any).__photoSwipeCurrentItem = null; (window as any).__photoSwipeCurrentIndex = null; } catch {}
      dispatchSlideChange({ item: null, index: null });
      restoreContainerStyles();
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  if (rightThumbStrip) { try { rightThumbStrip.remove(); } catch {}; rightThumbStrip = null; }
  // progress bar removed
      // defer unmount to avoid synchronous root unmount during render
      requestAnimationFrame(() => setTimeout(() => unmountPanel(), 0));
      try { (window as any).__photoSwipeInstance = (pswpRef.current as any)?.pswp || (pswpRef.current as any); } catch {}
      onClose?.();
      try { hideHelp(); } catch {}
    });

    if (open) {
      lightbox.loadAndOpen(index);
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      // ensure we restore any container styles when cleaning up
      try { restoreContainerStyles(); } catch {}
  if (overlayEl) overlayEl.remove();
  if (rightThumbStrip) { try { rightThumbStrip.remove(); } catch {}; rightThumbStrip = null; }
  // progress bar removed
  window.removeEventListener('resize', onResize);
      lightbox.destroy();
      pswpRef.current = null;
    };
  }, [items, index, open, onClose]);

  function toggleHelp() { (window as any).__pswpHelpVisible ? hideHelp() : showHelp(); }
  function showHelp() {
    if ((window as any).__pswpHelpVisible) return;
    const help = document.createElement('div');
    help.id = 'pswp-help';
    help.role = 'dialog';
    help.setAttribute('aria-modal', 'false');
    help.className = 'fixed bottom-4 right-4 max-w-sm text-sm bg-black/80 text-white p-4 rounded shadow-lg z-[2147483647] space-y-2';
    help.innerHTML = `
      <div class='font-semibold mb-1'>Keyboard Shortcuts</div>
      <ul class='list-disc pl-4 space-y-1'>
        <li><strong>Esc</strong> Close</li>
        <li><strong>←/→</strong> Prev / Next</li>
        <li><strong>I / F</strong> Toggle Info Panel</li>
        <li><strong>C</strong> Next in Same Category</li>
        <li><strong>?</strong> Toggle Help</li>
      </ul>`;
    document.body.appendChild(help);
    (window as any).__pswpHelpVisible = true;
  }
  function hideHelp() {
    const el = document.getElementById('pswp-help');
    if (el) el.remove();
    (window as any).__pswpHelpVisible = false;
  }

  return <div ref={placeholderRef} aria-label="Lightbox gallery" role="region" style={{ display: 'block' }} />;
  // NOTE: replaced by semantic section would be better; kept div for minimal change. Lint rule flagged earlier.
};

export default GalleryLightbox;
