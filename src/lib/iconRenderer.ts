export type IconShape = "square" | "round";

export interface IconDensity {
  name: string;
  size: number;
}

// Legacy launcher icon sizes (48dp base)
export const DENSITIES: IconDensity[] = [
  { name: "mdpi", size: 48 },
  { name: "hdpi", size: 72 },
  { name: "xhdpi", size: 96 },
  { name: "xxhdpi", size: 144 },
  { name: "xxxhdpi", size: 192 },
];

// Adaptive icon layers use a 108dp canvas (Android spec).
// The system masks the center 72dp (66.67%) as the visible area.
// Scale factor: 108 / 48 = 2.25
const ADAPTIVE_SCALE = 108 / 48;

export function adaptiveSize(legacySize: number): number {
  return Math.round(legacySize * ADAPTIVE_SCALE);
}

function renderIcon(
  sourceImage: HTMLImageElement,
  size: number,
  paddingPercent: number,
  bgColor: string,
  shape: IconShape,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Clip to circle for round shape (must happen BEFORE background fill
  // so the corners remain transparent in the exported PNG)
  if (shape === "round") {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  // Fill background (clipped to circle if round)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Calculate padded area
  const padding = size * (paddingPercent / 100);
  const availableSize = size - padding * 2;

  // Scale image to fit (contain) in the available area
  const imgAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > 1) {
    drawWidth = availableSize;
    drawHeight = availableSize / imgAspect;
  } else {
    drawHeight = availableSize;
    drawWidth = availableSize * imgAspect;
  }

  // Center the image
  const drawX = (size - drawWidth) / 2;
  const drawY = (size - drawHeight) / 2;

  ctx.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight);

  return canvas;
}

function renderForeground(
  sourceImage: HTMLImageElement,
  legacySize: number,
  paddingPercent: number,
): HTMLCanvasElement {
  const size = adaptiveSize(legacySize);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Transparent background — only the source image
  // The visible area is the inner 66.67% of the canvas (72dp of 108dp).
  // User padding is applied within that visible area.
  const visibleSize = size * (72 / 108);
  const visiblePadding = visibleSize * (paddingPercent / 100);
  const availableSize = visibleSize - visiblePadding * 2;

  const imgAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > 1) {
    drawWidth = availableSize;
    drawHeight = availableSize / imgAspect;
  } else {
    drawHeight = availableSize;
    drawWidth = availableSize * imgAspect;
  }

  const drawX = (size - drawWidth) / 2;
  const drawY = (size - drawHeight) / 2;

  ctx.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight);

  return canvas;
}

function renderBackground(
  legacySize: number,
  bgColor: string,
): HTMLCanvasElement {
  const size = adaptiveSize(legacySize);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

function renderMonochrome(
  sourceImage: HTMLImageElement,
  legacySize: number,
  paddingPercent: number,
): HTMLCanvasElement {
  // First render the foreground normally (already uses adaptive size internally)
  const fgCanvas = renderForeground(sourceImage, legacySize, paddingPercent);
  const ctx = fgCanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Convert to grayscale while preserving alpha
  const actualSize = fgCanvas.width;
  const imageData = ctx.getImageData(0, 0, actualSize, actualSize);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // data[i + 3] (alpha) is preserved
  }
  ctx.putImageData(imageData, 0, 0);

  return fgCanvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob from canvas"));
    }, "image/png");
  });
}

export function renderIconToDataURL(
  sourceImage: HTMLImageElement,
  size: number,
  paddingPercent: number,
  bgColor: string,
  shape: IconShape,
): string {
  const canvas = renderIcon(sourceImage, size, paddingPercent, bgColor, shape);
  return canvas.toDataURL("image/png");
}

export async function renderIconToBlob(
  sourceImage: HTMLImageElement,
  size: number,
  paddingPercent: number,
  bgColor: string,
  shape: IconShape,
): Promise<Blob> {
  const canvas = renderIcon(sourceImage, size, paddingPercent, bgColor, shape);
  return canvasToBlob(canvas);
}

export async function renderForegroundToBlob(
  sourceImage: HTMLImageElement,
  size: number,
  paddingPercent: number,
): Promise<Blob> {
  const canvas = renderForeground(sourceImage, size, paddingPercent);
  return canvasToBlob(canvas);
}

export async function renderBackgroundToBlob(
  size: number,
  bgColor: string,
): Promise<Blob> {
  const canvas = renderBackground(size, bgColor);
  return canvasToBlob(canvas);
}

export async function renderMonochromeToBlob(
  sourceImage: HTMLImageElement,
  size: number,
  paddingPercent: number,
): Promise<Blob> {
  const canvas = renderMonochrome(sourceImage, size, paddingPercent);
  return canvasToBlob(canvas);
}
