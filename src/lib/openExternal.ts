// Try to open a native app link first, then fall back to the web URL in a new tab.
// This is a best-effort cross-platform approach: app schemes are not guaranteed
// to work for every platform/version. We use a small iframe trick on mobile and
// an intent URL fallback for Android where appropriate.
export function openExternal(appUrl: string | undefined, webUrl: string) {
  if (typeof window === 'undefined') return;

  const openWeb = () => window.open(webUrl, '_blank', 'noopener,noreferrer');

  try {
    // If no explicit app url provided, try to derive a best-effort app scheme
    // from the web URL for popular platforms (instagram, twitter/x, facebook, tumblr, linkedin, youtube)
    if (!appUrl) {
      try {
        const parsed = new URL(webUrl);
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
        const path = parsed.pathname.replace(/\/$/, '');
        const firstSegment = path.split('/').filter(Boolean)[0] || '';

        switch (host) {
          case 'instagram.com':
            // instagram://user?username=USERNAME
            if (firstSegment) appUrl = `instagram://user?username=${firstSegment}`;
            break;
          case 'x.com':
          case 'twitter.com':
            // twitter://user?screen_name=USERNAME
            if (firstSegment) appUrl = `twitter://user?screen_name=${firstSegment}`;
            break;
          case 'facebook.com':
            // fb://facewebmodal/f?href={webUrl} opens the FB app to the given web url
            appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
            break;
          case 'tumblr.com':
            // tumblr blog deep link
            if (firstSegment) appUrl = `tumblr://x-callback-url/blog?blogName=${firstSegment}`;
            break;
          case 'linkedin.com':
            // company path typically /company/slug
            if (firstSegment === 'company') {
              const slug = path.split('/')[2];
              if (slug) appUrl = `linkedin://company/${slug}`;
            }
            break;
          case 'youtube.com':
          case 'youtu.be':
            // Try a generic youtube scheme; may or may not work depending on the platform
            appUrl = webUrl.replace(/^https?:/, 'youtube:');
            break;
          default:
            appUrl = undefined;
        }
      } catch (err) {
        // ignore URL parse errors and fallback to web only
        // eslint-disable-next-line no-console
        console.debug('openExternal: could not parse webUrl for app scheme', err);
        appUrl = undefined;
      }
    }

    const ua = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    if (isMobile) {
      // Use an iframe to attempt to open the app without changing the current page.
      if (appUrl) {
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
        // No app scheme available; open web URL directly
        openWeb();
      }
    } else {
      // On desktop try to navigate to the app URL first (this may redirect to the app)
      // then fallback shortly after to the web URL.
      if (appUrl) {
        const start = Date.now();
        // attempt to open app in the current tab
        window.location.href = appUrl;
        window.setTimeout(() => {
          // If still on the page after a short delay, open the web URL in a new tab.
          if (Date.now() - start < 2000) openWeb();
        }, 800);
      } else {
        // No app scheme available; open web URL directly in a new tab
        openWeb();
      }
    }
  } catch (err) {
    // If anything goes wrong, just open the web URL and log the error.
    // eslint-disable-next-line no-console
    console.error('openExternal error', err);
    openWeb();
  }
}
