import { removeBackground, type Config } from "@imgly/background-removal";
import JSZip from "jszip";
import { generateMipmapZip } from "./exportZip";

async function fetchImageBlob(url: string): Promise<Blob> {
  // 1. Try local Vite dev server proxy first
  try {
    const localProxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(localProxyUrl);
    if (res.ok) return await res.blob();
  } catch (err) {
    console.warn("Local Vite dev proxy unavailable, trying direct fetch...", err);
  }

  // 2. Direct fetch fallback
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.statusText}`);
  }
  return await res.blob();
}

export async function processBulkImage(
  url: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  // Extract domain
  let domain = "unknown";
  try {
    domain = new URL(url).hostname;
  } catch {
    // fallback if url is invalid
    domain = "download";
  }

  onProgress?.("Fetching image...");

  // Fetch image as blob with CORS fallback
  const blob = await fetchImageBlob(url);

  // Create HTMLImageElement from blob (do NOT set crossOrigin on blob: URLs)
  const img = new Image();
  const imgLoadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });
  img.src = URL.createObjectURL(blob);
  await imgLoadPromise;

  const zip = new JSZip();

  onProgress?.("Generating logo.png...");
  // Generate logo.png (512x512)
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    // Draw centered, fit inside 512x512
    const size = Math.max(img.width, img.height);
    const scale = 512 / size;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (512 - w) / 2;
    const y = (512 - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    const logoPngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (logoPngBlob) {
      zip.file("logo.png", logoPngBlob);
    }
  }

  onProgress?.("Removing background...");
  // Remove background
  const bgRemovalConfig: Config = {
    // Optionally specify public path to models if needed, else it defaults to unpkg
    // publicPath: "https://static.imgly.com/@imgly/background-removal-data/1.2.1/dist/"
  };
  const webpBlob = await removeBackground(blob, bgRemovalConfig);

  onProgress?.("Generating logo.webp...");
  // Resize webp to 512x512 and compress to 80%
  const webpImg = new Image();
  const webpLoadPromise = new Promise<void>((resolve, reject) => {
    webpImg.onload = () => resolve();
    webpImg.onerror = reject;
  });
  webpImg.src = URL.createObjectURL(webpBlob);
  await webpLoadPromise;

  const webpCanvas = document.createElement("canvas");
  webpCanvas.width = 512;
  webpCanvas.height = 512;
  const webpCtx = webpCanvas.getContext("2d");
  if (webpCtx) {
    const size = Math.max(webpImg.width, webpImg.height);
    const scale = 512 / size;
    const w = webpImg.width * scale;
    const h = webpImg.height * scale;
    const x = (512 - w) / 2;
    const y = (512 - h) / 2;
    webpCtx.drawImage(webpImg, x, y, w, h);

    // 80% quality webp
    const finalWebpBlob = await new Promise<Blob | null>((resolve) =>
      webpCanvas.toBlob(resolve, "image/webp", 0.8),
    );
    if (finalWebpBlob) {
      zip.file("logo.webp", finalWebpBlob);
    }
  }

  onProgress?.("Generating mipmap icons...");
  // Generate mipmaps with 0 padding and white background
  await generateMipmapZip(zip, img, 0, 0, "#ffffff");

  onProgress?.("Zipping and downloading...");
  const content = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${domain}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
  URL.revokeObjectURL(img.src);
  URL.revokeObjectURL(webpImg.src);

  onProgress?.("Done");
}
