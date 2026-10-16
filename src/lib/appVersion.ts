import "server-only";

const FALLBACK_VERSION = "0.1.0";

export function getAppVersion(): string {
  return process.env.APP_VERSION
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.RENDER_GIT_COMMIT
    ?? process.env.GITHUB_SHA
    ?? FALLBACK_VERSION;
}

