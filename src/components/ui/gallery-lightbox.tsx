"use client";

import * as React from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import ReactDOM from 'react-dom/client';

import FlipCard from './flip-card';

// ---------------------------------------------------------------------------
// Type scaffolding for gallery-lightbox
// ---------------------------------------------------------------------------
// We model only the subset of PhotoSwipeLightbox + internal instance we use to
// avoid pulling deep library internals. This keeps our surface stable even if
// upstream adds properties.

interface PswpInstanceMinimal {
  el?: HTMLElement | null;
  currIndex?: number;
  goTo?: (index: number) => void;
  updateSize?: (force?: boolean) => void;
  destroy?: () => void;
}

interface LightboxControllerMinimal {
  pswp?: PswpInstanceMinimal | null;
  loadAndOpen: (index: number) => void;
  init?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PhotoSwipe event signatures vary
  on: (name: string, cb: (...args: unknown[]) => void) => void;
  destroy?: () => void;
}

export interface ExifData {
  aperture?: string | number;
  focalLength?: string | number;
  iso?: string | number;
  shutter?: string | number;
  [k: string]: string | number | undefined;
}

// (SlideChangeDetail interface removed – events use inline detail typing)

declare global {
  interface Window {
    __photoSwipeOpen?: boolean;
    __photoSwipeCurrentItem?: Item | null;
    __photoSwipeCurrentIndex?: number | null;
    __photoSwipeTotal?: number | null;
    __photoSwipeItems?: Item[];
    __photoSwipeCategory?: string | null;
    __photoSwipeInstance?: PswpInstanceMinimal | LightboxControllerMinimal | null;
    __pswpHelpVisible?: boolean;
    forceCreatePswpCollapseHandle?: () => void;
  }
}

// Helper narrowing utility to access the lightbox controller.
function getLightbox(ref: React.MutableRefObject<unknown>): LightboxControllerMinimal | null {
  return (ref.current as LightboxControllerMinimal) || null;
}

// Helper to safely access the underlying pswp instance.
function getPswp(ref: React.MutableRefObject<unknown>): PswpInstanceMinimal | null {
  return ((ref.current as LightboxControllerMinimal)?.pswp) || null;
}

type Item = {
  src?: string; // image source (optional if video/html provided)
  w?: number;
  h?: number;
  title?: string;
  caption?: string;
  exif?: ExifData | null;
  blurDataURL?: string | null;
  category?: string; // optional categorization used for jumpNextSameCategory
  // simple video support
  video?: {
    src: string;
    poster?: string;
    type?: string; // e.g. 'video/mp4'
  };
  // allow providing raw html (advanced usage)
  html?: string;
};

export type GalleryLightboxItem = Item; // public re-exportable alias

// Internal datasource shape passed to PhotoSwipe
interface DataSourceMediaItem {
  src?: string;
  html?: string;
  w: number;
  h: number;
  title: string;
}

interface GalleryLightboxProps {
  items: Item[];
  index?: number;
  open?: boolean;
  onClose?: () => void;
  leftPanel?: React.ReactNode;
  // width (px) below which the left panel is hidden & padding removed
  hidePanelBelow?: number;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({ items, index = 0, open = false, onClose, leftPanel, hidePanelBelow = 640 }) => {
  // opaque ref to third-party lightbox controller
  const pswpRef = React.useRef<unknown>(null);
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!placeholderRef.current) return;
    // create / reuse live region
    try {
      let lr = document.getElementById('pswp-live-region') as HTMLDivElement | null;
      if (!lr) {
        lr = document.createElement('div');
        lr.id = 'pswp-live-region';
        lr.className = 'sr-only';
        lr.setAttribute('aria-live','polite');
        lr.setAttribute('role','status');
        document.body.appendChild(lr);
      }
      liveRegionRef.current = lr;
    } catch {}

  // --- Helpers (extracted for complexity reduction) ---
  const buildTitleFragments = (it: Item) => {
    const captionHtml = it.caption ? `<div class="pswp-caption"><strong>${it.caption}</strong></div>` : '';
    let exifHtml = '';
    if (it.exif) {
      const parts: string[] = [];
      if (it.exif.aperture) parts.push(`Aperture: ${it.exif.aperture}`);
      if (it.exif.focalLength) parts.push(`Focal: ${it.exif.focalLength}`);
      if (it.exif.iso) parts.push(`ISO: ${it.exif.iso}`);
      if (it.exif.shutter) parts.push(`Shutter: ${it.exif.shutter}`);
      if (parts.length) exifHtml = `<div class="pswp-exif">${parts.join(' &nbsp; | &nbsp; ')}</div>`;
    }
    return { captionHtml, exifHtml, titleHtml: `${captionHtml}${exifHtml}` };
  };

  const buildVideoHtml = (it: Item, titleHtml: string): DataSourceMediaItem => {
    const posterAttr = it.video?.poster ? `poster="${it.video.poster}"` : '';
    const typeAttr = it.video?.type ? `type="${it.video.type}"` : 'type="video/mp4"';
    const html = it.html || `
      <div class="pswp-video-wrapper" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#000;">
        <video class="max-h-full max-w-full" controls playsinline ${posterAttr} preload="metadata"> 
          <source src="${it.video?.src}" ${typeAttr} />
          Your browser does not support the video tag.
        </video>
      </div>`;
    return { html, w: it.w || 1600, h: it.h || 900, title: titleHtml || it.title || '' };
  };

  const buildDataSourceItem = (it: Item): DataSourceMediaItem => {
    const { titleHtml } = buildTitleFragments(it);
    if (it.video) return buildVideoHtml(it, titleHtml);
    if (it.html) return { html: it.html, w: it.w || 1600, h: it.h || 1200, title: titleHtml || it.title || '' };
    return { src: it.src!, w: it.w || 1600, h: it.h || 1200, title: titleHtml || it.title || '' };
  };

  const buildDataSource = (items: Item[]): DataSourceMediaItem[] => items.map(buildDataSourceItem);

  const dataSource = buildDataSource(items);

