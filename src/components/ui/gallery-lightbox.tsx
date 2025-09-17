"use client";

import * as React from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import ReactDOM from 'react-dom/client';

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
          // Toggle both the panel collapse and dispatch toggle-info for flip cards
          setPanelCollapsedEnhanced(!panelCollapsed, getPswp(pswpRef)?.el || null);
          window.dispatchEvent(new CustomEvent('pswp-toggle-info'));
        } catch {}; 
        return; 
      }
      if (k === 'c') { jumpNextSameCategory(); }
    };

    document.addEventListener('keydown', onKey);

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
    panelCollapsed = val;
  if (panelContainer) {
      panelContainer.setAttribute('data-collapsed', String(panelCollapsed));
    }
    // when expanding, unflip card automatically
    if (!panelCollapsed) {
  // reset flipped visual state when expanding
      const fc = document.querySelector('.pswp-flipcard');
      if (fc) fc.classList.remove('is-flipped');
    }
    // re-apply layout to adjust offsets
    try { applyPanelLayout(container || lastContainer); } catch {}
    // update handle icon state
    if (collapseHandle) {
      collapseHandle.setAttribute('aria-expanded', String(!panelCollapsed));
      collapseHandle.innerHTML = panelCollapsed ? '&#x25B6;' : '&#x25C0;'; // ► ◀ arrow styles
      collapseHandle.title = panelCollapsed ? 'Expand panel' : 'Collapse panel';
    }
    // keep dialog semantics synced
    try { updateSheetDialogA11y(); } catch {}
  };

  // removed unused togglePanelCollapsed / toggleFlipCard (logic retained in setPanelCollapsed)

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

    const styleOverlayContentOffsets = (container: HTMLElement, leftOffset: number, overlayMode: boolean) => {
      const q = (sel: string): HTMLElement | null => container.querySelector<HTMLElement>(sel);
      const scrollWrap = q('.pswp__scroll-wrap');
      if (scrollWrap) {
        scrollWrap.style.position = 'relative';
        scrollWrap.style.left = leftOffset + 'px';
        scrollWrap.style.width = overlayMode ? '100%' : `calc(100% - ${leftOffset}px)`;
        scrollWrap.style.marginLeft = '0';
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
            padding: panelCollapsed ? '6px 12px 6px 12px' : '14px 18px 16px 18px',
            background: 'linear-gradient(180deg,rgba(15,15,15,0.88),rgba(5,5,5,0.92))',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 -4px 28px -2px rgba(0,0,0,0.55)',
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
          borderRadius: '0',
          borderRight: '1px solid rgba(255,255,255,0.15)',
          borderTop: 'none',
          background: 'rgba(15,15,15,0.88)',
          backdropFilter: 'blur(12px)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
          width: activePanelWidth + 'px',
          padding: panelCollapsed ? '6px' : '12px 12px 8px 12px',
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
          pointerEvents: 'auto', position: 'fixed', top: '0', left: '0', bottom: '0', width: computePanelWidth() + 'px', borderRight: '1px solid rgba(255,255,255,0.15)', boxSizing: 'border-box', padding: '12px 12px 8px 12px', zIndex: '2147483646', background: 'rgba(15,15,15,0.78)', backdropFilter: 'blur(12px)', overflow: 'auto', display: 'flex', flexDirection: 'column'
        } as CSSStyleDeclaration);
        panelContainer.setAttribute('data-collapsed', 'false');
      }
      return panelContainer;
    };

    const ensurePanelHeader = () => {
      if (!panelContainer) return null;
      let headerEl = panelContainer.querySelector<HTMLDivElement>('.pswp-meta-header');
      if (!headerEl) {
        headerEl = document.createElement('div');
        headerEl.className = 'pswp-meta-header flex items-center gap-2 mb-2 text-[11px] tracking-wide opacity-70';
        headerEl.innerHTML = `
          <button type="button" data-pswp-collapse aria-expanded="true" title="Collapse panel" style="background:rgba(255,255,255,0.1);border:0;color:#fff;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;line-height:1;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.2);">⮜</button>
          <div class="pswp-slide-count font-medium"></div>
        `;
        panelContainer.appendChild(headerEl);
        headerEl.querySelector('[data-pswp-collapse]')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const btn = headerEl!.querySelector('[data-pswp-collapse]') as HTMLButtonElement;
          const newCollapsed = !panelCollapsed;
          const containerElement = lastContainer || getPswp(pswpRef)?.el || null;
          
          // Call the enhanced setter that handles all side effects
          setPanelCollapsedEnhanced(newCollapsed, containerElement);
          
          // Update button visual state with animation
          const expanded = !newCollapsed;
          btn.setAttribute('aria-expanded', String(expanded));
          btn.title = expanded ? 'Collapse panel' : 'Expand panel';
          btn.style.transform = 'scale(0.9)';
          
          setTimeout(() => {
            btn.textContent = expanded ? '⮜' : '⮞';
            btn.style.transform = '';
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
        panelBody.className = 'pswp-panel-body flex flex-col';
        const footerExisting = panelContainer.querySelector('.pswp-panel-footer');
        if (footerExisting) panelContainer.insertBefore(panelBody, footerExisting); else panelContainer.appendChild(panelBody);
      }
      const short = (it.caption || '').slice(0, 200);
      const more = (it.caption || '').length > 200;
      let exifHtml = '';
      if (it.exif) {
        const parts = Object.entries(it.exif).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`);
        exifHtml = `<div class="text-sm text-muted-foreground mt-2">${parts.join('')}</div>`;
      }
      const thumbs = items.map((itm, idx) => {
        const active = idx === itemIndex ? 'outline:2px solid #fff;' : '';
  // prefer descriptive alt text when available
  const thumbAlt = itm.title ? itm.title.replace(/"/g, '') : `thumb ${idx+1}`;
  return `<button data-pswp-go="${idx}" style="background:#111;border:0;padding:0;margin:0;cursor:pointer;${active}display:inline-block;width:62px;height:48px;overflow:hidden;border-radius:4px;"><img src="${itm.src || itm.video?.src || ''}" alt="${thumbAlt}" style="width:100%;height:100%;object-fit:cover;display:block;" /></button>`;
      }).join('');
      panelBody.innerHTML = `
        <div class="pswp-thumb-bar flex flex-wrap gap-2 mb-4">${thumbs}</div>
        <div class="font-semibold line-clamp-2">${it.title || ''}</div>
        <div class="text-sm mt-2 leading-snug">${short}${more ? '...' : ''}</div>
        ${more ? '<button data-pswp-readmore class="mt-2 underline text-sm">Read more</button>' : ''}
        ${exifHtml}
      `;
      const slideCountEl = panelContainer.querySelector('.pswp-slide-count');
      if (slideCountEl) slideCountEl.textContent = `SLIDE ${itemIndex + 1} / ${items.length}`;
    };

    const ensureFooterControls = (controls: HTMLDivElement) => {
      if (!panelContainer) return;
      if (!panelContainer.querySelector('.pswp-panel-footer')) {
        const footer = document.createElement('div');
        footer.className = 'pswp-panel-footer';
        Object.assign(footer.style, { position: 'sticky', bottom: '0', left: '0', right: '0', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(6px)', padding: '8px 8px', display: 'flex', justifyContent: 'center' } as CSSStyleDeclaration);
        footer.appendChild(controls);
        panelContainer.appendChild(footer);
      }
    };

    const wireControlButtons = (controls: HTMLDivElement, it: Item) => {
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
        if ("share" in navigator && typeof navigator.share === 'function') {
          try { await navigator.share({ title: it.title, url: it.src || it.video?.src || '' }); } catch {}
        } else {
          try { await navigator.clipboard.writeText(it.src || it.video?.src || ''); } catch {}
          showToast('Image URL copied to clipboard');
        }
      });
      controls.querySelector('[data-pswp-help]')?.addEventListener('click', () => toggleHelp());
      controls.querySelector('[data-pswp-meta]')?.addEventListener('click', () => { 
        try { 
          setPanelCollapsedEnhanced(!panelCollapsed, getPswp(pswpRef)?.el || null);
          window.dispatchEvent(new CustomEvent('pswp-toggle-info')); 
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

    const createOverlay = (itemIndex: number, container: HTMLElement | null, reuse = false) => {
      const it = items[itemIndex];
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
          <button data-pswp-meta class="pswp-btn" title="(I/F) Toggle Info">Info</button>
          <button data-pswp-download class="pswp-btn">Download</button>
          <button data-pswp-print class="pswp-btn">Print</button>
          <button data-pswp-share class="pswp-btn">Share</button>
          <button data-pswp-help class="pswp-btn" title="(?) Keyboard Help">?</button>
        `;
        ensureFooterControls(controls);
        root.appendChild(panelContainer!);
        wireControlButtons(controls, it);
      }
      ensurePanelBody(it, itemIndex);
      wireThumbnails();
  try { updateSheetDialogA11y(itemIndex); } catch {}

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
      } catch {}
    });

    // removed beforeChange artificial dispatch to avoid double updates

  lightbox.on('close', () => {
  try { window.__photoSwipeOpen = false; window.__photoSwipeCurrentItem = null; window.__photoSwipeCurrentIndex = null; } catch {}
      dispatchSlideChange({ item: null, index: null });
      restoreContainerStyles();
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
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
      if (overlayEl) overlayEl.remove();
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

  return <section ref={placeholderRef} aria-label="Lightbox gallery" style={{ display: 'block' }} />;
  // NOTE: replaced by semantic section would be better; kept div for minimal change.
};

export default GalleryLightbox;
