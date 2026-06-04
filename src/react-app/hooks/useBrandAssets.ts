import { useState, useEffect } from "react";

interface BrandAssets {
  logo: string;
  tagline: string;
}

const LOGO_NAMES = ["ReelMotion Logo TM.png", "ReelMotion Logo TM", "logo"];
const TAGLINE_NAMES = ["Watch the culture tag.png", "Watch the culture tag", "tagline"];

const FALLBACK_LOGO = "";
const FALLBACK_TAGLINE = "";

let cachedAssets: BrandAssets | null = null;

export function useBrandAssets(): BrandAssets {
  const [assets, setAssets] = useState<BrandAssets>(cachedAssets ?? { logo: FALLBACK_LOGO, tagline: FALLBACK_TAGLINE });

  useEffect(() => {
    if (cachedAssets) return;
    fetch("/api/brand-assets/public")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        const logo = LOGO_NAMES.map(n => data[n]).find(Boolean) ?? FALLBACK_LOGO;
        const tagline = TAGLINE_NAMES.map(n => data[n]).find(Boolean) ?? FALLBACK_TAGLINE;
        cachedAssets = { logo, tagline };
        setAssets(cachedAssets);
      })
      .catch(() => {});
  }, []);

  return assets;
}