    // Rebuild placeholder anchor children for accessibility / PhotoSwipe binding
    try {
      if (placeholderRef.current) {
        placeholderRef.current.innerHTML = '';
  dataSource.forEach((ds: DataSourceMediaItem, idx: number) => {
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

    const lightbox: LightboxControllerMinimal = new PhotoSwipeLightbox({
      dataSource,
      pswpModule: () => import('photoswipe'),
      gallery: placeholderRef.current as HTMLElement,
      children: 'a',
      showHideAnimationType: 'zoom',
      paddingFn: () => ({ top: 44, bottom: 44, left: 44, right: 44 }),
    }) as unknown as LightboxControllerMinimal;

    pswpRef.current = lightbox;
  // Init may be optional in narrowed controller interface
  try { lightbox.init?.(); } catch {}

    // Keyboard shortcuts (reduced branching complexity)
    const jumpNextSameCategory = () => {
      try {
  const api = getPswp(pswpRef);
  const cat = window.__photoSwipeCategory;
  const all: Item[] = window.__photoSwipeItems || [];
  const current = window.__photoSwipeCurrentIndex || 0;
        if (cat && all.length > 1) {
          for (let off = 1; off < all.length; off++) {
            const ni = (current + off) % all.length;
            if (all[ni]?.category === cat) { api?.goTo?.(ni); break; }
          }
        }
      } catch {}
    };

    const handleEscape = () => {
      try {
        const { overlayMode } = getLayoutState();
        if (overlayMode && !panelCollapsed) {
          setPanelCollapsedEnhanced(true, getPswp(pswpRef)?.el || null);
          return;
        }
      } catch {}
      onClose?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!pswpRef.current) return;
      const raw = e.key;
      if (raw === 'Escape') { handleEscape(); return; }
      if (raw === '?' || (raw === '/' && e.shiftKey)) { try { toggleHelp(); } catch {}; return; }
      const k = raw.length === 1 ? raw.toLowerCase() : raw;
      if (k === 'i' || k === 'f') {
        try {
          setPanelCollapsedEnhanced(!panelCollapsed, getPswp(pswpRef)?.el || null);
        } catch {};
        return;
      }
      if (k === 'c') { jumpNextSameCategory(); }
    };

  document.addEventListener('keydown', onKey);
  // NOTE: pswp-toggle-info listener is attached after onInfoToggleEvent is defined later in this effect

    lightbox.on('close', () => onClose?.());

  // mutable refs for DOM nodes created procedurally
  let overlayEl: HTMLDivElement | null = null;
  let panelRoot: ReactDOM.Root | null = null;
  let panelContainer: HTMLDivElement | null = null;
  // removed: right thumbnail strip
  // track the last elements we mutated and their previous inline styles so we can restore them
  let lastContainer: HTMLElement | null = null;
  let lastZoomWrap: HTMLElement | null = null;
  let prevContainerStyles: { left?: string | null; width?: string | null; paddingLeft?: string | null; zoomMaxWidth?: string | null; zoomMarginLeft?: string | null; transform?: string | null; scrollWrapLeft?: string | null; scrollWrapWidth?: string | null } = {};
  let lastScrollWrap: HTMLElement | null = null;
  let lastVideoEl: HTMLVideoElement | null = null;
  // mid-edge collapse handle
  let collapseHandle: HTMLButtonElement | null = null;
  let collapseHandleObserver: MutationObserver | null = null;
  // NEW: collapse + flip-card state (lives within effect scope, resets each open)
  let panelCollapsed = false;
  let infoToggleButton: HTMLButtonElement | null = null;
  let flipCardPortal: HTMLDivElement | null = null;
  let flipCardRoot: ReactDOM.Root | null = null;
  let flipCardFlipped = false;
  let currentSlideIndex = index;
  // removed unused: cardFlipped (flip state handled via DOM class only)
  const panelRailWidth = 52; // width when collapsed (rail with icon)

  // Accessibility / UX enhancement refs
  let sheetHeading: HTMLHeadingElement | null = null; // visually-hidden heading for aria-labelledby
  let focusFlashTimer: number | null = null;

  const ensureA11yStyles = () => {
    if (document.getElementById('pswp-sheet-a11y-styles')) return;
    const style = document.createElement('style');
    style.id = 'pswp-sheet-a11y-styles';
    style.textContent = `
      @keyframes pswpFocusFlash {0%{box-shadow:0 0 0 0 rgba(110,168,255,0.85);}100%{box-shadow:0 0 0 8px rgba(110,168,255,0);}}
      .pswp-focus-flash{outline:2px solid #6ea8ff;outline-offset:2px;animation:pswpFocusFlash 560ms ease;}
      .pswp-collapse-handle {
        position: fixed !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 36px !important;
        height: 64px !important;
        background: rgba(0,0,0,0.85) !important;
        border: 1px solid rgba(255,255,255,0.25) !important;
        border-left: none !important;
        border-radius: 0 8px 8px 0 !important;
        color: white !important;
        cursor: pointer !important;
        z-index: 2147483650 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        backdrop-filter: blur(12px) !important;
        box-shadow: 2px 0 8px rgba(0,0,0,0.3) !important;
      }
      .pswp-collapse-handle:hover {
        background: rgba(0,0,0,0.95) !important;
        border-color: rgba(255,255,255,0.4) !important;
        transform: translateY(-50%) translateX(2px) !important;
        box-shadow: 4px 0 12px rgba(0,0,0,0.4) !important;
      }
      .pswp-collapse-handle:active {
        transform: translateY(-50%) translateX(1px) !important;
        background: rgba(0,0,0,1) !important;
      }
      .pswp-meta-panel-container[data-collapsed="true"] > *:not(.pswp-meta-header) {
        display: none !important;
      }
      .pswp-meta-panel-container[data-collapsed="true"] {
        width: 52px !important;
        padding: 6px !important;
      }
      .pswp-meta-panel-container {
        will-change: width, padding !important;
      }
      .pswp-meta-header button[data-pswp-collapse] {
        transition: all 0.2s ease !important;
        will-change: transform !important;
      }
      .pswp-meta-header button[data-pswp-collapse]:hover {
        background: rgba(255,255,255,0.2) !important;
        transform: scale(1.05) !important;
      }
      .pswp-meta-header button[data-pswp-collapse]:active {
        transform: scale(0.95) !important;
      }
    `;
    document.head.appendChild(style);
  };

  const ensureSheetHeading = (text?: string) => {
    if (!panelContainer) return null;
    if (!sheetHeading) {
      sheetHeading = document.createElement('h2');
      sheetHeading.id = 'pswp-sheet-heading';
      sheetHeading.className = 'sr-only';
      sheetHeading.textContent = text || 'Image information panel';
      panelContainer.prepend(sheetHeading);
    } else if (text && sheetHeading.textContent !== text) {
      sheetHeading.textContent = text;
    }
    return sheetHeading;
  };

  const flashFocus = () => {
    if (!panelContainer) return;
    ensureA11yStyles();
    panelContainer.classList.add('pswp-focus-flash');
    if (focusFlashTimer) window.clearTimeout(focusFlashTimer);
    focusFlashTimer = window.setTimeout(() => { try { panelContainer?.classList.remove('pswp-focus-flash'); } catch {} }, 620);
  };

  const setPanelCollapsed = (val: boolean, container?: HTMLElement | null) => {
    const prev = panelCollapsed;
    panelCollapsed = val;
    if (panelContainer) {
      panelContainer.setAttribute('data-collapsed', String(panelCollapsed));
    }
    if (!panelCollapsed) {
      const fc = document.querySelector('.pswp-flipcard');
      fc?.classList.remove('is-flipped');
    }
    try { applyPanelLayout(container || lastContainer); } catch {}
    syncFlipCardOverlay();
    if (collapseHandle) {
      collapseHandle.setAttribute('aria-expanded', String(!panelCollapsed));
      collapseHandle.innerHTML = panelCollapsed ? '&#x25B6;' : '&#x25C0;';
      collapseHandle.title = panelCollapsed ? 'Expand panel' : 'Collapse panel';
    }
    try { updateSheetDialogA11y(); } catch {}
    if (prev !== panelCollapsed) {
      dispatchInfoEvent();
    }
    try { updateUnderlyingMediaVisibility(); } catch {}
  };

  // removed unused togglePanelCollapsed / toggleFlipCard (logic retained in setPanelCollapsed)

  const showToast = (text: string) => {
      const t = document.createElement('div');
      t.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    };

  const dispatchInfoEvent = () => {
      try {
        window.dispatchEvent(new CustomEvent('pswp-toggle-info', { detail: { collapsed: panelCollapsed, index: currentSlideIndex } }));
      } catch {}
    };

  const dispatchSlideChange = (detail: { item: Item | null; index: number | null; total?: number | null; items?: Item[] }) => {
      try {
        window.dispatchEvent(new CustomEvent('pswp-slide-change', { detail }));
      } catch {}
    };

    const computePanelWidth = () => {
      const vw = window.innerWidth;
      if (vw < 480) return Math.min(360, Math.round(vw * 0.94));
      if (vw < 640) return Math.min(400, Math.round(vw * 0.9));
      if (vw < 768) return 320;
      if (vw < 1024) return 340;
      return 380;
    };

    const getLayoutState = () => {
      const overlayMode = window.innerWidth < hidePanelBelow;
      const fullPanelWidth = computePanelWidth();
      const activePanelWidth = panelCollapsed ? panelRailWidth : fullPanelWidth;
      const gutter = overlayMode ? 0 : 32;
      return { overlayMode, fullPanelWidth, activePanelWidth, gutter };
    };

    const updateSheetDialogA11y = (currentIndex?: number) => {
      try {
        if (!panelContainer) return; // guard
        const { overlayMode } = getLayoutState();
        const shouldDialog = overlayMode && !panelCollapsed;
        if (!shouldDialog) {
          panelContainer.removeAttribute('role');
          panelContainer.removeAttribute('aria-modal');
          panelContainer.removeAttribute('aria-labelledby');
          return;
        }
  const idx = typeof currentIndex === 'number' ? currentIndex : window.__photoSwipeCurrentIndex;
  const total = window.__photoSwipeTotal || items.length;
        let label = 'Image details';
        if (typeof idx === 'number' && idx >= 0) {
          const item = items[idx];
          if (item) {
            if (item.title) label = `Image details – slide ${idx + 1} of ${total}: ${item.title}`;
            else label = `Image details – slide ${idx + 1} of ${total}`;
          }
        }
        ensureSheetHeading(label);
        panelContainer.setAttribute('role','dialog');
        panelContainer.setAttribute('aria-modal','true');
        panelContainer.setAttribute('aria-labelledby','pswp-sheet-heading');
      } catch {}
    };

    // Ensure the floating collapse handle exists & is positioned
  const ensureCollapseHandle = (container: HTMLElement | null, activePanelWidth: number) => {
      if (window.innerWidth < hidePanelBelow) { // hide on sheet mode
        if (collapseHandle) {
          collapseHandle.style.opacity = '0';
          collapseHandle.style.pointerEvents = 'none';
        }
        return;
      }
      if (!collapseHandle) {
        collapseHandle = document.createElement('button');
        collapseHandle.type = 'button';
        collapseHandle.className = 'pswp-collapse-handle';
        collapseHandle.setAttribute('aria-label', 'Toggle info panel');
        collapseHandle.setAttribute('aria-expanded', String(!panelCollapsed));
        collapseHandle.innerHTML = panelCollapsed ? '&#x25B6;' : '&#x25C0;';
        collapseHandle.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          setPanelCollapsedEnhanced(!panelCollapsed, container || lastContainer);
          try { localStorage.setItem('pswp_panel_collapsed', panelCollapsed ? 'true' : 'false'); } catch {}
        });
        try { document.body.appendChild(collapseHandle); } catch {}
        // Observe for accidental removal (HMR, route transitions)
        try {
          collapseHandleObserver?.disconnect();
          collapseHandleObserver = new MutationObserver(() => {
            if (collapseHandle && !document.body.contains(collapseHandle)) {
              try { document.body.appendChild(collapseHandle); } catch {}
            }
          });
          collapseHandleObserver.observe(document.body, { childList: true });
        } catch {}
      }
      collapseHandle.style.left = Math.max(0, activePanelWidth) + 'px';
      collapseHandle.style.opacity = '1';
      collapseHandle.style.pointerEvents = 'auto';
    };

    const ensureInfoToggle = (container: HTMLElement | null) => {
      if (!container && !lastContainer) return;
      if (!infoToggleButton) {
        infoToggleButton = document.createElement('button');
        infoToggleButton.type = 'button';
        infoToggleButton.className = 'pswp-info-toggle fixed top-4 right-4 z-[2147483630] bg-black/60 text-white px-3 py-2 rounded-md shadow-lg backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black/20';
        infoToggleButton.setAttribute('aria-label', 'Toggle information panel');
      }
      infoToggleButton.textContent = panelCollapsed ? 'Show info' : 'Hide info';
      infoToggleButton.setAttribute('aria-pressed', String(!panelCollapsed));
      infoToggleButton.setAttribute('aria-expanded', String(!panelCollapsed));
      infoToggleButton.setAttribute('title', panelCollapsed ? 'Show image information' : 'Hide image information');
      infoToggleButton.setAttribute('aria-controls', 'pswp-info-panel');
      infoToggleButton.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const latestContainer = container || lastContainer;
        setPanelCollapsedEnhanced(!panelCollapsed, latestContainer);
      };
      if (!infoToggleButton.parentElement) {
        try { document.body.appendChild(infoToggleButton); } catch {}
      }
    };

