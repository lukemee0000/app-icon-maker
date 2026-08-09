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
		console.warn(
			"Local Vite dev proxy unavailable, trying direct fetch...",
			err,
		);
	}

	// 2. Direct fetch fallback
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch image: ${res.statusText}`);
	}
	return await res.blob();
}

self.onmessage = async (e: MessageEvent) => {
	const { url, jobId } = e.data;

	const reportProgress = (message: string) => {
		self.postMessage({ type: "progress", jobId, message });
	};

	try {
		// Extract domain
		let domain = "unknown";
		try {
			domain = new URL(url).hostname;
		} catch {
			domain = "download";
		}

		reportProgress("Fetching image...");
		const blob = await fetchImageBlob(url);

		// Create ImageBitmap
		const img = await createImageBitmap(blob);

		const zip = new JSZip();

		reportProgress("Generating logo.png...");
		// Generate logo.png (512x512)
		const canvas = new OffscreenCanvas(512, 512);
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, 512, 512);
			const size = Math.max(img.width, img.height);
			const scale = 512 / size;
			const w = img.width * scale;
			const h = img.height * scale;
			const x = (512 - w) / 2;
			const y = (512 - h) / 2;
			ctx.drawImage(img, x, y, w, h);

			const logoPngBlob = await canvas.convertToBlob({ type: "image/png" });
			if (logoPngBlob) {
				zip.file("logo.png", logoPngBlob);
			}
		}

		reportProgress("Removing background...");
		const bgRemovalConfig: Config = {};
		const webpBlob = await removeBackground(blob, bgRemovalConfig);

		reportProgress("Generating logo.webp...");
		const webpImg = await createImageBitmap(webpBlob);
		const webpCanvas = new OffscreenCanvas(512, 512);
		const webpCtx = webpCanvas.getContext("2d");
		if (webpCtx) {
			const size = Math.max(webpImg.width, webpImg.height);
			const scale = 512 / size;
			const w = webpImg.width * scale;
			const h = webpImg.height * scale;
			const x = (512 - w) / 2;
			const y = (512 - h) / 2;
			webpCtx.drawImage(webpImg, x, y, w, h);

			const finalWebpBlob = await webpCanvas.convertToBlob({
				type: "image/webp",
				quality: 0.8,
			});
			if (finalWebpBlob) {
				zip.file("logo.webp", finalWebpBlob);
			}
		}

		reportProgress("Generating mipmap icons...");
		await generateMipmapZip(zip, img, 0, 0, "#ffffff");

		reportProgress("Zipping...");
		const content = await zip.generateAsync({ type: "blob" });

		self.postMessage({
			type: "done",
			jobId,
			blob: content,
			domain,
		});
	} catch (err) {
		self.postMessage({
			type: "error",
			jobId,
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
