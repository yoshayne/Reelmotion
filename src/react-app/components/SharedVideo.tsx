import { useEffect, useRef, useState, useCallback } from "react";
import { versionedUrl } from "./SharedImage";

type SharedVideoProps = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string;
  poster?: string;
};

/**
 * <video> wrapper for bucket-proxied video files.
 * - Sets src directly on the element (never via <source>) and calls load().
 * - Adds ?v=VERSION to /api/images/ URLs.
 * - On first error, retries once with &r=<timestamp>.
 * - All other URLs (Mux HLS, CDN, etc.) are passed through untouched.
 */
export default function SharedVideo({ src, poster, onError, ...props }: SharedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [retried, setRetried] = useState(false);
  const activeSrc = useRef(versionedUrl(src));

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.src = activeSrc.current;
    if (poster) v.poster = poster;
    v.load();
  }, [poster]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = ref.current;
    if (!v) return;
    if (!retried && activeSrc.current.startsWith("/api/images/")) {
      setRetried(true);
      const base = activeSrc.current.split("&r=")[0];
      activeSrc.current = `${base}&r=${Date.now()}`;
      v.src = activeSrc.current;
      v.load();
    } else if (onError) {
      onError(e);
    }
  }, [retried, onError]);

  return <video ref={ref} poster={poster} onError={handleError} {...props} />;
}
