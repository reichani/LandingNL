const RELEASE_VERSION = '1.0.6';

// Public pages show only the product version; the build id is machine-readable
// in a <meta name="landingnl-build"> tag so support can still identify a release.
export function getPublicVersion() {
  return `v${RELEASE_VERSION}`;
}

export function buildMetaTag(env = {}) {
  return `<meta name="landingnl-build" content="${getReleaseLabel(env)}">`;
}

export function getReleaseLabel(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  const deploymentId = typeof metadata.id === 'string' ? metadata.id.slice(0, 8) : 'local';
  return `v${RELEASE_VERSION} · ${deploymentId}`;
}
