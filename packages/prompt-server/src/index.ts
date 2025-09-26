interface PromptData {
	prompt: string;
	tags: string[];
	generated_at: string;
	id: string;
	version: string;
}

interface Env {
	PROMPTS: KVNamespace;
	ALLOWED_ORIGINS?: string;
}

interface ErrorResponse {
	error: string;
	message: string;
}

interface HealthResponse {
	status: string;
	timestamp: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);
		const requestOrigin = request.headers.get("Origin");

		// Handle CORS preflight
		if (request.method === "OPTIONS") {
			return handleCORS(env, requestOrigin);
		}

		// Only allow GET requests
		if (request.method !== "GET") {
			return new Response("Method not allowed", {
				status: 405,
				headers: getCORSHeaders(env, requestOrigin),
			});
		}

		try {
			// Route handling
			switch (url.pathname) {
				case "/":
				case "/prompt":
					return await getCurrentPrompt(env, requestOrigin);

				case "/health":
					return getHealthCheck(env, requestOrigin);

				default:
					return new Response("Not found", {
						status: 404,
						headers: getCORSHeaders(env, requestOrigin),
					});
			}
		} catch (error) {
			console.error("Error handling request:", error);

			const errorResponse: ErrorResponse = {
				error: "Internal server error",
				message: "Failed to retrieve prompt",
			};

			return new Response(JSON.stringify(errorResponse), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...getCORSHeaders(env, requestOrigin),
				},
			});
		}
	},
};

async function getCurrentPrompt(
	env: Env,
	requestOrigin: string | null,
): Promise<Response> {
	try {
		const promptData = await env.PROMPTS.get("current-prompt");

		if (!promptData) {
			const errorResponse: ErrorResponse = {
				error: "No prompt available",
				message: "Daily prompt has not been generated yet",
			};

			return new Response(JSON.stringify(errorResponse), {
				status: 404,
				headers: {
					"Content-Type": "application/json",
					...getCORSHeaders(env, requestOrigin),
				},
			});
		}

		// Parse and validate the stored data
		let parsedPrompt: PromptData;
		try {
			parsedPrompt = JSON.parse(promptData) as PromptData;

			// Basic validation
			if (!parsedPrompt.prompt || !parsedPrompt.id) {
				throw new Error("Invalid prompt data structure");
			}
		} catch (parseError) {
			console.error("Failed to parse stored prompt data:", parseError);

			const errorResponse: ErrorResponse = {
				error: "Data corruption",
				message: "Stored prompt data is invalid",
			};

			return new Response(JSON.stringify(errorResponse), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...getCORSHeaders(env, requestOrigin),
				},
			});
		}

		// Add cache headers - cache for 1 hour since prompts are daily
		const cacheHeaders = {
			"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
			ETag: `"${parsedPrompt.id}"`, // Use the prompt ID as ETag
		};

		return new Response(JSON.stringify(parsedPrompt), {
			headers: {
				"Content-Type": "application/json",
				...getCORSHeaders(env, requestOrigin),
				...cacheHeaders,
			},
		});
	} catch (kvError) {
		console.error("KV store error:", kvError);

		const errorResponse: ErrorResponse = {
			error: "Storage unavailable",
			message: "Unable to retrieve prompt from storage",
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 503,
			headers: {
				"Content-Type": "application/json",
				...getCORSHeaders(env, requestOrigin),
			},
		});
	}
}

function getHealthCheck(env: Env, requestOrigin: string | null): Response {
	const healthResponse: HealthResponse = {
		status: "ok",
		timestamp: new Date().toISOString(),
	};

	return new Response(JSON.stringify(healthResponse), {
		headers: {
			"Content-Type": "application/json",
			...getCORSHeaders(env, requestOrigin),
		},
	});
}

function getCORSHeaders(
	env: Env,
	requestOrigin: string | null,
): Record<string, string> {
	const allowedOrigins = getAllowedOrigins(env);

	// Determine which origin to allow
	let allowOrigin: string | null = null;
	if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
		allowOrigin = requestOrigin;
	} else if (allowedOrigins.length === 1 && allowedOrigins[0] !== "*") {
		// If only one origin configured (and not wildcard), use it
		allowOrigin = allowedOrigins[0];
	} else if (allowedOrigins.includes("*")) {
		allowOrigin = "*";
	}
	// If no match, allowOrigin stays null (no CORS header)

	const headers: Record<string, string> = {
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400", // 24 hours
	};

	if (allowOrigin) {
		headers["Access-Control-Allow-Origin"] = allowOrigin;
	}

	return headers;
}

function getAllowedOrigins(env: Env): string[] {
	// Get from environment variable, fallback to wildcard for development
	const originsConfig = env.ALLOWED_ORIGINS || "*";

	if (originsConfig === "*") {
		return ["*"];
	}

	// Split comma-separated origins and trim whitespace
	return originsConfig.split(",").map((origin) => origin.trim());
}

function handleCORS(env: Env, requestOrigin: string | null): Response {
	return new Response(null, {
		status: 204,
		headers: getCORSHeaders(env, requestOrigin),
	});
}
