/** Resolve deck.json public assets against the current deck URL. */
export function resolveAssetURL(value, baseURI) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value;
  return new URL(String(value).replace(/^\/+/, ''), baseURI).href;
}

export function resolveAssets(assets = {}, baseURI) {
  const url = (value) => resolveAssetURL(value, baseURI);
  return {
    ...assets,
    images: Array.isArray(assets.images) ? assets.images.map(url) : assets.images,
    poster: url(assets.poster),
    video: url(assets.video),
    frames: url(assets.frames),
    mobileFrames: url(assets.mobileFrames),
  };
}
