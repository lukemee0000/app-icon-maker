import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import JSZip from "jszip";
import { processBulkImage } from "../lib/bulkProcessing";

export const Route = createFileRoute("/bulk-app-icon-store")({
	component: BulkAppIconStore,
});

type JobStatus = "pending" | "processing" | "done" | "error";

interface Job {
	id: string;
	url: string;
	status: JobStatus;
	message?: string;
	zipBlob?: Blob;
	domain?: string;
}

function BulkAppIconStore() {
	const [inputText, setInputText] = useState("");
	const [jobs, setJobs] = useState<Job[]>([]);
	const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputText(e.target.value);

		// Parse urls
		const urls = e.target.value
			.split("\n")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		setJobs((prev) => {
			return urls.map((url, i) => {
				const existing = prev.find((p) => p.url === url);
				if (existing) return existing;
				return {
					id: `${i}-${Date.now()}`,
					url,
					status: "pending",
				};
			});
		});
	};

	const processJob = async (jobId: string) => {
		const job = jobs.find((j) => j.id === jobId);
		if (!job) return;

		setJobs((prev) =>
			prev.map((j) =>
				j.id === jobId
					? { ...j, status: "processing", message: "Starting..." }
					: j,
			),
		);

		try {
			const { blob, domain } = await processBulkImage(job.url, (msg) => {
				setJobs((prev) =>
					prev.map((j) => (j.id === jobId ? { ...j, message: msg } : j)),
				);
			});
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId
						? {
								...j,
								status: "done",
								message: "Success",
								zipBlob: blob,
								domain,
							}
						: j,
				),
			);
		} catch (err) {
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId
						? { ...j, status: "error", message: String(err) }
						: j,
				),
			);
		}
	};

	const handleProceed = async () => {
		setIsGlobalProcessing(true);
		
		const promises = jobs
			.filter(job => job.status === "pending" || job.status === "error")
			.map(job => processJob(job.id));
			
		await Promise.all(promises);
		
		setIsGlobalProcessing(false);
	};

	const downloadIndividual = (job: Job) => {
		if (!job.zipBlob || !job.domain) return;
		const downloadUrl = URL.createObjectURL(job.zipBlob);
		const a = document.createElement("a");
		a.href = downloadUrl;
		a.download = `${job.domain}.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(downloadUrl);
	};

	const downloadAll = async () => {
		const completedJobs = jobs.filter((j) => j.status === "done" && j.zipBlob);
		if (completedJobs.length === 0) return;

		if (completedJobs.length === 1) {
			// Just download the single one normally
			downloadIndividual(completedJobs[0]);
			return;
		}

		// Merge all into a master zip
		const masterZip = new JSZip();
		for (const job of completedJobs) {
			if (job.zipBlob && job.domain) {
				// To avoid duplicate names, append job id if necessary
				masterZip.file(`${job.domain}-${job.id}.zip`, job.zipBlob);
			}
		}

		const content = await masterZip.generateAsync({ type: "blob" });
		const downloadUrl = URL.createObjectURL(content);
		const a = document.createElement("a");
		a.href = downloadUrl;
		a.download = "bulk-app-icons.zip";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(downloadUrl);
	};

	return (
		<div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
			<div className="card bg-base-200 shadow-sm">
				<div className="card-body">
					<h2 className="card-title">Bulk App Icon Store</h2>
					<p className="text-sm opacity-70">
						Paste image URLs (one per line). The system will fetch them, remove
						the background, generate 512x512 webp/png and Android mipmaps, and
						prepare a ZIP file per URL. Processing happens entirely in the
						background!
					</p>

					<div className="form-control w-full mt-4">
						<textarea
							className="textarea textarea-bordered w-full h-40"
							placeholder="https://example.com/logo.png"
							value={inputText}
							onChange={handleTextChange}
						/>
					</div>

					<div className="card-actions justify-end mt-4">
						<button
							className="btn btn-primary"
							onClick={handleProceed}
							disabled={isGlobalProcessing || jobs.length === 0}
						>
							{isGlobalProcessing ? (
								<>
									<span className="loading loading-spinner"></span>
									Processing...
								</>
							) : (
								"Proceed"
							)}
						</button>
					</div>
				</div>
			</div>

			{jobs.length > 0 && (
				<div className="card bg-base-200 shadow-sm">
					<div className="card-body">
						<div className="flex justify-between items-center">
							<h3 className="card-title text-sm">Parsed URLs</h3>
							{jobs.some((j) => j.status === "done") && (
								<button
									className="btn btn-sm btn-secondary"
									onClick={downloadAll}
								>
									Download All Completed
								</button>
							)}
						</div>
						<div className="overflow-x-auto mt-4">
							<table className="table">
								<thead>
									<tr>
										<th>URL</th>
										<th>Status</th>
										<th>Message</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{jobs.map((job) => (
										<tr key={job.id}>
											<td className="truncate max-w-xs" title={job.url}>
												{job.url}
											</td>
											<td>
												{job.status === "pending" && (
													<span className="badge">Pending</span>
												)}
												{job.status === "processing" && (
													<span className="badge badge-info">Processing</span>
												)}
												{job.status === "done" && (
													<span className="badge badge-success">Done</span>
												)}
												{job.status === "error" && (
													<span className="badge badge-error">Error</span>
												)}
											</td>
											<td className="text-sm opacity-70">
												{job.message || "-"}
											</td>
											<td>
												{job.status === "done" ? (
													<button
														className="btn btn-sm btn-outline btn-success"
														onClick={() => downloadIndividual(job)}
													>
														Download
													</button>
												) : (
													<button
														className="btn btn-sm btn-outline"
														onClick={() => processJob(job.id)}
														disabled={job.status === "processing"}
													>
														{job.status === "processing" ? (
															<span className="loading loading-spinner loading-xs"></span>
														) : (
															"Process"
														)}
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