    const removeInfoToggle = () => {
      if (!infoToggleButton) return;
      try { infoToggleButton.remove(); } catch {}
      infoToggleButton = null;
    };

    const styleOverlayContentOffsets = (container: HTMLElement, leftOffset: number, overlayMode: boolean) => {
      const q = (sel: string): HTMLElement | null => container.querySelector<HTMLElement>(sel);
      const scrollWrap = q('.pswp__scroll-wrap');
      if (scrollWrap) {
        scrollWrap.style.position = 'relative';
        scrollWrap.style.left = leftOffset + 'px';
        scrollWrap.style.width = overlayMode ? '100%' : `calc(100% - ${leftOffset}px)`;
        scrollWrap.style.marginLeft = '0';
        scrollWrap.style.display = 'flex';
        scrollWrap.style.justifyContent = 'center';
        scrollWrap.style.alignItems = 'center';
        // Add smooth transitions for desktop mode
        if (!overlayMode) {
          scrollWrap.style.transition = 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
          scrollWrap.style.transition = '';
        }
      }
      const bg = q('.pswp__bg');
      if (bg) { 
        bg.style.left = leftOffset + 'px'; 
        bg.style.width = overlayMode ? '100%' : `calc(100% - ${leftOffset}px)`;
        if (!overlayMode) {
          bg.style.transition = 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
          bg.style.transition = '';
        }
      }
      const ui = q('.pswp__ui');
      if (ui) { 
        ui.style.left = leftOffset + 'px'; 
        ui.style.width = overlayMode ? '100%' : `calc(100% - ${leftOffset}px)`;
        if (!overlayMode) {
          ui.style.transition = 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
          ui.style.transition = '';
        }
      }
      const containerEl = q('.pswp__container');
      if (containerEl) {
        containerEl.style.display = 'flex';
        containerEl.style.justifyContent = 'center';
        containerEl.style.alignItems = 'center';
        containerEl.style.marginLeft = '0';
        containerEl.style.maxWidth = '100%';
        containerEl.style.zIndex = '2147483610';
      }
    };

    const ensureBottomSheetGrip = () => {
      if (!panelContainer || panelContainer.querySelector('.pswp-sheet-grip')) return;
      const grip = document.createElement('div');
      grip.className = 'pswp-sheet-grip';
      Object.assign(grip.style, {
        position: 'absolute', 
        top: '8px', 
        left: '50%', 
        width: '64px', 
        height: '4px', 
        borderRadius: '2px', 
        transform: 'translateX(-50%)', 
        background: 'rgba(255,255,255,0.4)',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      });
      
      // Add hover and active states
      grip.addEventListener('mouseenter', () => {
        grip.style.background = 'rgba(255,255,255,0.6)';
        grip.style.width = '72px';
      });
      grip.addEventListener('mouseleave', () => {
        grip.style.background = 'rgba(255,255,255,0.4)';
        grip.style.width = '64px';
      });
      grip.addEventListener('mousedown', () => {
        grip.style.cursor = 'grabbing';
        grip.style.background = 'rgba(255,255,255,0.8)';
      });
      grip.addEventListener('mouseup', () => {
        grip.style.cursor = 'grab';
      });
      
      panelContainer.appendChild(grip);
    };

