import { type RequestUrlParam, request } from "obsidian";
import { GHRateLimitError, GitHubResponseError } from "../utils/GitHubAPIErrors";

const compareVersions = require("semver/functions/compare");
const semverCoerce = require("semver/functions/coerce");

export interface ReleaseVersion {
	version: string; // The tag name of the release
	prerelease: boolean; // Indicates if the release is a pre-release
}

export const isPrivateRepo = async (repository: string, debugLogging = true, accessToken = ""): Promise<boolean> => {
	const URL = `https://api.github.com/repos/${repository}`;
	try {
		const response = await gitHubRequest({
			url: URL,
			headers: accessToken
				? {
						Authorization: `Token ${accessToken}`,
					}
				: {},
		});
		const data = await JSON.parse(response);
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
export const fetchReleaseVersions = async (repository: string, debugLogging = true, accessToken = ""): Promise<ReleaseVersion[] | null> => {
	const apiUrl = `https://api.github.com/repos/${repository}/releases`;
	try {
		const response = await gitHubRequest({
			url: `${apiUrl}?per_page=100`,
			headers: accessToken
				? {
						Authorization: `Token ${accessToken}`,
					}
				: {},
		});
		const data = await JSON.parse(response);
		return data.map((release: { tag_name: string; prerelease: boolean }) => ({
			version: release.tag_name,
			prerelease: release.prerelease,
		}));
	} catch (error) {
		if (error instanceof GHRateLimitError || error instanceof GitHubResponseError) {
			// Special handling for rate limit errors
			throw error; // Rethrow rate limit errors
		}

		if (debugLogging) console.log("Error in fetchReleaseVersions", apiUrl, error);
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
		const asset = release.assets.find((asset: { name: string }) => asset.name === fileName);
		if (!asset) {
			return null;
		}

		const headers: Record<string, string> = {
			Accept: "application/octet-stream",
		};

		// Authenticated requests get a higher rate limit
		if ((isPrivate && personalAccessToken) || personalAccessToken) {
			headers.Authorization = `Token ${personalAccessToken}`;
		}

		const download = await request({
			url: asset.url,
			headers,
		});
		return download === "Not Found" || download === `{"error":"Not Found"}` ? null : download;
	} catch (error) {
		// Special handling for rate limit errors
		if (error instanceof GHRateLimitError) {
			throw error;
		}
		if (debugLogging) console.log("error in grabReleaseFileFromRepository", URL, error);
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

export const grabCommmunityPluginList = async (debugLogging = true): Promise<CommunityPlugin[] | null> => {
	const pluginListUrl = "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json";
	try {
		const response = await request({ url: pluginListUrl });
		return response === "404: Not Found" ? null : ((await JSON.parse(response)) as CommunityPlugin[]);
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

export const grabCommmunityThemesList = async (debugLogging = true): Promise<CommunityTheme[] | null> => {
	const themesUrl = "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-css-themes.json";
	try {
		const response = await request({ url: themesUrl });
		return response === "404: Not Found" ? null : ((await JSON.parse(response)) as CommunityTheme[]);
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
		const response = await request({ url: themesUrl });
		return response === "404: Not Found" ? null : response;
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemeCssFile", error);
		return null;
	}
};

export const grabCommmunityThemeManifestFile = async (repositoryPath: string, debugLogging = true): Promise<string | null> => {
	const themesUrl = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/manifest.json`;
	try {
		const response = await request({ url: themesUrl });
		return response === "404: Not Found" ? null : response;
	} catch (error) {
		if (debugLogging) console.log("error in grabCommmunityThemeManifestFile", error);
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

export const grabChecksumOfThemeCssFile = async (repositoryPath: string, betaVersion: boolean, debugLogging: boolean): Promise<string> => {
	const themeCss = await grabCommmunityThemeCssFile(repositoryPath, betaVersion, debugLogging);
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
		const response = await request({ url: url });
		return response === "404: Not Found" ? null : (JSON.parse(response) as CommitInfo[]);
	} catch (error) {
		if (debugLogging) console.log("error in grabLastCommitInfoForAFile", error);
		return null;
	}
};

export const grabLastCommitDateForFile = async (repositoryPath: string, path: string): Promise<string> => {
	const test: CommitInfo[] | null = await grabLastCommitInfoForFile(repositoryPath, path);
	if (test && test.length > 0 && test[0].commit.committer?.date) {
		return test[0].commit.committer.date;
	}
	return "";
};

export type Release = {
	url: string;
	tag_name: string;
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

		const response = await gitHubRequest({
			url: apiUrl,
			headers,
		});

		if (response === "404: Not Found") return null;

		// If we fetch a specific version, we get a single release object
		const releases: Release[] = version && version !== "latest" ? [JSON.parse(response)] : JSON.parse(response);

		if (debugLogging) {
			console.log(`grabReleaseFromRepository for ${repositoryPath}:`, releases);
		}
		return (
			releases
				.sort((a, b) => {
					// FIX for issue #105: Not all developers use semver compliant version tags
					const aVersion = semverCoerce(a.tag_name, { includePrerelease: true, loose: true });
					const bVersion = semverCoerce(b.tag_name, { includePrerelease: true, loose: true });
					return compareVersions(bVersion, aVersion);
				})
				.filter((release) => includePrereleases || !release.prerelease)[0] ?? null
		);
	} catch (error) {
		// Special handling for rate limit errors
		if (debugLogging) {
			console.log(`Error in grabReleaseFromRepository for ${repositoryPath}:`, error);
		}
		throw error; // Rethrow rate limit errors
	}
};

/**
 *	Wrapper for Obsidian `request` that catches GitHub Rate Limits
 *	@param options - Request options
 *	@param debugLogging - Enable debug logging (default: true)
 */
export const gitHubRequest = async (options: RequestUrlParam, debugLogging?: true): Promise<string> => {
	let limit = 0;
	let remaining = 0;
	let reset = 0;

	try {
		const response = await request(options);
		return response;
	} catch (error) {
		// Update rate limits from response headers
		const gitHubError = new GitHubResponseError(error as Error);
		const headers = gitHubError.headers;
		if (headers) {
			limit = Number.parseInt(headers["x-ratelimit-limit"]);
			remaining = Number.parseInt(headers["x-ratelimit-remaining"]);
			reset = Number.parseInt(headers["x-ratelimit-reset"]);
		}
		if (gitHubError.status === 403 && remaining === 0) {
			const rateLimitError = new GHRateLimitError(limit, remaining, reset, options.url);

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
