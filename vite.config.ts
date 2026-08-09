import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function corsProxyPlugin(): Plugin {
	return {
		name: "vite-cors-proxy",
		configureServer(server) {
			server.middlewares.use("/api/proxy", async (req, res) => {
				const urlParam = new URL(
					req.url || "",
					"http://localhost",
				).searchParams.get("url");
				if (!urlParam) {
					res.statusCode = 400;
					res.end("Missing url parameter");
					return;
				}
				try {
					const response = await fetch(urlParam, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						},
					});
					if (!response.ok) {
						res.statusCode = response.status;
						res.end(`Failed to fetch image: ${response.statusText}`);
						return;
					}
					const contentType =
						response.headers.get("content-type") ||
						"application/octet-stream";
					res.setHeader("Content-Type", contentType);
					res.setHeader("Access-Control-Allow-Origin", "*");
					const arrayBuffer = await response.arrayBuffer();
					res.end(Buffer.from(arrayBuffer));
				} catch (err) {
					res.statusCode = 500;
					res.end(`Proxy error: ${String(err)}`);
				}
			});
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [TanStackRouterVite(), tailwindcss(), react(), corsProxyPlugin()],
});
