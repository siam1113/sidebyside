export type ImageSizePreset = "sm" | "md" | "lg" | "xl";

/** Pixel size for each preset. Kept as absolute px (not a Tailwind fixed-size class or w-full/%) --
 *  see ImageResultDetail.tsx for why a percentage-sized image inside JsonFlipCard's flip transform
 *  breaks Chromium's grid layout entirely. */
export const IMAGE_SIZE_PX: Record<ImageSizePreset, number> = {
  sm: 128,
  md: 224,
  lg: 320,
  xl: 448,
};

export const IMAGE_SIZE_LABELS: Record<ImageSizePreset, string> = {
  sm: "S",
  md: "M",
  lg: "L",
  xl: "XL",
};

export const IMAGE_SIZE_PRESETS: ImageSizePreset[] = ["sm", "md", "lg", "xl"];
