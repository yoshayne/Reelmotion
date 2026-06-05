import { useState, useEffect } from "react";

interface BrandAssets {
  logo: string;
  tagline: string;
}

// Case-insensitive substring matching — finds assets regardless of exact name entered in admin
function matchAsset(data: Record<string, string>, keywords: string[]): string {
  const entries = Object.entries(data);
  for (const kw of keywords) {
    const found = entries.find(([name]) => name.toLowerCase().includes(kw.toLowerCase()));
    if (found) return found[1];
  }
  return "";
}

let cachedAssets: BrandAssets | null = null;

// Call this after uploading new brand assets so the next useBrandAssets call re-fetches
export function invalidateBrandAssetsCache() {
  cachedAssets = null;
}

export function useBrandAssets(): BrandAssets {
  const [assets, setAssets] = useState<BrandAssets>(cachedAssets ?? { logo: "", tagline: "" });

  useEffect(() => {
    if (cachedAssets) {
      setAssets(cachedAssets);
      return;
    }
    fetch("/api/brand-assets/public")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        // Logo: look for "logo" or "reelmotion" in the asset name
        const logo = matchAsset(data, ["logo", "reelmotion"]);
        // Tagline: look for "culture", "tag", "tagline", or "watch the" in the asset name
        const tagline = matchAsset(data, ["culture", "tagline", "tag", "watch the"]);
        cachedAssets = { logo, tagline };
        setAssets(cachedAssets);
      })
      .catch(() => {});
  }, []);

  return assets;
}