    const stylePanelForMode = (overlayMode: boolean) => {
      if (!panelContainer) return;
      const headerElGeneric = panelContainer.querySelector('.pswp-meta-header');
      const header = headerElGeneric instanceof HTMLElement ? headerElGeneric : null;
      
      // Hide/show content based on collapsed state
      panelContainer
        .querySelectorAll(':scope > *:not(.pswp-meta-header):not(.pswp-panel-footer)')
        .forEach(el => { (el as HTMLElement).style.display = panelCollapsed ? 'none' : ''; });
      if (header) {
        header.style.borderBottom = panelCollapsed ? 'none' : '1px solid rgba(255,255,255,0.12)';
      }
      
      if (overlayMode) {
        // Mobile/tablet mode - bottom sheet
        Object.assign(
          panelContainer.style,
          {
            width: '100%',
            maxWidth: '100%',
            left: '0',
            right: '0',
            top: 'auto',
            bottom: '0',
            height: panelCollapsed ? '52px' : '55vh',
            borderRight: 'none',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '18px 18px 0 0',
            padding: panelCollapsed ? '8px 16px 8px 16px' : '18px 24px 20px 24px',
            background: 'linear-gradient(180deg,rgba(15,15,15,0.92),rgba(5,5,5,0.95))',
            backdropFilter: 'blur(22px)',
            boxShadow: '0 -8px 32px -4px rgba(0,0,0,0.55)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          } as CSSStyleDeclaration
        );
        ensureBottomSheetGrip();
      } else {
        // Desktop mode - side panel with smooth width transitions
        const { activePanelWidth } = getLayoutState();
        Object.assign(panelContainer.style, {
          position: 'fixed',
          top: '0',
          bottom: '0',
          left: '0',
          height: 'auto',
          borderRadius: '0 18px 18px 0',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          borderTop: 'none',
          background: 'linear-gradient(180deg,rgba(15,15,15,0.92),rgba(10,10,10,0.88))',
          backdropFilter: 'blur(18px)',
          boxShadow: '12px 0 32px -12px rgba(0,0,0,0.45)',
          width: activePanelWidth + 'px',
          padding: panelCollapsed ? '8px 12px' : '18px 18px 14px 18px',
          transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
          overflow: panelCollapsed ? 'hidden' : 'auto'
        });
        panelContainer.querySelector('.pswp-sheet-grip')?.remove();
      }
    };


    // ---- Bottom Sheet Gesture + Animation (mobile overlay mode) ----
  let sheetGesturesAttached = false;
  let isDraggingSheet = false;
  let dragStartY = 0;
  let dragStartHeight = 0;
  let lastDragTime = 0;
  let lastDragY = 0;
  let pendingDragHeight: number | null = null;
  let dragRaf = 0;
    const collapsedHeight = 52; // px (matches stylePanelForMode)
    const getExpandedHeight = () => Math.min(Math.round(window.innerHeight * 0.85), window.innerHeight - 90);
    // Persistable expanded height (user's last preferred) separate from computed max
    let sheetExpandedHeight = getExpandedHeight();
    try {
      const persisted = localStorage.getItem('pswp_sheet_expanded_height');
      if (persisted) {
        const num = parseInt(persisted, 10);
        if (!isNaN(num)) sheetExpandedHeight = Math.min(getExpandedHeight(), Math.max(num, collapsedHeight + 120));
      }
    } catch {}
    const clampExpandedHeight = () => {
      const max = getExpandedHeight();
      if (sheetExpandedHeight > max) sheetExpandedHeight = max;
    };
    const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animateSheetTo = (target: number, expand: boolean) => {
      if (!panelContainer) return;
      try {
        if (prefersReducedMotion()) {
          panelContainer.style.transition = '';
          panelContainer.style.height = target + 'px';
          panelContainer.style.padding = expand ? '14px 18px 16px 18px' : '6px 12px 6px 12px';
          try { applyPanelLayout(getPswp(pswpRef)?.el || null); } catch {}
          return;
        }
        
        // Enhanced animation with better easing
        panelContainer.style.transition = 'height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s ease';
        panelContainer.style.willChange = 'height, padding';
        
        const currentRect = panelContainer.getBoundingClientRect();
        const current = currentRect.height;
        
        if (Math.abs(current - target) < 3) {
          panelContainer.style.height = target + 'px';
        } else {
          panelContainer.style.height = current + 'px';
          requestAnimationFrame(() => { 
            if (panelContainer) {
              panelContainer.style.height = target + 'px';
              // Enhanced backdrop blur effect during transition
              panelContainer.style.backdropFilter = expand ? 'blur(18px)' : 'blur(12px)';
            }
          });
        }
        
        panelContainer.style.padding = expand ? '14px 18px 16px 18px' : '6px 12px 6px 12px';
        
        const done = () => {
          if (!panelContainer) return;
          panelContainer.removeEventListener('transitionend', done);
          panelContainer.style.transition = '';
          panelContainer.style.willChange = '';
          try { applyPanelLayout(getPswp(pswpRef)?.el || null); } catch {}
        };
        panelContainer.addEventListener('transitionend', done, { once: true });
      } catch {}
    };

    const applyCollapsedStateAnimated = () => {
      const { overlayMode } = getLayoutState();
  if (!overlayMode) { applyPanelLayout(getPswp(pswpRef)?.el || null); return; }
      clampExpandedHeight();
      const target = panelCollapsed ? collapsedHeight : sheetExpandedHeight;
      animateSheetTo(target, !panelCollapsed);
    };

    // Focus trapping only while overlay sheet expanded
    let sheetKeydownListener: ((e: KeyboardEvent) => void) | null = null;
    const getFocusable = () => {
      if (!panelContainer) return [] as HTMLElement[];
      const sel = [
        'a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'
      ].join(',');
      const nodes = Array.from(panelContainer.querySelectorAll<HTMLElement>(sel))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      return nodes;
    };
    const syncSheetFocusTrap = () => {
      const { overlayMode } = getLayoutState();
      if (!panelContainer) return;
      // remove existing listener if any
      if (sheetKeydownListener) {
  panelContainer.removeEventListener('keydown', sheetKeydownListener as EventListener);
        sheetKeydownListener = null;
      }
      if (!(overlayMode && !panelCollapsed)) return; // only active when expanded sheet
      if (panelContainer && !panelContainer.hasAttribute('tabindex')) panelContainer.setAttribute('tabindex','-1');
      sheetKeydownListener = (ev: KeyboardEvent) => {
        if (ev.key !== 'Tab') return;
        const focusables = getFocusable();
        if (!focusables.length) {
          ev.preventDefault();
          panelContainer?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (ev.shiftKey) {
          const activeIsFirst = document.activeElement === first || document.activeElement === panelContainer;
          if (activeIsFirst) {
            ev.preventDefault();
            last.focus();
            flashFocus();
          }
        } else {
          const activeIsLast = document.activeElement === last;
          if (activeIsLast) {
            ev.preventDefault();
            first.focus();
            flashFocus();
          }
        }
      };
  panelContainer.addEventListener('keydown', sheetKeydownListener as EventListener);
      // If focus is outside panel when expanding, move it in
      if (!panelContainer.contains(document.activeElement)) {
        const focusables = getFocusable();
        if (focusables[0]) {
          focusables[0].focus();
        } else {
          panelContainer.focus();
        }
      }
    };

    const updateBackgroundInert = () => {
      try {
        const { overlayMode } = getLayoutState();
  const pswpEl = getPswp(pswpRef)?.el as HTMLElement | undefined;
        if (!pswpEl) return;
        const makeInert = overlayMode && !panelCollapsed;
        if (makeInert) {
          pswpEl.setAttribute('aria-hidden','true');
        } else {
          pswpEl.removeAttribute('aria-hidden');
        }
  try { pswpEl.inert = makeInert; } catch {}
      } catch {}
    };

    const announcePanelState = () => {
      try {
        const { overlayMode } = getLayoutState();
        if (!overlayMode) return;
        if (!liveRegionRef.current) return;
        liveRegionRef.current.textContent = panelCollapsed ? 'Information panel collapsed' : 'Information panel expanded';
      } catch {}
    };



    const onSheetPointerDown = (e: PointerEvent | TouchEvent) => {
      if (!panelContainer) return;
    const { overlayMode } = getLayoutState();
      if (!overlayMode) return;
      // Only initiate if starting near top (grip area) or collapsed (anywhere)
      const rect = panelContainer.getBoundingClientRect();
      const clientY = (e as PointerEvent).clientY || (e as TouchEvent).touches?.[0]?.clientY;
      if (!clientY) return;
      if (!panelCollapsed && clientY - rect.top > 80) return; // when expanded require grab near top
      isDraggingSheet = true;
      dragStartY = clientY;
      dragStartHeight = rect.height;
      lastDragTime = performance.now();
      lastDragY = clientY;
      panelContainer.style.transition = 'none';
      panelContainer.style.willChange = 'height';
      document.addEventListener('pointermove', onSheetPointerMove);
      document.addEventListener('pointerup', onSheetPointerUp, { once: true });
      document.addEventListener('touchmove', onSheetPointerMove, { passive: false });
      document.addEventListener('touchend', onSheetPointerUp, { once: true });
    };

    const flushDragHeight = () => {
      if (panelContainer && pendingDragHeight != null) {
        panelContainer.style.height = pendingDragHeight + 'px';
      }
      pendingDragHeight = null;
      dragRaf = 0;
    };
    const onSheetPointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDraggingSheet || !panelContainer) return;
      const clientY = (e as PointerEvent).clientY || (e as TouchEvent).touches?.[0]?.clientY;
      if (!clientY) return;
      const delta = dragStartY - clientY; // drag up => positive
      const target = Math.min(Math.max(dragStartHeight + delta, collapsedHeight), getExpandedHeight());
      e.preventDefault?.();
      pendingDragHeight = target;
      if (!dragRaf) dragRaf = requestAnimationFrame(flushDragHeight);
      lastDragTime = performance.now();
      lastDragY = clientY;
    };

    const onSheetPointerUp = (e: PointerEvent | TouchEvent) => {
      if (!panelContainer) return;
      if (!isDraggingSheet) return;
      isDraggingSheet = false;
      const clientY = (e as PointerEvent).clientY || (e as TouchEvent).changedTouches?.[0]?.clientY || lastDragY;
      const totalDelta = dragStartY - clientY;
      const dt = performance.now() - lastDragTime;
      const velocity = dt ? (dragStartY - lastDragY) / dt : 0; // px per ms (rough)
      const currentHeight = panelContainer.getBoundingClientRect().height;
      const mid = (collapsedHeight + getExpandedHeight()) / 2;
      let expand = currentHeight > mid;
      // velocity influence
      if (Math.abs(velocity) > 0.6) expand = velocity > 0; // fast upward flick expands
      else if (Math.abs(totalDelta) > 40) expand = totalDelta > 0; // drag threshold
      panelCollapsed = !expand;
      if (expand) {
        sheetExpandedHeight = Math.min(getExpandedHeight(), Math.max(currentHeight, collapsedHeight + 120));
        try { localStorage.setItem('pswp_sheet_expanded_height', String(Math.round(sheetExpandedHeight))); } catch {}
      }
      animateSheetTo(expand ? sheetExpandedHeight : collapsedHeight, expand);
      updateBackgroundInert();
      announcePanelState();
      syncSheetFocusTrap();
    };
    // (removed accidental stray calls to enhanced collapse setter)

    const attachSheetGestures = () => {
      if (sheetGesturesAttached || !panelContainer) return;
      sheetGesturesAttached = true;
      try {
        panelContainer.addEventListener('pointerdown', onSheetPointerDown);
        panelContainer.addEventListener('touchstart', onSheetPointerDown, { passive: true });
      } catch {}
    };
    const detachSheetGestures = () => {
      if (!sheetGesturesAttached || !panelContainer) return;
      sheetGesturesAttached = false;
      try {
        panelContainer.removeEventListener('pointerdown', onSheetPointerDown);
  panelContainer.removeEventListener('touchstart', onSheetPointerDown as EventListener);
  document.removeEventListener('pointermove', onSheetPointerMove as EventListener);
  document.removeEventListener('touchmove', onSheetPointerMove as EventListener);
      } catch {}
    };

