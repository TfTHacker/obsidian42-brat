import {
	type RequestUrlParam,
	type RequestUrlResponse,
	requestUrl,
} from "obsidian";
import {
	GHRateLimitError,
	GitHubResponseError,
} from "../utils/GitHubAPIErrors";

const compareVersions = require("semver/functions/compare");
const semverCoerce = require("semver/functions/coerce");

export interface ReleaseVersion {
	version: string; // The tag name of the release
	prerelease: boolean; // Indicates if the release is a pre-release
}

export interface GitHubTokenInfo {
	validToken: boolean;
	currentScopes: string[];
	acceptedScopes: string[];
	acceptedPermissions: string[];
	expirationDate: string | null;
	rateLimit: {
		limit: number;
		remaining: number;
		reset: number;
		resource: string;
		used: number;
	};
	error: TokenValidationError;
}

export enum TokenErrorType {
	INVALID_PREFIX = "invalid_prefix",
	INVALID_FORMAT = "invalid_format",
	EXPIRED = "expired",
	INSUFFICIENT_SCOPE = "insufficient_scope",
	NONE = "none",
	UNKNOWN = "unknown",
}

export interface TokenValidationError {
	type: TokenErrorType;
	message: string;
	details: {
		validPrefixes?: string[];
		expirationDate?: string;
		requiredScopes?: string[];
		currentScopes?: string[];
	};
}

/**
 * Scrubs the repository URL to remove the protocol and .git extension
 */
export const scrubRepositoryUrl = (address: string): string => {
	// Case-insensitive replace for github.com
	let scrubbedAddress = address.replace(/https?:\/\/github\.com\//i, "");
	if (scrubbedAddress.endsWith("/")) {
		scrubbedAddress = scrubbedAddress.slice(0, -1);
	}
	// Case-insensitive check and remove for .git extension
	if (scrubbedAddress.toLowerCase().endsWith(".git")) {
		scrubbedAddress = scrubbedAddress.slice(0, -4);
	}
	return scrubbedAddress;
};

const TOKEN_PREFIXES = ["ghp_", "github_pat_"];
const TOKEN_REGEXP =
	/^(gh[ps]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})$/;
/**
 * Fetches GitHub token information by making a request that will fail
 * and extracting the information from the error headers
 *
 * @param personalAccessToken - GitHub personal access token
 * @param repository - Optional repository name (to be used when validating private repository access)
 * @returns Token information including scopes, permissions, and rate limits
 */
