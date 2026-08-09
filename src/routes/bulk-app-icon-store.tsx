import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
			await processBulkImage(job.url, (msg) => {
				setJobs((prev) =>
					prev.map((j) => (j.id === jobId ? { ...j, message: msg } : j)),
				);
			});
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId ? { ...j, status: "done", message: "Success" } : j,
				),
			);
		} catch (err) {
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId ? { ...j, status: "error", message: String(err) } : j,
				),
			);
		}
	};

	const handleProceed = async () => {
		setIsGlobalProcessing(true);
		// process sequentially to avoid blocking the browser with too many canvas operations
		for (const job of jobs) {
			if (job.status === "pending" || job.status === "error") {
				await processJob(job.id);
			}
		}
		setIsGlobalProcessing(false);
	};

	return (
		<div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
			<div className="card bg-base-200 shadow-sm">
				<div className="card-body">
					<h2 className="card-title">Bulk App Icon Store</h2>
					<p className="text-sm opacity-70">
						Paste image URLs (one per line). The system will fetch them, remove
						the background, generate 512x512 webp/png and Android mipmaps, and
						download a ZIP file per URL.
					</p>

					<div className="form-control w-full mt-4">
						<textarea
							className="textarea textarea-bordered h-40"
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
						<h3 className="card-title text-sm">Parsed URLs</h3>
						<div className="overflow-x-auto">
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
												<button
													className="btn btn-sm btn-outline"
													onClick={() => processJob(job.id)}
													disabled={job.status === "processing"}
												>
													{job.status === "processing" ? (
														<span className="loading loading-spinner loading-xs"></span>
													) : (
														"Download"
													)}
												</button>
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