    const manageSheetGestures = () => {
      const { overlayMode } = getLayoutState();
      if (overlayMode) {
        attachSheetGestures();
      } else {
        detachSheetGestures();
        if (panelContainer) {
          panelContainer.style.height = 'auto';
        }
      }
    };
    // initial inert sync (in case opened directly in expanded state logic later toggles)
    updateBackgroundInert();
    syncSheetFocusTrap();
    try { updateSheetDialogA11y(); } catch {}

    // Enhance existing setPanelCollapsed to animate in sheet mode
    // Wrapper to add animation + a11y side effects without reassigning const
    const setPanelCollapsedEnhanced = (val: boolean, container?: HTMLElement | null) => {
      setPanelCollapsed(val, container);
      applyCollapsedStateAnimated();
      updateBackgroundInert();
      announcePanelState();
      syncSheetFocusTrap();
    };

    const applyPanelLayout = (container: HTMLElement | null) => {
      if (!container || !panelContainer) return;
      const { overlayMode, activePanelWidth, gutter } = getLayoutState();
      
      // Set panel display and width
      panelContainer.style.display = 'flex';
      
      // For desktop mode, ensure smooth width transitions
      if (!overlayMode) {
        panelContainer.style.width = activePanelWidth + 'px';
      }
      
      // Configure container base styles
      if (!prevContainerStyles.paddingLeft) prevContainerStyles.paddingLeft = container.style.paddingLeft || null;
      container.style.paddingLeft = '0px';
      container.style.paddingRight = '0px';
      try { container.style.zIndex = '2147483600'; } catch {}
      
      // Set CSS custom properties for panel width
      try {
        container.style.setProperty('--pswp-left-panel-width', overlayMode ? '0px' : activePanelWidth + 'px');
        container.style.setProperty('--pswp-left-panel-gutter', gutter + 'px');
      } catch {}
      
      try {
        const leftOffset = overlayMode ? 0 : (activePanelWidth + gutter);
        styleOverlayContentOffsets(container, leftOffset, overlayMode);
        stylePanelForMode(overlayMode);
      } catch {}
      
      // Force PhotoSwipe to recalculate layout with a slight delay for desktop transitions
      if (!overlayMode) {
        setTimeout(() => {
          try { getPswp(pswpRef)?.updateSize?.(true); } catch {}
        }, 50);
      } else {
        try { getPswp(pswpRef)?.updateSize?.(true); } catch {}
      }

      ensureCollapseHandle(container, activePanelWidth);
      ensureInfoToggle(container);
      try { manageSheetGestures(); } catch {}
    };

    // --- Overlay construction helpers ---
    const ensureOverlayRoot = () => {
      if (overlayEl) return overlayEl;
      overlayEl = document.createElement('div');
      overlayEl.className = 'pswp-extra-overlay flex items-start justify-start';
      Object.assign(overlayEl.style, { position: 'fixed', inset: '0', zIndex: '2147483620', pointerEvents: 'none', display: 'block', alignItems: 'stretch', justifyContent: 'flex-start' } as CSSStyleDeclaration);
      document.body.appendChild(overlayEl);
      return overlayEl;
    };

    const ensurePanelContainer = () => {
      if (!panelContainer) {
        panelContainer = document.createElement('div');
        panelContainer.className = 'pswp-meta-panel-container';
        Object.assign(panelContainer.style, {
          pointerEvents: 'auto',
          position: 'fixed',
          top: '0',
          left: '0',
          bottom: '0',
          width: computePanelWidth() + 'px',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          boxSizing: 'border-box',
          padding: '18px 18px 14px 18px',
          zIndex: '2147483646',
          background: 'linear-gradient(180deg,rgba(15,15,15,0.92),rgba(10,10,10,0.88))',
          backdropFilter: 'blur(16px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderRadius: '0 18px 18px 0',
          boxShadow: '0 22px 48px rgba(0,0,0,0.45)'
        } as CSSStyleDeclaration);
        panelContainer.id = 'pswp-info-panel';
        panelContainer.setAttribute('data-collapsed', 'false');
      }
      return panelContainer;
    };

