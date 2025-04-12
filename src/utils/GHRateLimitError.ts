export class GHRateLimitError extends Error {
	constructor(
		public readonly limit: number,
		public readonly remaining: number,
		public readonly reset: number,
		public readonly requestUrl: string,
	) {
		const minutesToReset = Math.ceil((reset - Math.floor(Date.now() / 1000)) / 60);
		super(`GitHub API rate limit exceeded. Reset in ${minutesToReset} minutes.`);
		this.name = "GitHubRateLimitError";
	}

	public getMinutesToReset(): number {
		return Math.ceil((this.reset - Math.floor(Date.now() / 1000)) / 60);
	}
}
