import BulkWorker from "./bulkProcessing.worker?worker";

export async function processBulkImage(
	url: string,
	onProgress?: (msg: string) => void,
): Promise<{ blob: Blob; domain: string }> {
	return new Promise((resolve, reject) => {
		const worker = new BulkWorker();
		const jobId = Date.now().toString();

		worker.onmessage = (e: MessageEvent) => {
			const { type, jobId: msgJobId, message, blob, domain, error } = e.data;
			if (msgJobId !== jobId) return;

			if (type === "progress") {
				onProgress?.(message);
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