    const ensurePanelHeader = () => {
      if (!panelContainer) return null;
      let headerEl = panelContainer.querySelector<HTMLDivElement>('.pswp-meta-header');
      if (!headerEl) {
        headerEl = document.createElement('div');
        headerEl.className = 'pswp-meta-header mb-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/60';
        headerEl.style.minHeight = '40px';
        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.className = 'pswp-header-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white shadow-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40';
        collapseBtn.setAttribute('data-pswp-collapse', '');
        collapseBtn.setAttribute('aria-expanded', 'true');
        collapseBtn.setAttribute('aria-label', 'Collapse information panel');
        collapseBtn.setAttribute('title', 'Collapse information panel');
        collapseBtn.innerHTML = '<span aria-hidden="true">⮜</span>';
        const slideCount = document.createElement('div');
        slideCount.className = 'pswp-slide-count font-semibold tracking-wide text-white/70';
        headerEl.appendChild(collapseBtn);
        headerEl.appendChild(slideCount);
        panelContainer.appendChild(headerEl);
        collapseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newCollapsed = !panelCollapsed;
          const containerElement = lastContainer || getPswp(pswpRef)?.el || null;

          // Call the enhanced setter that handles all side effects
          setPanelCollapsedEnhanced(newCollapsed, containerElement);

          // Update button visual state with animation
          const expanded = !newCollapsed;
          collapseBtn.setAttribute('aria-expanded', String(expanded));
          collapseBtn.setAttribute('aria-label', expanded ? 'Collapse information panel' : 'Expand information panel');
          collapseBtn.setAttribute('title', expanded ? 'Collapse information panel' : 'Expand information panel');
          collapseBtn.style.transform = 'scale(0.94)';

          setTimeout(() => {
            collapseBtn.innerHTML = `<span aria-hidden="true">${expanded ? '⮜' : '⮞'}</span>`;
            collapseBtn.style.transform = '';
          }, 75);

          // Force a layout update
          try {
            if (containerElement) {
              const pswpInstance = getPswp(pswpRef);
              pswpInstance?.updateSize?.(true);
            }
          } catch {}
        });
      }
      return headerEl;
    };

    const ensurePanelBody = (it: Item, itemIndex: number) => {
      if (!panelContainer || leftPanel) return; // React panel covers custom body
  let panelBody = panelContainer.querySelector<HTMLDivElement>('.pswp-panel-body');
      if (!panelBody) {
        panelBody = document.createElement('div');
        panelBody.className = 'pswp-panel-body flex flex-col gap-4 text-white/90';
        const footerExisting = panelContainer.querySelector('.pswp-panel-footer');
        if (footerExisting) panelContainer.insertBefore(panelBody, footerExisting); else panelContainer.appendChild(panelBody);
      }
      const short = (it.caption || '').slice(0, 200);
      const more = (it.caption || '').length > 200;
      let exifHtml = '';
      if (it.exif) {
        const parts = Object.entries(it.exif)
          .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
          .map(([k, v]) => `<li class="flex items-center justify-between gap-3 text-xs uppercase tracking-wide"><span class="text-white/60">${k}</span><span class="font-semibold text-white/90">${v}</span></li>`);
        if (parts.length) {
          exifHtml = `<ul class="mt-4 space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">${parts.join('')}</ul>`;
        }
      }
      const thumbs = items.map((itm, idx) => {
        const active = idx === itemIndex;
        const thumbSrc = itm.src || itm.video?.poster || itm.video?.src || '';
        const thumbAlt = (itm.title || itm.caption || `Slide ${idx + 1}`).replace(/"/g, '');
        const buttonClasses = active
          ? 'border-white/80 shadow-lg opacity-100'
          : 'border-white/10 opacity-70 hover:opacity-100 focus-visible:opacity-100';
        const imgClasses = active ? 'opacity-100' : 'opacity-80';
        return `<button type="button" data-pswp-go="${idx}" aria-label="Go to slide ${idx + 1}" aria-pressed="${active}" class="pswp-thumb inline-flex h-14 w-[72px] items-center justify-center overflow-hidden rounded-md border ${buttonClasses} bg-black/40 transition focus:outline-none focus:ring-2 focus:ring-white/40"><img src="${thumbSrc}" alt="${thumbAlt}" loading="lazy" class="h-full w-full object-cover ${imgClasses}" /></button>`;
      }).join('');
      panelBody.innerHTML = `
        <div class="pswp-thumb-bar grid grid-cols-3 gap-2 mb-3 sm:mb-4">${thumbs}</div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner">
          <div class="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Now viewing</div>
          <div class="text-lg font-semibold leading-snug text-white">${it.title || 'Untitled image'}</div>
          ${it.caption ? `<p class="mt-2 text-sm leading-relaxed text-white/75">${short}${more ? '…' : ''}</p>` : '<p class="mt-2 text-sm text-white/60">No description provided.</p>'}
          ${more ? '<button data-pswp-readmore class="mt-3 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40">Read more</button>' : ''}
          ${exifHtml}
        </div>
      `;
      const slideCountEl = panelContainer.querySelector('.pswp-slide-count');
      if (slideCountEl) slideCountEl.textContent = `SLIDE ${itemIndex + 1} / ${items.length}`;
    };

    const ensureFooterControls = (controls: HTMLDivElement) => {
      if (!panelContainer) return;
      if (!panelContainer.querySelector('.pswp-panel-footer')) {
        const footer = document.createElement('div');
        footer.className = 'pswp-panel-footer';
        Object.assign(footer.style, {
          position: 'sticky',
          bottom: '0',
          left: '0',
          right: '0',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(180deg,rgba(10,10,10,0.88),rgba(5,5,5,0.94))',
          backdropFilter: 'blur(14px)',
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'center',
          borderRadius: '14px',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.35)'
        } as CSSStyleDeclaration);
        footer.appendChild(controls);
        panelContainer.appendChild(footer);
      }
    };

    const wireControlButtons = (controls: HTMLDivElement, it: Item) => {
      // --------------------------- DOWNLOAD ---------------------------
      controls.querySelector('[data-pswp-download]')?.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const url = it.src || it.video?.src || '';
        if (!url) return;
        try {
          const res = await fetch(url, { mode: 'cors' });
          const blob = await res.blob();
          const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
            a.href = objectUrl;
            a.download = ((it.title || 'media').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-.]/g,'') || 'download') + '.' + ext;
            document.body.appendChild(a); a.click();
            setTimeout(() => { URL.revokeObjectURL(objectUrl); a.remove(); }, 1500);
          showToast('Download started');
        } catch {
          // fallback open
          const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.click();
        }
      });

      // ----------------------------- PRINT ----------------------------
      controls.querySelector('[data-pswp-print]')?.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const rawUrl = it.src || it.video?.poster || it.video?.src || '';
        if (!rawUrl) return;
        const isVideo = Boolean(it.video?.src);
        // For video we attempt to print poster frame if available
        if (isVideo && !it.video?.poster) {
          // If no poster, just open video URL in new tab as fallback
          window.open(rawUrl, '_blank','noopener');
          return;
        }
        const title = (it.title || 'Print').replace(/[<>]/g,'');
        const printWin = window.open('', 'pswpPrint', 'noopener,width=920,height=760');
        if (!printWin) return;
        let dataUrl: string | null = null;
        try {
          const res = await fetch(rawUrl, { mode: 'cors' });
          const blob = await res.blob();
          // If blob is very small could be error; guard
          if (blob.size > 0) {
            // Convert to data URL for guaranteed availability in new window
            dataUrl = await new Promise<string>((resolve, reject) => {
              const fr = new FileReader();
              fr.onerror = () => reject(new Error('read-fail'));
              fr.onload = () => resolve(String(fr.result));
              fr.readAsDataURL(blob);
            });
          }
        } catch { /* ignore fetch errors; fallback to raw url */ }
        const imgSrc = dataUrl || rawUrl;
        const html = `<!DOCTYPE html><html><head><title>${title}</title><meta charset='utf-8'/><style>
          html,body{margin:0;padding:0;height:100%;background:#111;color:#eee;font-family:system-ui,sans-serif}
          body{display:flex;align-items:center;justify-content:center}
          .frame{max-width:100%;max-height:100%;object-fit:contain;}
          @media print { body{background:#000;} .hint{display:none;} }
          .hint{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);font:11px/1.2 system-ui,sans-serif;letter-spacing:.08em;opacity:.55}
        </style></head><body>
          <img id='toPrint' alt='${title}' class='frame' src='${imgSrc}' />
          <div class='hint'>Preparing print...</div>
          <script>
            const img = document.getElementById('toPrint');
            function doPrint(){ try{ window.focus(); setTimeout(()=>{ window.print(); }, 60); }catch(e){} }
            if (img.complete) { doPrint(); } else { img.addEventListener('load', doPrint, { once:true }); img.addEventListener('error', ()=>{ document.body.innerHTML='<p style="color:#eee;font:14px system-ui">Failed to load media.</p>'; }); }
          <\/script>
        </body></html>`;
        try { printWin.document.open(); printWin.document.write(html); printWin.document.close(); } catch {}
      });

      // ----------------------------- SHARE ----------------------------
      controls.querySelector('[data-pswp-share]')?.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const existing = document.getElementById('pswp-share-pop');
        if (existing) { existing.remove(); return; }
        const shareUrlRaw = it.src || it.video?.src || window.location.href;
        const shareUrl = encodeURIComponent(shareUrlRaw);
        const text = encodeURIComponent(it.title || 'Check this out');
        const pop = document.createElement('div');
        pop.id = 'pswp-share-pop';
        pop.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[2147483646] rounded-lg border border-white/15 bg-black/85 backdrop-blur px-3 py-3 shadow-2xl flex flex-col gap-3 w-64';
        pop.innerHTML = `
          <div class='flex items-center justify-between'>
            <div class='text-xs font-semibold tracking-wide uppercase text-white/60'>Share</div>
            <button type='button' data-close class='text-white/50 hover:text-white text-sm' aria-label='Close share panel'>&times;</button>
          </div>
          <div class='grid grid-cols-3 gap-2 text-[11px]'>
            <button data-s="x" class='pswp-share-btn'>X</button>
            <button data-s="facebook" class='pswp-share-btn'>Facebook</button>
            <button data-s="linkedin" class='pswp-share-btn'>LinkedIn</button>
            <button data-s="reddit" class='pswp-share-btn'>Reddit</button>
            <button data-s="pinterest" class='pswp-share-btn'>Pinterest</button>
            <button data-s="email" class='pswp-share-btn'>Email</button>
            <button data-s="whatsapp" class='pswp-share-btn'>WhatsApp</button>
            <button data-s="telegram" class='pswp-share-btn'>Telegram</button>
            <button data-s="copy" class='pswp-share-btn col-span-3 !mt-1'>Copy Link</button>
          </div>
        `;
        if (!document.getElementById('pswp-share-pop-styles')) {
          const style = document.createElement('style');
          style.id = 'pswp-share-pop-styles';
          style.textContent = `#pswp-share-pop .pswp-share-btn{background:rgba(255,255,255,0.09);padding:6px 6px;border-radius:6px;color:#fff;transition:.18s;display:flex;align-items:center;justify-content:center;min-height:34px;font-weight:500;line-height:1.1}#pswp-share-pop .pswp-share-btn:hover{background:rgba(255,255,255,0.2)}#pswp-share-pop .pswp-share-btn:active{background:rgba(255,255,255,0.3)}`;
          document.head.appendChild(style);
        }
        document.body.appendChild(pop);
        const openWin = (u: string) => { window.open(u, '_blank','noopener,noreferrer'); };
        const map: Record<string,string> = {
          x: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
          reddit: `https://www.reddit.com/submit?url=${shareUrl}&title=${text}`,
          pinterest: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${text}`,
          email: `mailto:?subject=${text}&body=${shareUrl}`,
          whatsapp: `https://api.whatsapp.com/send?text=${text}%20${shareUrl}`,
          telegram: `https://t.me/share/url?url=${shareUrl}&text=${text}`
        };
        const removePop = () => { try { pop.remove(); } catch {}; document.removeEventListener('mousedown', onOutside); document.removeEventListener('keydown', onKey); };
        const onOutside = (evt: MouseEvent) => { if (!pop.contains(evt.target as Node)) removePop(); };
        const onKey = (evt: KeyboardEvent) => { if (evt.key === 'Escape') removePop(); };
        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onKey);
        pop.querySelector('[data-close]')?.addEventListener('click', (ev) => { ev.preventDefault(); removePop(); });
        pop.querySelectorAll('[data-s]').forEach(btn => {
          btn.addEventListener('click', async (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            const key = (btn as HTMLElement).getAttribute('data-s') || '';
            if (key === 'copy') {
              try { await navigator.clipboard.writeText(shareUrlRaw); showToast('Link copied'); } catch { prompt('Copy link:', shareUrlRaw); }
              removePop();
              return;
            }
            const target = map[key];
            if (target) { openWin(target); removePop(); }
          });
        });
        // Focus first button for accessibility
        (pop.querySelector('[data-s]') as HTMLElement | null)?.focus?.();
      });
      controls.querySelector('[data-pswp-help]')?.addEventListener('click', () => toggleHelp());
      controls.querySelector('[data-pswp-meta]')?.addEventListener('click', () => {
        try {
          setPanelCollapsedEnhanced(!panelCollapsed, getPswp(pswpRef)?.el || null);
        } catch {};
      });
    };

    const onThumbClick = (ev: Event) => {
      const target = ev.currentTarget as HTMLElement;
      const idxStr = target.getAttribute('data-pswp-go');
    const idx = idxStr ? parseInt(idxStr, 10) : NaN;
  if (!isNaN(idx)) { try { getPswp(pswpRef)?.goTo?.(idx); } catch {} }
    };
    const wireThumbnails = () => {
      try { panelContainer?.querySelectorAll('[data-pswp-go]').forEach(btn => btn.addEventListener('click', onThumbClick)); } catch {}
    };

    const ensureFlipCardContainer = () => {
      const root = ensureOverlayRoot();
      if (!root) return null;
      if (!flipCardPortal) {
        flipCardPortal = document.createElement('div');
        flipCardPortal.className = 'pswp-flipcard-portal pointer-events-none flex h-full w-full items-end justify-center p-4 sm:p-6';
        Object.assign(flipCardPortal.style, {
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none'
        } as CSSStyleDeclaration);
        root.appendChild(flipCardPortal);
      }
      if (!flipCardRoot && flipCardPortal) {
        flipCardRoot = ReactDOM.createRoot(flipCardPortal);
      }
      return flipCardPortal;
    };

    const destroyFlipCardOverlay = () => {
      try { flipCardRoot?.unmount(); } catch {}
      flipCardRoot = null;
      if (flipCardPortal) {
        try { flipCardPortal.remove(); } catch {}
        flipCardPortal = null;
      }
      flipCardFlipped = false;
    };

    const updateFlipCardContent = (itemIndex: number) => {
      if (!panelCollapsed) {
        destroyFlipCardOverlay();
        return;
      }
      const item = items[itemIndex];
      if (!item) return;
      ensureFlipCardContainer();
      if (!flipCardRoot) return;
      const mediaSrc = item.video?.poster || item.video?.src || item.src || '';
      const altText = item.title || item.caption || 'Gallery media';
      const captionText = item.caption || '';
      const exifEntries = item.exif
        ? Object.entries(item.exif).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        : [];
      const handleToggle = () => { setFlipCardState(!flipCardFlipped, itemIndex); };

      flipCardRoot.render(
        <div className="pointer-events-none flex w-full justify-center">
          <div className="pointer-events-auto w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <FlipCard
              disableOverlay
              isFlipped={flipCardFlipped}
              onToggle={handleToggle}
              className={`pswp-flipcard w-full rounded-2xl bg-black/40 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur ${flipCardFlipped ? 'is-flipped' : ''}`}
              frontClassName="rounded-2xl bg-black/60 p-3 text-white sm:p-4 space-y-3"
              backClassName="rounded-2xl bg-black/80 p-3 text-white sm:p-4 space-y-4 overflow-y-auto max-h-[70vh]"
            >
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  {mediaSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc}
                      alt={altText}
                      loading="lazy"
                      className="h-52 w-full object-contain bg-black/30"
                    />
                  ) : (
                    <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      No preview available
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{item.title || 'Untitled image'}</div>
                  {captionText ? (
                    <p className="mt-1 line-clamp-3 text-xs text-white/70">{captionText}</p>
                  ) : null}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-white/60">Click or press Enter to flip for details</div>
              </div>
              <div className="flex h-full flex-col space-y-3">
                <div>
                  <div className="text-base font-semibold text-white">{item.title || 'Image details'}</div>
                  {captionText ? (
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{captionText}</p>
                  ) : (
                    <p className="mt-2 text-sm text-white/60">No description provided.</p>
                  )}
                </div>
                {exifEntries.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    {exifEntries.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-white/70"
                      >
                        <span>{label}</span>
                        <span className="font-semibold text-white/90">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/60">No technical metadata available.</p>
                )}
                <button
                  type="button"
                  className="self-start rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setFlipCardState(false, itemIndex);
                  }}
                >
                  Show image
                </button>
              </div>
            </FlipCard>
          </div>
        </div>
      );
    };

    const setFlipCardState = (flipped: boolean, itemIndexOverride?: number) => {
      const idx = typeof itemIndexOverride === 'number' ? itemIndexOverride : currentSlideIndex;
      const next = Boolean(flipped);
      if (flipCardFlipped === next) {
        if (panelCollapsed) updateFlipCardContent(idx);
        return;
      }
      flipCardFlipped = next;
      if (panelCollapsed) {
        updateFlipCardContent(idx);
      } else {
        destroyFlipCardOverlay();
      }
        try { updateUnderlyingMediaVisibility(); } catch {}
    };

    const syncFlipCardOverlay = (itemIndex?: number) => {
      const idx = typeof itemIndex === 'number' ? itemIndex : currentSlideIndex;
      if (!panelCollapsed) {
        destroyFlipCardOverlay();
        return;
      }
      ensureFlipCardContainer();
      updateFlipCardContent(idx);
        try { updateUnderlyingMediaVisibility(); } catch {}
    };

      // Hide underlying main media when collapsed (flipcard active) to avoid double view
      const updateUnderlyingMediaVisibility = () => {
        try {
          const pswpEl = getPswp(pswpRef)?.el;
          if (!pswpEl) return;
          const currentItem = pswpEl.querySelector('.pswp__item:not(.pswp__item--hidden)') as HTMLElement | null;
          if (!currentItem) return;
          const mediaTargets = Array.from(
            currentItem.querySelectorAll<HTMLElement>('img, video, .pswp__img, .pswp__zoom-wrap, .pswp__content')
          );
          if (!mediaTargets.length) return;
          const hide = Boolean(panelCollapsed && flipCardFlipped);
          pswpEl.classList.toggle('pswp--flipcard-active', hide);
          mediaTargets.forEach((media) => {
            if (hide) {
              if (media.dataset.origVisibility === undefined) media.dataset.origVisibility = media.style.visibility || '';
              if (media.dataset.origOpacity === undefined) media.dataset.origOpacity = media.style.opacity || '';
              if (media.dataset.origPointerEvents === undefined) media.dataset.origPointerEvents = media.style.pointerEvents || '';
              if (media.tagName === 'VIDEO') {
                try {
                  (media as HTMLVideoElement).pause();
                } catch {}
              }
              media.style.visibility = 'hidden';
              media.style.opacity = '0';
              media.style.pointerEvents = 'none';
              media.setAttribute('aria-hidden', 'true');
            } else {
              if (media.dataset.origVisibility !== undefined) {
                media.style.visibility = media.dataset.origVisibility;
                delete media.dataset.origVisibility;
              } else {
                media.style.visibility = '';
              }
              if (media.dataset.origOpacity !== undefined) {
                media.style.opacity = media.dataset.origOpacity;
                delete media.dataset.origOpacity;
              } else {
                media.style.opacity = '';
              }
              if (media.dataset.origPointerEvents !== undefined) {
                media.style.pointerEvents = media.dataset.origPointerEvents;
                delete media.dataset.origPointerEvents;
              } else {
                media.style.pointerEvents = '';
              }
              if (media.hasAttribute('aria-hidden')) {
                media.removeAttribute('aria-hidden');
              }
            }
          });
        } catch {}
      };

    const onInfoToggleEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ collapsed?: boolean; index?: number }>).detail;
      if (detail && typeof detail.collapsed === 'boolean') {
        setFlipCardState(detail.collapsed, typeof detail.index === 'number' ? detail.index : undefined);
      } else {
        setFlipCardState(!flipCardFlipped);
      }
    };

    // Attach now that the handler is declared (avoids use-before-define warning)
    window.addEventListener('pswp-toggle-info', onInfoToggleEvent);

    const createOverlay = (itemIndex: number, container: HTMLElement | null, reuse = false) => {
      const it = items[itemIndex];
      currentSlideIndex = itemIndex;
  try { window.__photoSwipeCurrentItem = it; window.__photoSwipeCurrentIndex = itemIndex; } catch {}
  try { window.__photoSwipeTotal = items.length; } catch {}
  try { window.__photoSwipeItems = items; } catch {}
  dispatchSlideChange({ item: it, index: itemIndex, total: items.length, items });
      const creating = !reuse || !overlayEl;
      if (creating) {
        const root = ensureOverlayRoot();
        ensurePanelContainer();
        ensurePanelHeader();
        const controls = document.createElement('div');
        controls.className = 'pointer-events-auto bg-black/40 backdrop-blur-sm text-white rounded-md px-2 py-2 flex items-center gap-2';
        Object.assign(controls.style, { pointerEvents: 'auto', position: 'relative', margin: '0' });
        controls.innerHTML = `
          <button type="button" data-pswp-meta class="pswp-btn" title="(I/F) Toggle info panel" aria-label="Toggle info panel">Info</button>
          <button type="button" data-pswp-download class="pswp-btn" aria-label="Download image">Download</button>
          <button type="button" data-pswp-print class="pswp-btn" aria-label="Print image">Print</button>
          <button type="button" data-pswp-share class="pswp-btn" aria-label="Share image">Share</button>
          <button type="button" data-pswp-help class="pswp-btn" title="(?) Keyboard help" aria-label="Show keyboard shortcuts">?</button>
        `;
        ensureFooterControls(controls);
        root.appendChild(panelContainer!);
        wireControlButtons(controls, it);
      }
      ensurePanelBody(it, itemIndex);
      wireThumbnails();
  try { updateSheetDialogA11y(itemIndex); } catch {}
      syncFlipCardOverlay(itemIndex);
  try { updateUnderlyingMediaVisibility(); } catch {}

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
      try { collapseHandleObserver?.disconnect(); } catch {}
      if (collapseHandle) { try { collapseHandle.remove(); } catch {}; collapseHandle = null; }
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
          const container = getPswp(pswpRef)?.el || null;
          applyPanelLayout(container);
          try { getPswp(pswpRef)?.updateSize?.(true); } catch {}
          try { manageSheetGestures(); } catch {}
          updateBackgroundInert();
          syncFlipCardOverlay();
          clampExpandedHeight();
          if (!panelCollapsed) {
            // ensure height stays within new bounds after rotation / resize
            if (panelContainer && getLayoutState().overlayMode) {
              panelContainer.style.height = sheetExpandedHeight + 'px';
            }
          }
          syncSheetFocusTrap();
          try { updateSheetDialogA11y(); } catch {}
        } catch {}
      }, 120);
    };
    window.addEventListener('resize', onResize);
  try { window.forceCreatePswpCollapseHandle = () => { try { applyPanelLayout(getPswp(pswpRef)?.el || null); } catch {}; }; } catch {}

  lightbox.on('open', (...args: unknown[]) => {
      const e = (args[0] as CustomEvent | undefined) || ({} as CustomEvent);
      try {
        // signal other UI (flip-cards) that photoswipe is open
  try { window.__photoSwipeOpen = true; } catch {}
  const container = getPswp(pswpRef)?.el || null;
        const startIndex = e?.detail?.index ?? index;
        // mount panel BEFORE creating overlay so initial slide-change event is received by React panel
        if (leftPanel) {
          mountPanel(leftPanel);
        }
        createOverlay(startIndex, container);
        // Early ensure handle after overlay creation
        try { applyPanelLayout(container); } catch {}
        // fade-in first visible media
        if (container) applyPanelLayout(container);
  // progress bar removed
        try {
          const current = container?.querySelector('.pswp__item:not(.pswp__item--hidden) *:is(img,video)') as HTMLElement | null;
          if (current instanceof HTMLElement) {
            current.style.opacity = '0';
            current.style.transition = 'opacity 400ms ease';
            requestAnimationFrame(() => { current.style.opacity = '1'; });
            if (current.tagName === 'VIDEO') lastVideoEl = current as HTMLVideoElement;
          }
        } catch {}
        updateBackgroundInert();
        syncSheetFocusTrap();
        try { updateSheetDialogA11y(startIndex); } catch {}
      } catch {}
    });

  // removed unused: layoutApplied (legacy from earlier layout logic)

  lightbox.on('change', (...args: unknown[]) => {
      const e = (args[0] as CustomEvent | undefined) || ({} as CustomEvent);
      try {
  const pswpInstance = getPswp(pswpRef);
        const container = pswpInstance?.el || null;
        try { lastVideoEl?.pause(); } catch {}
        const currentIndex = typeof pswpInstance?.currIndex === 'number' ? pswpInstance.currIndex : (e?.detail?.index ?? 0);
        createOverlay(currentIndex, container, true);
        // update flip card content & reset flipped state on slide change
        if (panelCollapsed) {
          // reset flip state on slide change when collapsed
          const fc = document.querySelector('.pswp-flipcard');
          fc?.classList.remove('is-flipped');
        }
        if (leftPanel && panelContainer && !panelRoot) {
          mountPanel(leftPanel);
        }
        if (container) applyPanelLayout(container);
        try {
          const idx = currentIndex;
          const it = items[idx];
          if (it) {
            window.dispatchEvent(new CustomEvent('pswp-slide-change', { detail: { item: it, index: idx, total: items.length, items } }));
          }
        } catch {}
        // fade-in current media
        try {
          const current = container?.querySelector('.pswp__item:not(.pswp__item--hidden) *:is(img,video)') as HTMLElement | null;
          if (current instanceof HTMLElement) {
            current.style.opacity = '0';
            current.style.transition = 'opacity 300ms ease';
            requestAnimationFrame(() => { current.style.opacity = '1'; });
            if (current.tagName === 'VIDEO') lastVideoEl = current as HTMLVideoElement;
          }
        } catch {}
        updateBackgroundInert();
        syncSheetFocusTrap();
        try { updateSheetDialogA11y(currentIndex); } catch {}
        try { updateUnderlyingMediaVisibility(); } catch {}
      } catch {}
    });

    // removed beforeChange artificial dispatch to avoid double updates

  lightbox.on('close', () => {
  try { window.__photoSwipeOpen = false; window.__photoSwipeCurrentItem = null; window.__photoSwipeCurrentIndex = null; } catch {}
      dispatchSlideChange({ item: null, index: null });
      restoreContainerStyles();
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
      removeInfoToggle();
      destroyFlipCardOverlay();
  // progress bar removed
      // defer unmount to avoid synchronous root unmount during render
  setTimeout(() => unmountPanel(), 0);
  try { window.__photoSwipeInstance = getPswp(pswpRef) || getLightbox(pswpRef); } catch {}
      onClose?.();
      try { hideHelp(); } catch {}
    });

    if (open) {
      lightbox.loadAndOpen(index);
    }

    const removeGlobalListeners = () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pswp-toggle-info', onInfoToggleEvent);
      const flipListener = (lightbox as unknown as Record<string, unknown>)._pswpFlipListener as EventListener | undefined;
      if (flipListener) document.removeEventListener('click', flipListener);
    };
    const teardownGestures = () => { try { detachSheetGestures(); } catch {} };
  const destroyInstance = () => { try { getLightbox(pswpRef)?.destroy?.(); } catch {} };
    const disconnectObservers = () => { try { collapseHandleObserver?.disconnect(); } catch {} };
    const removeCollapseHandle = () => {
      if (collapseHandle) {
        try { collapseHandle.remove(); } catch {}
        collapseHandle = null;
      }
    };
    const clearInert = () => {
      try {
  const pswpEl = getPswp(pswpRef)?.el as HTMLElement | undefined;
        if (pswpEl) {
          pswpEl.removeAttribute('aria-hidden');
          try { pswpEl.inert = false; } catch {}
        }
      } catch {}
    };
    const removeFocusTrap = () => {
      try {
        if (sheetKeydownListener && panelContainer) {
          panelContainer.removeEventListener('keydown', sheetKeydownListener as EventListener);
        }
      } catch {}
    };
    const cleanupEffect = () => {
      removeGlobalListeners();
      try { restoreContainerStyles(); } catch {}
      if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
      }
      removeInfoToggle();
      destroyFlipCardOverlay();
      teardownGestures();
      destroyInstance();
      disconnectObservers();
      removeCollapseHandle();
      clearInert();
      removeFocusTrap();
    };
    return cleanupEffect;
    // onClose deliberately excluded: close handling is wired via PhotoSwipe events
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, index, open]);

  function toggleHelp() { if (window.__pswpHelpVisible) { hideHelp(); } else { showHelp(); } }
  function showHelp() {
    if (window.__pswpHelpVisible) return;
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
    window.__pswpHelpVisible = true;
  }
  function hideHelp() {
    const el = document.getElementById('pswp-help');
    if (el) el.remove();
    window.__pswpHelpVisible = false;
  }

    // Removed unused announceSlide helper (previously throttled live region updates)

  // Added suppressHydrationWarning because PhotoSwipe mutates/constructs nearly all
  // of its DOM only after mount inside useEffect. In development React can flag
  // benign diffs (e.g. injected helper attrs or timing of injected nodes) as a
  // hydration mismatch. The static server markup for this component is just an
  // empty <section>; the client immediately enhances it, so we explicitly
  // suppress warnings for this root container.
  return <section ref={placeholderRef} aria-label="Lightbox gallery" style={{ display: 'block' }} suppressHydrationWarning />;
  // NOTE: replaced by semantic section would be better; kept div for minimal change.
};

export default GalleryLightbox;
