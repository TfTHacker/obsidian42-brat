export class GHRateLimitError extends Error {
	constructor(
		public readonly limit: number,
		public readonly remaining: number,
		public readonly reset: number,
		public readonly requestUrl: string,
	) {
		const minutesToReset = Math.ceil((reset - Math.floor(Date.now() / 1000)) / 60);
		super(`GitHub API rate limit exceeded. Reset in ${minutesToReset} minutes.`);
	}

	public getMinutesToReset(): number {
		return Math.ceil((this.reset - Math.floor(Date.now() / 1000)) / 60);
	}
}

interface GitHubResponseHeaders {
	[key: string]: string;
}

export class GitHubResponseError extends Error {
	public readonly status: number;
	public readonly message: string;
	public readonly headers: GitHubResponseHeaders;

	constructor(error: Error) {
		super(`GitHub API error ${error}: ${error.message}`);

		this.message = error.message;
		const ghError = error as GitHubResponseError;
		this.status = ghError.status ?? 400;
		this.headers = ghError.headers ?? {};

		this.name = "GitHubResponseError";
	}
}
