const RELEASE_VERSION = '1.0.5';

export function getReleaseLabel(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  const deploymentId = typeof metadata.id === 'string' ? metadata.id.slice(0, 8) : 'local';
  return `v${RELEASE_VERSION} · ${deploymentId}`;
}
