export const config = {
	runtime: "edge",
};

export default async function handler(req: Request) {
	// Handle OPTIONS preflight request
	if (req.method === "OPTIONS") {
		return new Response(null, {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}

	const url = new URL(req.url);
	const targetUrl = url.searchParams.get("url");

	if (!targetUrl) {
		return new Response("Missing 'url' query parameter", { status: 400 });
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});

		if (!response.ok) {
			return new Response(`Failed to fetch image: ${response.statusText}`, {
				status: response.status,
			});
		}

		const contentType =
			response.headers.get("content-type") || "application/octet-stream";

		// Return the response with CORS headers
		return new Response(response.body, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch (error) {
		return new Response(`Error fetching image: ${String(error)}`, {
			status: 500,
		});
	}
}
