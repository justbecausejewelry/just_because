export const DIAMOND_IMAGE_MAP: Record<string, string> = {
  Asscher: '/images/diamonds/asscher.png',
  Cushion: '/images/diamonds/cushion.png',
  Emerald: '/images/diamonds/emerald.png',
  Heart: '/images/diamonds/heart.png',
  Marquise: '/images/diamonds/marquise.png',
  Oval: '/images/diamonds/oval.png',
  Pear: '/images/diamonds/pear.png',
  Princess: '/images/diamonds/princess.png',
  Radiant: '/images/diamonds/radiant.png',
  Round: '/images/diamonds/round-diamond.png',
}

export function getDiamondImage(shape: string): string {
  const key = shape
    ? shape.charAt(0).toUpperCase() + shape.slice(1).toLowerCase()
    : 'Round'

  return DIAMOND_IMAGE_MAP[key] ?? DIAMOND_IMAGE_MAP.Round
}
