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
		// The old super() message ("GitHub API error <stringified error>: ...") was
		// immediately overwritten by this.message below, so it never surfaced. Pass the
		// real message straight through.
		super(error.message);

		// message is a declared class field, so it must be assigned here (a field with no
		// initializer would otherwise reset the Error-set message to undefined).
		this.message = error.message;
		const ghError = error as Partial<GitHubResponseError>;
		this.status = ghError.status ?? 400;
		this.headers = ghError.headers ?? {};

		this.name = "GitHubResponseError";
	}
}