export const validateGitHubToken = async (
	personalAccessToken: string,
	repository?: string,
): Promise<GitHubTokenInfo> => {
	// Check scopes & token prefix
	const validScopes: string[] = ["repo", "public_repo", "metadata=read"];
	const hasValidPrefix = TOKEN_PREFIXES.some((prefix) =>
		personalAccessToken.toLowerCase().startsWith(prefix.toLowerCase()),
	);
	const hasValidFormat = TOKEN_REGEXP.test(personalAccessToken);

	if (!hasValidPrefix || !hasValidFormat) {
		const error: TokenValidationError = {
			type: !hasValidPrefix
				? TokenErrorType.INVALID_PREFIX
				: TokenErrorType.INVALID_FORMAT,
			message: "Invalid token format",
			details: {
				validPrefixes: TOKEN_PREFIXES,
			},
		};

		return {
			validToken: false,
			currentScopes: [],
			acceptedScopes: [],
			acceptedPermissions: [],
			expirationDate: null,
			rateLimit: {
				limit: 0,
				remaining: 0,
				reset: 0,
				resource: "",
				used: 0,
			},
			error,
		};
	}

	try {
		// Create a time-based "hash" that's likely an invalid repo in case no repository is given
		const timestamp = Date.now() % 1000;
		const repo = repository
			? repository
			: `user${timestamp}/repo${timestamp % 100}`;
		// Use an invalid URL to force an error response with headers
		await gitHubRequest({
			url: `https://api.github.com/repos/${repo}`,
			headers: {
				Authorization: `Token ${personalAccessToken}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (repository) {
			// We have tried to token with a specific repository which means it is valid
			return {
				validToken: true,
				currentScopes: [],
				acceptedScopes: [],
				acceptedPermissions: [],
				expirationDate: null,
				rateLimit: {
					limit: 0,
					remaining: 0,
					reset: 0,
					resource: "",
					used: 0,
				},
				error: {
					type: TokenErrorType.NONE,
					message: "No error",
					details: {},
				},
			};
		}
		throw new Error("Expected request to fail");
	} catch (error) {
		if (!(error instanceof GitHubResponseError)) {
			throw error;
		}

		const headers = error.headers;
		if (!headers) {
			throw new Error("No headers in GitHub response");
		}

		// Parse accepted permissions from header
		const rawExpirationDate = headers["github-authentication-token-expiration"];
		const parsedDate = rawExpirationDate ? new Date(rawExpirationDate) : null;
		const validDate =
			parsedDate && !Number.isNaN(parsedDate.getTime())
				? parsedDate.toISOString()
				: null;

		const tokenInfo: GitHubTokenInfo = {
			validToken: false,
			currentScopes: headers["x-oauth-scopes"]?.split(", ") ?? [],
			acceptedScopes: headers["x-accepted-oauth-scopes"]?.split(", ") ?? [],
			acceptedPermissions:
				headers["x-accepted-github-permissions"]?.split(", ") ?? [],
			expirationDate: validDate,
			rateLimit: {
				limit: Number.parseInt(headers["x-ratelimit-limit"] ?? "0", 10),
				remaining: Number.parseInt(headers["x-ratelimit-remaining"] ?? "0", 10),
				reset: Number.parseInt(headers["x-ratelimit-reset"] ?? "0", 10),
				resource: headers["x-ratelimit-resource"] ?? "",
				used: Number.parseInt(headers["x-ratelimit-used"] ?? "0", 10),
			},
			error: {
				type: TokenErrorType.NONE,
				message: "No error",
				details: {},
			},
		};

		// Check token expiration
		if (
			tokenInfo.expirationDate &&
			new Date(tokenInfo.expirationDate) < new Date()
		) {
			tokenInfo.error = {
				type: TokenErrorType.EXPIRED,
				message: "Token has expired",
				details: {
					expirationDate: tokenInfo.expirationDate,
				},
			};
			return tokenInfo;
		}

		// Check scopes
		const hasValidScope =
			tokenInfo.currentScopes.some((scope) => validScopes.includes(scope)) ||
			tokenInfo.acceptedPermissions.some((scope) =>
				validScopes.includes(scope),
			);

		if (!hasValidScope) {
			tokenInfo.error = {
				type: TokenErrorType.INSUFFICIENT_SCOPE,
				message:
					"Token lacks required scopes. Check documentation for requirements.",
				details: {
					currentScopes: [
						...tokenInfo.acceptedScopes,
						...tokenInfo.acceptedPermissions,
					],
				},
			};
			return tokenInfo;
		}

		tokenInfo.validToken = error.status === 404; // Token is valid if we get a 404
		return tokenInfo;
	}
};

export const isPrivateRepo = async (
	repository: string,
	debugLogging = true,
	accessToken = "",
): Promise<boolean> => {
	const URL = `https://api.github.com/repos/${repository}`;
	try {
		const response: RequestUrlResponse = await gitHubRequest({
			url: URL,
			headers: accessToken
				? {
						Authorization: `Token ${accessToken}`,
					}
				: {},
		});
		const data = response.json;
		return data.private;
	} catch (error) {
		// Special handling for rate limit errors
		if (error instanceof GHRateLimitError) {
			throw error; // Rethrow rate limit errors
		}
		if (debugLogging) console.log("error in isPrivateRepo", URL, error);
		return false;
	}
};

/**
 * Fetches available release versions from a GitHub repository
 *
 * @param repository - path to GitHub repository in format USERNAME/repository
 * @returns array of version strings, or null if error
 */
export const fetchReleaseVersions = async (
	repository: string,
	debugLogging = true,
	accessToken = "",
): Promise<ReleaseVersion[] | null> => {
	const apiUrl = `https://api.github.com/repos/${repository}/releases`;
	try {
		const response: RequestUrlResponse = await gitHubRequest({
			url: `${apiUrl}?per_page=100`,
			headers: accessToken
				? {
						Authorization: `Token ${accessToken}`,
					}
				: {},
		});
		const data = response.json;
		return data.map((release: { tag_name: string; prerelease: boolean }) => ({
			version: release.tag_name,
			prerelease: release.prerelease,
		}));
	} catch (error) {
		if (
			error instanceof GHRateLimitError ||
			error instanceof GitHubResponseError
		) {
			// Special handling for rate limit errors
			throw error; // Rethrow rate limit errors
		}

		if (debugLogging)
			console.log("Error in fetchReleaseVersions", apiUrl, error);
		return null;
	}
};

/**
 * pulls from github a release file by its version number
 *
 * @param repository - path to GitHub repository in format USERNAME/repository
 * @param version    - version of release to retrive
 * @param fileName   - name of file to retrieve from release
 *
 * @returns contents of file as string from the repository's release
 */
export const grabReleaseFileFromRepository = async (
	release: Release,
	fileName: string,
	debugLogging = true,
	isPrivate = false,
	personalAccessToken = "",
): Promise<string | null> => {
	try {
		// get the asset based on the asset url in the release
		// We can use this both for private and public repos
		const asset = release.assets.find(
			(asset: { name: string }) => asset.name === fileName,
		);
		if (!asset) {
			return null;
		}

		const headers: Record<string, string> = {
			Accept: "application/octet-stream",
		};

		// Authenticated requests get a higher rate limit, only needed for private repositories here
		if (isPrivate && personalAccessToken) {
			headers.Authorization = `Token ${personalAccessToken}`;
		}

		// Download from the asset URL if it's a private repo, otherwise use the browser download URL
		const downloadUrl = isPrivate ? asset.url : asset.browser_download_url;
		const response = await requestUrl({
			url: downloadUrl,
			headers,
		});
		return response.status !== 200 ? null : response.text;
	} catch (error) {
		// Special handling for rate limit errors
		if (error instanceof GHRateLimitError) {
			throw error;
		}
		if (debugLogging)
			console.log("error in grabReleaseFileFromRepository", release, error);
		return null;
	}
};

export interface CommunityPlugin {
	id: string;
	name: string;
	author: string;
	description: string;
	repo: string;
}

export const grabCommmunityPluginList = async (
	debugLogging = true,
): Promise<CommunityPlugin[] | null> => {
	const pluginListUrl =
		"https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json";
	try {
		const response: RequestUrlResponse = await requestUrl({
			url: pluginListUrl,
		});
		return response.status === 404
			? null
			: (response.json as CommunityPlugin[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityPluginList", error);
		return null;
	}
};

export interface CommunityTheme {
	name: string;
	author: string;
	repo: string;
}

export const grabCommmunityThemesList = async (
	debugLogging = true,
): Promise<CommunityTheme[] | null> => {
	const themesUrl =
		"https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-css-themes.json";
	try {
		const response: RequestUrlResponse = await requestUrl({ url: themesUrl });
		return response.status === 404 ? null : (response.json as CommunityTheme[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemesList", error);
		return null;
	}
};

export const grabCommmunityThemeCssFile = async (
	repositoryPath: string,
	betaVersion = false,
	debugLogging = false,
): Promise<string | null> => {
	const themesUrl = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/theme${betaVersion ? "-beta" : ""}.css`;
	try {
		const response: RequestUrlResponse = await requestUrl({ url: themesUrl });
		return response.status === 404 ? null : response.text;
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemeCssFile", error);
		return null;
	}
};

export const grabCommmunityThemeManifestFile = async (
	repositoryPath: string,
	debugLogging = true,
): Promise<string | null> => {
	const themesUrl = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/manifest.json`;
	try {
		const response: RequestUrlResponse = await requestUrl({ url: themesUrl });
		return response.status === 404 ? null : response.text;
	} catch (error) {
		if (debugLogging)
			console.log("error in grabCommmunityThemeManifestFile", error);
		return null;
	}
};

const checksum = (str: string): number => {
	let sum = 0;
	for (let i = 0; i < str.length; i++) {
		sum += str.charCodeAt(i);
	}
	return sum;
};

export const checksumForString = (str: string): string => {
	return checksum(str).toString();
};

export const grabChecksumOfThemeCssFile = async (
	repositoryPath: string,
	betaVersion: boolean,
	debugLogging: boolean,
): Promise<string> => {
	const themeCss = await grabCommmunityThemeCssFile(
		repositoryPath,
		betaVersion,
		debugLogging,
	);
	return themeCss ? checksumForString(themeCss) : "0";
};

interface CommitInfo {
	commit: {
		committer?: {
			date?: string;
		};
	};
}

export const grabLastCommitInfoForFile = async (
	repositoryPath: string,
	path: string,
	debugLogging = true,
): Promise<CommitInfo[] | null> => {
	const url = `https://api.github.com/repos/${repositoryPath}/commits?path=${path}&page=1&per_page=1`;
	try {
		const response: RequestUrlResponse = await requestUrl({ url: url });
		return response.status === 404 ? null : (response.json as CommitInfo[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabLastCommitInfoForAFile", error);
		return null;
	}
};

export const grabLastCommitDateForFile = async (
	repositoryPath: string,
	path: string,
): Promise<string> => {
	const test: CommitInfo[] | null = await grabLastCommitInfoForFile(
		repositoryPath,
		path,
	);
	if (test && test.length > 0 && test[0].commit.committer?.date) {
		return test[0].commit.committer.date;
	}
	return "";
};

export type Release = {
	url: string;
	tag_name: string;
	name: string;
	published_at: string;
	prerelease: boolean;
	assets: {
		name: string;
		url: string;
		browser_download_url: string;
	}[];
};

/**
 * Gets either a specific release or the latest release from a GitHub repository
 *
 * @param repositoryPath - Repository path in format username/repository
 * @param version - Optional version/tag to fetch. If not provided, fetches latest release
 * @param includePrereleases - Whether to include pre-releases in the results (default: false)
 * @param debugLogging - Enable debug logging (default: false)
 * @param isPrivate - Whether the repository is private (default: false)
 * @param personalAccessToken - GitHub personal access token for private repos
 * @returns Promise<Release | null> Release information or null if not found/error
 *
 * @example
 * // Get latest release
 * const release = await grabReleaseFromRepository('username/repo');
 *
 * // Get specific version
 * const release = await grabReleaseFromRepository('username/repo', '1.0.0');
 *
 * // Include pre-releases
 * const beta = await grabReleaseFromRepository('username/repo', undefined, true);
 *
 * // Access private repository
 * const private = await grabReleaseFromRepository('username/repo', undefined, false, false, true, 'token');
 */
export const grabReleaseFromRepository = async (
	repositoryPath: string,
	version?: string,
	includePrereleases = false,
	debugLogging = false,
	isPrivate = false,
	personalAccessToken?: string,
): Promise<Release | null> => {
	try {
		const apiUrl =
			version && version !== "latest"
				? `https://api.github.com/repos/${repositoryPath}/releases/tags/${version}`
				: `https://api.github.com/repos/${repositoryPath}/releases`;

		const headers: Record<string, string> = {
			Accept: "application/vnd.github.v3+json",
		};

		if ((isPrivate && personalAccessToken) || personalAccessToken) {
			headers.Authorization = `Token ${personalAccessToken}`;
		}

		const response: RequestUrlResponse = await gitHubRequest({
			url: apiUrl,
			headers,
		});

		if (response.status === 404) return null;

		// If we fetch a specific version, we get a single release object
		const releases: Release[] =
			version && version !== "latest" ? [response.json] : response.json;

		if (debugLogging) {
			console.log(`grabReleaseFromRepository for ${repositoryPath}:`, releases);
		}
		return (
			releases
				.sort((a, b) => {
					try {
						// FIX for issue #105: Not all developers use semver compliant version tags
						// FIX for issue #114: Cannot handle releases with non-version names
						const aVersion = semverCoerce(a.tag_name, {
							includePrerelease: true,
							loose: true,
						});
						const bVersion = semverCoerce(b.tag_name, {
							includePrerelease: true,
							loose: true,
						});
						// Fallback to semverCoerce if compareVersions fails
						return compareVersions(bVersion, aVersion);
					} catch {
						const aDate = new Date(a.published_at).getTime();
						const bDate = new Date(b.published_at).getTime();
						if (aDate < bDate) return 1;
						if (aDate > bDate) return -1;
						return 0;
					}
				})
				.filter((release) => includePrereleases || !release.prerelease)[0] ??
			null
		);
	} catch (error) {
		// Special handling for rate limit errors
		if (debugLogging) {
			console.log(
				`Error in grabReleaseFromRepository for ${repositoryPath}:`,
				error,
			);
		}
		throw error; // Rethrow rate limit errors
	}
};

/**
 *	Wrapper for Obsidian `request` that catches GitHub Rate Limits
 *	@param options - Request options
 *	@param debugLogging - Enable debug logging (default: true)
 */
export const gitHubRequest = async (
	options: RequestUrlParam,
	debugLogging?: true,
): Promise<RequestUrlResponse> => {
	let limit = 0;
	let remaining = 0;
	let reset = 0;

	// Set User-Agent Header
	options.headers = {
		...options.headers,
		"User-Agent": "Obsidian/BRAT-Plugin",
	};

	try {
		const response = await requestUrl(options);
		return response;
	} catch (error) {
		// Update rate limits from response headers
		const gitHubError = new GitHubResponseError(error as Error);
		const headers = gitHubError.headers;
		if (headers) {
			limit = Number.parseInt(headers["x-ratelimit-limit"], 10);
			remaining = Number.parseInt(headers["x-ratelimit-remaining"], 10);
			reset = Number.parseInt(headers["x-ratelimit-reset"], 10);
		}
		if (gitHubError.status === 403 && remaining === 0) {
			const rateLimitError = new GHRateLimitError(
				limit,
				remaining,
				reset,
				options.url,
			);

			if (debugLogging) {
				console.error(
					"BRAT\nGitHub API rate limit exceeded:",
					`\nRequest: ${rateLimitError.requestUrl}`,
					`\nRate limits - Remaining: ${rateLimitError.remaining}`,
					`\nReset in: ${rateLimitError.getMinutesToReset()} minutes`,
				);
			}
			throw rateLimitError as GHRateLimitError;
		}

		if (debugLogging) {
			console.log("GitHub request failed:", error);
		}
		throw gitHubError as GitHubResponseError;
	}
};
