import BulkWorker from "./bulkProcessing.worker?worker";

export interface ProcessBulkImageOptions {
	onProgress?: (msg: string) => void;
	onModelReady?: () => void;
}

export async function processBulkImage(
	url: string,
	optionsOrOnProgress?: ((msg: string) => void) | ProcessBulkImageOptions,
): Promise<{ blob: Blob; domain: string }> {
	const options: ProcessBulkImageOptions =
		typeof optionsOrOnProgress === "function"
			? { onProgress: optionsOrOnProgress }
			: (optionsOrOnProgress ?? {});

	return new Promise((resolve, reject) => {
		const worker = new BulkWorker();
		const jobId = Date.now().toString();

		worker.onmessage = (e: MessageEvent) => {
			const { type, jobId: msgJobId, message, blob, domain, error } = e.data;

			if (type === "model-ready") {
				options.onModelReady?.();
				return;
			}

			if (msgJobId !== jobId) return;

			if (type === "progress") {
				options.onProgress?.(message);
			} else if (type === "done") {
				worker.terminate();
				resolve({ blob, domain });
			} else if (type === "error") {
				worker.terminate();
				reject(new Error(error));
			}
		};

		worker.onerror = (err) => {
			worker.terminate();
			reject(err);
		};

		worker.postMessage({ url, jobId });
	});
}
