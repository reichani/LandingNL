const RELEASE_VERSION = '1.0.6';

// Public pages show only the product version; the build id is machine-readable
// in a <meta name="landingnl-build"> tag so support can still identify a release.
export function getPublicVersion() {
  return `v${RELEASE_VERSION}`;
}

// Description, canonical URL and social preview tags. Kept in one place so the
// public pages stay consistent and a shared link renders with a real preview.
export function seoTags(env = {}, options = {}) {
  const { path = '/', title = 'LandingNL', description = 'A step-by-step guide to your first months in the Netherlands: municipal registration and BSN, DigiD, a bank account and a huisarts, with the official source behind each step.', noindex = false } = options;
  const base = (env.APP_BASE_URL || 'https://landingnl.com').replace(/\/$/, '');
  const url = `${base}${path}`;
  const robots = noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  return `<meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  ${robots}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LandingNL">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">`;
}

export function buildMetaTag(env = {}) {
  return `<meta name="landingnl-build" content="${getReleaseLabel(env)}">`;
}

export function getReleaseLabel(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  const deploymentId = typeof metadata.id === 'string' ? metadata.id.slice(0, 8) : 'local';
  return `v${RELEASE_VERSION} · ${deploymentId}`;
}
