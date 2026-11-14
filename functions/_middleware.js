// Cloudflare Pages middleware: send the bare pages.dev host to the custom domain.
// Only the exact host dhruvkothari.pages.dev redirects. Preview (preview.dhruvkothari.pages.dev),
// per-deploy hosts (abc123.dhruvkothari.pages.dev), the custom domain and localhost pass through.
const OLD_HOST = 'dhruvkothari.pages.dev';
const NEW_ORIGIN = 'https://dhruvkothari.com';

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === OLD_HOST) {
    return Response.redirect(`${NEW_ORIGIN}${url.pathname}${url.search}`, 301);
  }
  return next();
}
