/**
 * Returns the best available thumbnail URL for a video.
 * Falls back to a Mux-generated frame if no custom thumbnail exists.
 * Optionally picks a random frame using the video's duration.
 */
export function getThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  muxPlaybackId: string | null | undefined,
  muxDuration?: number | null,
  options?: { time?: number }
): string | null {
  if (thumbnailUrl) return thumbnailUrl;
  if (!muxPlaybackId) return null;

  // Pick a time: explicit > random within middle 80% of video > 5s default
  let time = options?.time ?? 5;
  if (muxDuration && muxDuration > 10) {
    const lo = muxDuration * 0.1;
    const hi = muxDuration * 0.9;
    time = lo + Math.random() * (hi - lo);
    time = Math.round(time * 10) / 10;
  }

  return `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=${time}&width=640&fit_mode=smartcrop`;
}
