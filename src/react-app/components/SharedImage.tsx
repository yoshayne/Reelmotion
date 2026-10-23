import { useState, useCallback } from "react";

// Version constant — ONE place for all bucket proxy URLs.
// Must match STORAGE_VERSION in src/server/storage.ts.
// Bump process.env.STORAGE_VERSION (or this fallback) after a credential rotation.
export const STORAGE_VERSION = "1";

/** Append ?v=VERSION to /api/images/ URLs. Leave all other URLs unchanged. */
export function versionedUrl(src: string): string {
  if (!src || src.includes("X-Amz-")) return src;
  if (!src.startsWith("/api/images/")) return src;
  return src.includes("?") ? src : `${src}?v=${STORAGE_VERSION}`;
}

type SharedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

/**
 * Drop-in <img> replacement for bucket-proxied images.
 * - Adds ?v=VERSION to /api/images/ URLs for cache-busting.
 * - On first load error, retries once with &r=<timestamp>.
 * - Other sites' URLs (Mux, CDN, etc.) are passed through untouched.
 */
export default function SharedImage({ src, onError, ...props }: SharedImageProps) {
  const [retried, setRetried] = useState(false);
  const [activeSrc, setActiveSrc] = useState(() => versionedUrl(src));

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!retried && activeSrc.startsWith("/api/images/")) {
      setRetried(true);
      const base = activeSrc.split("&r=")[0];
      setActiveSrc(`${base}&r=${Date.now()}`);
    } else if (onError) {
      onError(e);
    }
  }, [retried, activeSrc, onError]);

  return <img {...props} src={activeSrc} onError={handleError} />;
}
