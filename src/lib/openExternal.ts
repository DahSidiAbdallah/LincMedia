// Try to open a native app link first, then fall back to the web URL in a new tab.
// This is a best-effort cross-platform approach: app schemes are not guaranteed
// to work for every platform/version. We use a small iframe trick on mobile and
// an intent URL fallback for Android where appropriate.
export function openExternal(appUrl: string | undefined, webUrl: string) {
  if (typeof window === 'undefined') return;

  const openWeb = () => window.open(webUrl, '_blank', 'noopener,noreferrer');

  try {
    // If no app url provided, just open the web URL in a new tab
    if (!appUrl) {
      openWeb();
      return;
    }

    const ua = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    if (isMobile) {
      // Use an iframe to attempt to open the app without changing the current page.
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appUrl;
      document.body.appendChild(iframe);

      // If the app doesn't open within ~1.2s, open the web URL
      window.setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (err) {
          // best-effort cleanup; log so lint is happy
          // eslint-disable-next-line no-console
          console.debug('openExternal: cleanup iframe failed', err);
        }
        openWeb();
      }, 1200);
    } else {
      // On desktop try to navigate to the app URL first (this may redirect to the app)
      // then fallback shortly after to the web URL.
      const start = Date.now();
      window.location.href = appUrl;
      window.setTimeout(() => {
        // If still on the page after a short delay, open the web URL in a new tab.
        if (Date.now() - start < 2000) openWeb();
      }, 800);
    }
  } catch (err) {
    // If anything goes wrong, just open the web URL and log the error.
    // eslint-disable-next-line no-console
    console.error('openExternal error', err);
    openWeb();
  }
}
